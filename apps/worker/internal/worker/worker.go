package worker

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"code2cloud/worker/internal/config"
	"code2cloud/worker/internal/queue"
	"code2cloud/worker/internal/types"
)


type Worker struct {
	cfg    *config.Config
	queue  *queue.Queue
	logger *zap.Logger
}

func New(cfg *config.Config, logger *zap.Logger) (*Worker, error) {
	// Initialize queue connection
	q, err := queue.New(
		cfg.RedisURL,
		cfg.QueueName,
		logger,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to queue: %w", err)
	}

	// Create worker instance
	w := &Worker{
		cfg:    cfg,
		queue:  q,
		logger: logger,
	}

	return w, nil
}

func (w *Worker) Start(ctx context.Context) error {
	w.logger.Info("⌛ Worker started, waiting for jobs...")

	for {
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
	// TODO: w.db.UpdateDeploymentStatus(job.DeploymentID, types.StatusBuilding)
	w.logger.Info("Step 1: Would update status to BUILDING")

	// ─────────────────────────────────────────────────────────
	// Step 2: Clone repository
	// ─────────────────────────────────────────────────────────
	// TODO: repoPath, err := w.cloneRepository(ctx, job)
	w.logger.Info("Step 2: Would clone repository",
		zap.String("url", job.GitURL),
		zap.String("branch", job.Branch),
	)

	// ─────────────────────────────────────────────────────────
	// Step 3: Build with Railpack + BuildKit
	// ─────────────────────────────────────────────────────────
	// TODO: imageName, err := w.buildImage(ctx, job, repoPath)
	w.logger.Info("Step 3: Would build image with Railpack")

	// ─────────────────────────────────────────────────────────
	// Step 4: Update status to DEPLOYING
	// ─────────────────────────────────────────────────────────
	// TODO: w.db.UpdateDeploymentStatus(job.DeploymentID, types.StatusDeploying)
	w.logger.Info("Step 4: Would update status to DEPLOYING")

	// ─────────────────────────────────────────────────────────
	// Step 5: Deploy to Kubernetes
	// ─────────────────────────────────────────────────────────
	// TODO: err = w.deployToKubernetes(ctx, job, imageName)
	w.logger.Info("Step 5: Would deploy to Kubernetes")

	// ─────────────────────────────────────────────────────────
	// Step 6: Configure Ingress for domains
	// ─────────────────────────────────────────────────────────
	// TODO: err = w.configureIngress(ctx, job)
	w.logger.Info("Step 6: Would configure ingress for domains")

	// ─────────────────────────────────────────────────────────
	// Step 7: Update status to READY
	// ─────────────────────────────────────────────────────────
	// TODO: w.db.UpdateDeploymentStatus(job.DeploymentID, types.StatusReady)
	w.logger.Info("Step 7: Would update status to READY")

	w.logger.Info("Job completed successfully! 🎉",
		zap.String("deployment", job.DeploymentID),
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