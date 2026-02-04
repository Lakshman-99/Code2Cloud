package worker

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"code2cloud/worker/internal/api"
	"code2cloud/worker/internal/config"
	"code2cloud/worker/internal/queue"
	"code2cloud/worker/internal/types"
)


type Worker struct {
	cfg    *config.Config
	queue  *queue.Queue
	api    *api.Client
	logger *zap.Logger
}

func New(ctx context.Context, cfg *config.Config, logger *zap.Logger) (*Worker, error) {
	// Initialize queue connection
	q, err := queue.New(
		cfg.RedisURL,
		cfg.QueueName,
		logger,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to queue: %w", err)
	}

	// ─────────────────────────────────────────────────────────
	// Initialize API Client (NestJS)
	// ─────────────────────────────────────────────────────────
	apiClient := api.New(cfg.APIBaseURL, cfg.WorkerAPIKey, logger)

	// Verify API connection
	if err := apiClient.HealthCheck(ctx); err != nil {
		q.Close()
		return nil, fmt.Errorf("failed to connect to API: %w", err)
	}

	// Create worker instance
	w := &Worker{
		cfg:    cfg,
		queue:  q,
		api:    apiClient,
		logger: logger,
	}

	return w, nil
}

func (w *Worker) Start(ctx context.Context) error {
	w.logger.Info("Worker started, waiting for jobs...",
		zap.String("queue", w.cfg.QueueName),
		zap.String("worker_id", w.cfg.WorkerID),
		zap.String("api_url", w.cfg.APIBaseURL),
	)

	// Infinite loop - keeps running until shutdown
	for {
		// Check if we should stop
		select {
		case <-ctx.Done():
			w.logger.Info("Shutting down worker...")
			return w.shutdown()
		default:
			// Continue processing
		}

		// Wait for and get next job
		job, jobID, err := w.queue.WaitForJob(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return w.shutdown()
			}
			w.logger.Error("Error waiting for job", zap.Error(err))
			continue
		}

		// Process the job
		w.logger.Info("Processing job",
			zap.String("jobId", jobID),
			zap.String("deploymentId", job.DeploymentID),
			zap.String("project", job.ProjectName),
		)

		if err := w.processJob(ctx, job, jobID); err != nil {
			w.logger.Error("Job processing failed",
				zap.String("jobId", jobID),
				zap.Error(err),
			)
			// Update deployment status to FAILED via API
			w.api.FailDeployment(ctx, job.DeploymentID, err.Error())
			// Send failure notification
			w.api.NotifyFailure(ctx, job.DeploymentID, job.ProjectName, err.Error())
			w.queue.FailJob(ctx, jobID, err.Error())
			continue
		}

		// Mark job as complete
		w.queue.CompleteJob(ctx, jobID)
	}
}

func (w *Worker) processJob(ctx context.Context, job *types.BuildJob, jobID string) error {
	w.logger.Info("Starting job processing",
		zap.String("deployment", job.DeploymentID),
		zap.String("project", job.ProjectName),
		zap.String("branch", job.Branch),
		zap.String("commit", job.CommitHash),
		zap.Strings("domains", job.Domains),
	)

	// ─────────────────────────────────────────────────────────
	// Step 1: Update deployment status to BUILDING
	// ─────────────────────────────────────────────────────────
	if err := w.api.UpdateDeploymentStatus(ctx, job.DeploymentID, types.StatusBuilding); err != nil {
		return fmt.Errorf("failed to update status to BUILDING: %w", err)
	}

	// Save initial log
	w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
		fmt.Sprintf("🚀 Starting build for %s (branch: %s)", job.ProjectName, job.Branch))

	// ─────────────────────────────────────────────────────────
	// Step 2: Get Project Settings (for TTL, notifications)
	// ─────────────────────────────────────────────────────────
	settings, err := w.api.GetProjectSettings(ctx, job.ProjectID)
	if err != nil {
		w.logger.Warn("Failed to get project settings, using defaults", zap.Error(err))
	}

	w.logger.Info("Project settings loaded",
		zap.Int("ttl_minutes", settings.GlobalTTLMinutes),
		zap.Bool("turbo_mode", settings.TurboMode),
	)

	// ─────────────────────────────────────────────────────────
	// Step 3: Get GitHub Installation Token (for cloning)
	// ─────────────────────────────────────────────────────────
	w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
		fmt.Sprintf("🔑 Getting installation token for installation %d", job.InstallationID))

	token, err := w.api.GetInstallationToken(ctx, job.InstallationID)
	if err != nil {
		return fmt.Errorf("failed to get installation token: %w", err)
	}

	w.logger.Info("Got installation token",
		zap.String("expiresAt", token.ExpiresAt),
	)

	// ─────────────────────────────────────────────────────────
	// Step 4: Clone repository
	// ─────────────────────────────────────────────────────────
	w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
		fmt.Sprintf("📥 Cloning repository: %s", job.GitURL))

	// TODO: repoPath, err := w.cloneRepository(ctx, job, token.Token)
	w.logger.Info("Step 4: Would clone repository",
		zap.String("url", job.GitURL),
		zap.String("branch", job.Branch),
	)

	// ─────────────────────────────────────────────────────────
	// Step 3: Build with Railpack + BuildKit
	// ─────────────────────────────────────────────────────────
	w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
		"🔨 Building container image with Railpack...")

	imageName := fmt.Sprintf("%s/%s:%s",
		w.cfg.RegistryURL,
		job.ProjectName,
		job.CommitHash[:8],
	)

	// TODO: err = w.buildImage(ctx, job, repoPath, imageName)
	w.logger.Info("Step 5: Would build image",
		zap.String("image", imageName),
	)

	// Update deployment with image name
	if err := w.api.UpdateDeploymentWithImage(ctx, job.DeploymentID, types.StatusBuilding, imageName); err != nil {
		w.logger.Warn("Failed to update deployment image", zap.Error(err))
	}

	// ─────────────────────────────────────────────────────────
	// Step 6: Update status to DEPLOYING
	// ─────────────────────────────────────────────────────────
	if err := w.api.UpdateDeploymentStatus(ctx, job.DeploymentID, types.StatusDeploying); err != nil {
		return fmt.Errorf("failed to update status to DEPLOYING: %w", err)
	}

	w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
		"🚢 Deploying to Kubernetes...")

	// ─────────────────────────────────────────────────────────
	// Step 7: Deploy to Kubernetes
	// ─────────────────────────────────────────────────────────
	// TODO: err = w.deployToKubernetes(ctx, job, imageName)
	w.logger.Info("Step 7: Would deploy to Kubernetes")

	// ─────────────────────────────────────────────────────────
	// Step 8: Configure Ingress for domains
	// ─────────────────────────────────────────────────────────
	if len(job.Domains) > 0 {
		w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
			fmt.Sprintf("🌐 Configuring domains: %v", job.Domains))
	// TODO: err = w.configureIngress(ctx, job)
	}

	deploymentURL := fmt.Sprintf("https://%s.%s", job.ProjectName, w.cfg.BaseDomain)

	// ─────────────────────────────────────────────────────────
	// Step 9: Mark as READY
	// ─────────────────────────────────────────────────────────
	if err := w.api.UpdateDeploymentWithURL(ctx, job.DeploymentID, types.StatusReady, deploymentURL); err != nil {
		return fmt.Errorf("failed to complete deployment: %w", err)
	}

	// Update project online status
	w.api.UpdateProjectStatus(ctx, job.ProjectID, "ACTIVE")

	w.api.SaveLog(ctx, job.DeploymentID, api.LogSourceBuild,
		fmt.Sprintf("✅ Deployment complete! URL: %s", deploymentURL))

	// ─────────────────────────────────────────────────────────
	// Step 10: Send success notification
	// ─────────────────────────────────────────────────────────
	// Duration would come from actual timing, hardcoded for now
	w.api.NotifySuccess(ctx, job.DeploymentID, job.ProjectName, deploymentURL, 60)

	w.logger.Info("Job completed successfully! 🎉",
		zap.String("deployment", job.DeploymentID),
		zap.String("url", deploymentURL),
	)

	return nil
}

// shutdown cleans up resources
func (w *Worker) shutdown() error {
	w.logger.Info("Cleaning up resources...")
	
	if w.queue != nil {
		w.queue.Close()
	}
	
	return nil
}