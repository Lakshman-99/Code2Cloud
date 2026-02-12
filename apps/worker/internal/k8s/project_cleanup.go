package k8s

import (
	"context"
	"sync"
	"time"

	"code2cloud/worker/internal/types"

	"go.uber.org/zap"
)

type ProjectCleanupWorker struct {
	client     *Client
	logStreamer *LogStreamer
	logger     *zap.Logger

	fetchCleanupJobs func(ctx context.Context) (*types.ProjectCleanupJob, error)

	checkInterval time.Duration
	wg            sync.WaitGroup
}

type ProjectCleanupWorkerConfig struct {
	Client           *Client
	LogStreamer       *LogStreamer
	Logger           *zap.Logger
	FetchCleanupJobs func(ctx context.Context) (*types.ProjectCleanupJob, error)
	CheckInterval    time.Duration
}

func NewProjectCleanupWorker(config ProjectCleanupWorkerConfig) *ProjectCleanupWorker {
	interval := config.CheckInterval
	if interval == 0 {
		interval = 5 * time.Second
	}

	return &ProjectCleanupWorker{
		client:           config.Client,
		logStreamer:       config.LogStreamer,
		logger:           config.Logger,
		fetchCleanupJobs: config.FetchCleanupJobs,
		checkInterval:    interval,
	}
}

func (pw *ProjectCleanupWorker) Start(ctx context.Context) {
	pw.wg.Add(1)

	go func() {
		defer pw.wg.Done()

		pw.logger.Info("Project cleanup worker started",
			zap.Duration("check_interval", pw.checkInterval),
		)

		for {
			select {
			case <-ctx.Done():
				pw.logger.Info("Project cleanup worker stopped")
				return
			default:
				pw.processNextJob(ctx)
			}

			select {
			case <-ctx.Done():
				return
			case <-time.After(pw.checkInterval):
			}
		}
	}()
}

func (pw *ProjectCleanupWorker) Stop() {
	pw.wg.Wait()
}

func (pw *ProjectCleanupWorker) processNextJob(ctx context.Context) {
	if ctx.Err() != nil {
		return
	}

	job, err := pw.fetchCleanupJobs(ctx)
	if err != nil || job == nil {
		return
	}

	pw.logger.Info("Processing project cleanup",
		zap.String("project_id", job.ProjectID),
		zap.String("project_name", job.ProjectName),
		zap.Int("active_deployments", len(job.ActiveDeploymentIDs)),
	)

	pw.cleanupProject(ctx, job)
}

func (pw *ProjectCleanupWorker) cleanupProject(ctx context.Context, job *types.ProjectCleanupJob) {
	name := sanitizeK8sName(job.ProjectName)

	// Step 1: Stop all log streams for this project's deployments
	for _, deploymentID := range job.ActiveDeploymentIDs {
		if pw.logStreamer != nil {
			pw.logStreamer.StopStreaming(deploymentID)
		}
	}

	if err := pw.client.Cleanup(ctx, CleanupOptions{
		ProjectName: job.ProjectName,
	}); err != nil {
		pw.logger.Warn("Partial cleanup failure for project deletion",
			zap.String("project", job.ProjectName),
			zap.Error(err),
		)
	}

	pw.logger.Info("Project cleanup complete 🗑️",
		zap.String("project_id", job.ProjectID),
		zap.String("project_name", job.ProjectName),
		zap.String("k8s_name", name),
	)
}