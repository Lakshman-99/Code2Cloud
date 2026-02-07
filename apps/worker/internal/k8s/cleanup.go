package k8s

import (
	"context"
	"sync"
	"time"

	"code2cloud/worker/internal/types"

	"go.uber.org/zap"
)

type CleanupWorker struct {
	client      *Client
	logStreamer  *LogStreamer
	logger      *zap.Logger

	fetchExpiredDeployments func(ctx context.Context) ([]types.ExpiredDeployment, error)
	updateDeploymentStatus   func(ctx context.Context, deploymentID string, status types.DeploymentStatus) error
	updateProjectStatus     func(ctx context.Context, projectID string, status string) error

	checkInterval time.Duration

	wg sync.WaitGroup
}

type CleanupWorkerConfig struct {
	Client      *Client
	LogStreamer  *LogStreamer
	Logger      *zap.Logger

	FetchExpiredDeployments func(ctx context.Context) ([]types.ExpiredDeployment, error)
	UpdateDeploymentStatus   func(ctx context.Context, deploymentID string, status types.DeploymentStatus) error
	UpdateProjectStatus     func(ctx context.Context, projectID string, status string) error

	CheckInterval time.Duration
}

func NewCleanupWorker(config CleanupWorkerConfig) *CleanupWorker {
	interval := config.CheckInterval
	if interval == 0 {
		interval = 60 * time.Second
	}

	return &CleanupWorker{
		client:                  config.Client,
		logStreamer:              config.LogStreamer,
		logger:                  config.Logger,
		fetchExpiredDeployments: config.FetchExpiredDeployments,
		updateDeploymentStatus:   config.UpdateDeploymentStatus,
		updateProjectStatus:     config.UpdateProjectStatus,
		checkInterval:           interval,
	}
}

func (cw *CleanupWorker) Start(ctx context.Context) {
	cw.wg.Add(1)

	go func() {
		defer cw.wg.Done()

		cw.logger.Info("Cleanup worker started",
			zap.Duration("check_interval", cw.checkInterval),
		)

		cw.cleanupExpired(ctx)

		ticker := time.NewTicker(cw.checkInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				cw.logger.Info("Cleanup worker stopped")
				return
			case <-ticker.C:
				cw.cleanupExpired(ctx)
			}
		}
	}()
}

func (cw *CleanupWorker) Stop() {
	cw.wg.Wait()
}

func (cw *CleanupWorker) cleanupExpired(ctx context.Context) {
	if ctx.Err() != nil {
		return
	}

	deployments, err := cw.fetchExpiredDeployments(ctx)
	if err != nil {
		cw.logger.Warn("Failed to fetch expired deployments", zap.Error(err))
		return
	}

	if len(deployments) == 0 {
		return // Nothing to clean — common case
	}

	cw.logger.Info("Found expired deployments",
		zap.Int("count", len(deployments)),
	)

	for _, deployment := range deployments {
		if ctx.Err() != nil {
			return
		}

		cw.cleanupDeployment(ctx, deployment)
	}
}

func (cw *CleanupWorker) cleanupDeployment(ctx context.Context, deployment types.ExpiredDeployment) {
	cw.logger.Info("Cleaning up expired deployment",
		zap.String("deployment", deployment.ID),
		zap.String("project", deployment.ProjectName),
		zap.Int("ttl_minutes", deployment.TTLMinutes),
	)

	if cw.logStreamer != nil {
		cw.logStreamer.StopStreaming(deployment.ID)
	}

	if err := cw.client.Cleanup(ctx, CleanupOptions{
		DeploymentID: deployment.ID,
		ProjectName:  deployment.ProjectName,
	}); err != nil {
		cw.logger.Warn("Partial cleanup failure (will retry next cycle)",
			zap.String("deployment", deployment.ID),
			zap.Error(err),
		)
	}

	if err := cw.updateDeploymentStatus(ctx, deployment.ID, types.StatusExpired); err != nil {
		cw.logger.Error("Failed to mark deployment as expired",
			zap.String("deployment", deployment.ID),
			zap.Error(err),
		)
		return
	}

	if err := cw.updateProjectStatus(ctx, deployment.ProjectID, "INACTIVE"); err != nil {
		cw.logger.Warn("Failed to update project status",
			zap.String("project", deployment.ProjectID),
			zap.Error(err),
		)
	}

	cw.logger.Info("Deployment cleaned up successfully 🧹",
		zap.String("deployment", deployment.ID),
		zap.String("project", deployment.ProjectName),
	)
}