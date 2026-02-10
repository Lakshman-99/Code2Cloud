package k8s

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"code2cloud/worker/internal/logging"
)

type LogStreamer struct {
	client     *Client
	logFactory *logging.Factory
	logger     *zap.Logger
	mu            sync.Mutex
	activeStreams map[string]context.CancelFunc
}

func NewLogStreamer(client *Client, logFactory *logging.Factory, logger *zap.Logger) *LogStreamer {
	return &LogStreamer{
		client:        client,
		logFactory:    logFactory,
		logger:        logger,
		activeStreams:  map[string]context.CancelFunc{},
	}
}

func (ls *LogStreamer) StartStreaming(ctx context.Context, deploymentID, projectName string) error {
	name := sanitizeK8sName(projectName)

	ls.mu.Lock()
	if cancel, exists := ls.activeStreams[deploymentID]; exists {
		cancel()
		delete(ls.activeStreams, deploymentID)
	}

	streamCtx, cancel := context.WithCancel(ctx)
	ls.activeStreams[deploymentID] = cancel
	ls.mu.Unlock()

	pods, err := ls.client.clientset.CoreV1().Pods(ls.client.namespace).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", name),
	})
	if err != nil {
		cancel()
		return fmt.Errorf("failed to list pods: %w", err)
	}

	if len(pods.Items) == 0 {
		cancel()
		return fmt.Errorf("no pods found for app %s", name)
	}

	ls.logger.Info("Starting log streaming",
		zap.String("deployment", deploymentID),
		zap.String("app", name),
		zap.Int("pods", len(pods.Items)),
	)

	for _, pod := range pods.Items {
		podName := pod.Name
		shortName := shortPodName(podName)
		go func(pName, sName string) {
			ls.streamPodLogs(streamCtx, deploymentID, name, pName, sName)
		}(podName, shortName)
	}

	return nil
}


func (ls *LogStreamer) streamPodLogs(ctx context.Context, deploymentID, appName, podName, shortName string) {
	logWriter := ls.logFactory.CreatePrefixedLogger(
		deploymentID,
		fmt.Sprintf("[%s] ", shortName),
		logging.SourceRuntime,
	)
	defer logWriter.Close()

	ls.logger.Info("Streaming logs from pod",
		zap.String("pod", podName),
		zap.String("deployment", deploymentID),
	)

	for {
		select {
		case <-ctx.Done():
			ls.logger.Info("Log streaming stopped (context cancelled)",
				zap.String("pod", podName),
			)
			return
		default:
			// Continue streaming
		}

		err := ls.streamOnce(ctx, deploymentID, appName, podName, logWriter)

		if ctx.Err() != nil {
			return
		}

		if err != nil {
			ls.logger.Warn("Log stream disconnected, retrying in 5s...",
				zap.String("pod", podName),
				zap.Error(err),
			)
			logWriter.Log("⚠ Log stream disconnected, reconnecting...")

			select {
			case <-ctx.Done():
				return
			case <-time.After(5 * time.Second):
				// Retry
			}
		}
	}
}

func (ls *LogStreamer) streamOnce(
	ctx context.Context,
	deploymentID, appName, podName string,
	logWriter *logging.StreamLogger,
) error {

	req := ls.client.clientset.CoreV1().Pods(ls.client.namespace).GetLogs(podName, &corev1.PodLogOptions{
		Container:  appName,
		Follow:     true,
		Timestamps: true,
		TailLines:  int64Ptr(100),
	})

	stream, err := req.Stream(ctx)
	if err != nil {
		return fmt.Errorf("failed to open log stream: %w", err)
	}
	defer stream.Close()

	scanner := bufio.NewScanner(stream)

	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		line := scanner.Text()

		if line == "" {
			continue
		}

		// Strip the K8s RFC3339 timestamp prefix (e.g. "2026-02-08T00:54:51.145175868Z ")
		line = stripK8sTimestamp(line)

		logWriter.Log(line)
	}

	if err := scanner.Err(); err != nil {
		if err == io.EOF {
			return nil
		}
		return fmt.Errorf("scanner error: %w", err)
	}

	return nil
}


func (ls *LogStreamer) StopStreaming(deploymentID string) {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	if cancel, exists := ls.activeStreams[deploymentID]; exists {
		cancel()
		delete(ls.activeStreams, deploymentID)
		ls.logger.Info("Stopped log streaming",
			zap.String("deployment", deploymentID),
		)
	}
}

func (ls *LogStreamer) StopAll() {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	for id, cancel := range ls.activeStreams {
		cancel()
		ls.logger.Info("Stopped log stream (shutdown)",
			zap.String("deployment", id),
		)
	}

	ls.activeStreams = make(map[string]context.CancelFunc)
	ls.logger.Info("All log streams stopped")
}


func (ls *LogStreamer) ActiveStreams() int {
	ls.mu.Lock()
	defer ls.mu.Unlock()
	return len(ls.activeStreams)
}

// stripK8sTimestamp removes the RFC3339Nano timestamp that Kubernetes prepends
// to log lines when Timestamps is enabled (e.g. "2026-02-08T00:54:51.145175868Z ").
func stripK8sTimestamp(line string) string {
	// K8s timestamps are always at the start and end with "Z "
	if idx := strings.Index(line, "Z "); idx > 0 && idx <= 35 {
		// Verify the prefix looks like a timestamp (starts with a digit)
		if len(line) > 0 && line[0] >= '0' && line[0] <= '9' {
			return line[idx+2:]
		}
	}
	return line
}

// shortPodName extracts a short identifier from a full pod name.
// e.g. "portfolio-v2-6d64886bbb-5q8tk" -> "5q8tk"
func shortPodName(name string) string {
	parts := strings.Split(name, "-")
	if len(parts) >= 2 {
		return parts[len(parts)-1]
	}
	return name
}