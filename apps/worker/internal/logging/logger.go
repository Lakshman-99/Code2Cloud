package logging

import (
	"bufio"
	"context"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
)

// StreamLogger collects log output and streams it to the API in batches
// It implements io.Writer so it can be used with exec.Command
type StreamLogger struct {
	deploymentID string
	source       Source
	sender       LogSender
	zapLogger    *zap.Logger
	config       Config

	// Internal state (protected by mutex)
	mu        sync.Mutex
	buffer    []string
	lastFlush time.Time

	// For auto-flush goroutine
	ctx        context.Context
	cancel     context.CancelFunc
	flushTimer *time.Timer
	wg         sync.WaitGroup
}

// NewStreamLogger creates a new StreamLogger
func NewStreamLogger(
	deploymentID string,
	sender LogSender,
	zapLogger *zap.Logger,
	config Config,
) *StreamLogger {
	ctx, cancel := context.WithCancel(context.Background())

	sl := &StreamLogger{
		deploymentID: deploymentID,
		source:       config.Source,
		sender:       sender,
		zapLogger:    zapLogger,
		config:       config,
		buffer:       make([]string, 0, config.BatchSize),
		lastFlush:    time.Now(),
		ctx:          ctx,
		cancel:       cancel,
	}

	// Start auto-flush timer
	sl.startAutoFlush()

	return sl
}

// Write implements io.Writer interface
func (sl *StreamLogger) Write(p []byte) (int, error) {
	sl.mu.Lock()
	defer sl.mu.Unlock()

	// Parse output into lines
	scanner := bufio.NewScanner(strings.NewReader(string(p)))
	for scanner.Scan() {
		line := scanner.Text()
		if line != "" {
			// Add prefix if configured
			if sl.config.Prefix != "" {
				line = sl.config.Prefix + line
			}
			sl.buffer = append(sl.buffer, line)
		}
	}

	// Check if we should flush
	if len(sl.buffer) >= sl.config.BatchSize {
		sl.flushLocked()
	}

	return len(p), nil
}

// Log adds a single log message
func (sl *StreamLogger) Log(message string) {
	sl.mu.Lock()
	defer sl.mu.Unlock()

	if sl.config.Prefix != "" {
		message = sl.config.Prefix + message
	}
	sl.buffer = append(sl.buffer, message)

	if len(sl.buffer) >= sl.config.BatchSize {
		sl.flushLocked()
	}
}

// Logf adds a formatted log message
func (sl *StreamLogger) Logf(format string, args ...interface{}) {
	sl.Log(sprintf(format, args...))
}

// LogWithSource logs a message with a specific source (overrides default)
func (sl *StreamLogger) LogWithSource(source Source, message string) {
	sl.mu.Lock()
	defer sl.mu.Unlock()

	// Flush current buffer with current source first
	if len(sl.buffer) > 0 {
		sl.flushLocked()
	}

	// Send this message with the specified source
	sl.sendToAPI(source, []string{message})
}

// Flush sends any buffered logs immediately
func (sl *StreamLogger) Flush() {
	sl.mu.Lock()
	defer sl.mu.Unlock()
	sl.flushLocked()
}

// Close stops the auto-flush timer and flushes remaining logs
func (sl *StreamLogger) Close() {
	// Stop auto-flush
	sl.cancel()
	if sl.flushTimer != nil {
		sl.flushTimer.Stop()
	}

	// Wait for any pending flushes
	sl.wg.Wait()

	// Final flush
	sl.Flush()
}

// SetSource changes the log source
func (sl *StreamLogger) SetSource(source Source) {
	sl.mu.Lock()
	defer sl.mu.Unlock()
	sl.source = source
}

// SetPrefix changes the log prefix
func (sl *StreamLogger) SetPrefix(prefix string) {
	sl.mu.Lock()
	defer sl.mu.Unlock()
	sl.config.Prefix = prefix
}

// flushLocked sends buffered logs (must be called with lock held)
func (sl *StreamLogger) flushLocked() {
	if len(sl.buffer) == 0 {
		return
	}

	// Copy and clear buffer
	logs := make([]string, len(sl.buffer))
	copy(logs, sl.buffer)
	sl.buffer = sl.buffer[:0]
	sl.lastFlush = time.Now()

	// Send asynchronously
	sl.wg.Add(1)
	go func() {
		defer sl.wg.Done()
		sl.sendToAPI(sl.source, logs)
	}()
}

// sendToAPI sends logs to the API
func (sl *StreamLogger) sendToAPI(source Source, messages []string) {
	if err := sl.sender.SendLogs(sl.deploymentID, source, messages); err != nil {
		sl.zapLogger.Warn("Failed to send logs to API",
			zap.String("deploymentId", sl.deploymentID),
			zap.String("source", string(source)),
			zap.Int("count", len(messages)),
			zap.Error(err),
		)
	}
}

// startAutoFlush starts a timer to periodically flush logs
func (sl *StreamLogger) startAutoFlush() {
	sl.flushTimer = time.NewTimer(sl.config.FlushInterval)

	go func() {
		for {
			select {
			case <-sl.ctx.Done():
				return
			case <-sl.flushTimer.C:
				sl.mu.Lock()
				if time.Since(sl.lastFlush) >= sl.config.FlushInterval && len(sl.buffer) > 0 {
					sl.flushLocked()
				}
				sl.mu.Unlock()
				sl.flushTimer.Reset(sl.config.FlushInterval)
			}
		}
	}()
}

// sprintf is a helper to avoid importing fmt in hot path
func sprintf(format string, args ...interface{}) string {
	if len(args) == 0 {
		return format
	}
	// Simple replacement for common cases
	result := format
	for _, arg := range args {
		switch v := arg.(type) {
		case string:
			result = strings.Replace(result, "%s", v, 1)
			result = strings.Replace(result, "%v", v, 1)
		case int:
			result = strings.Replace(result, "%d", intToString(v), 1)
			result = strings.Replace(result, "%v", intToString(v), 1)
		case int64:
			result = strings.Replace(result, "%d", int64ToString(v), 1)
		default:
			// For complex cases, fall back to fmt
			// But we avoid importing fmt to keep this light
		}
	}
	return result
}

func intToString(i int) string {
	if i == 0 {
		return "0"
	}
	var b []byte
	negative := i < 0
	if negative {
		i = -i
	}
	for i > 0 {
		b = append([]byte{byte('0' + i%10)}, b...)
		i /= 10
	}
	if negative {
		b = append([]byte{'-'}, b...)
	}
	return string(b)
}

func int64ToString(i int64) string {
	return intToString(int(i))
}