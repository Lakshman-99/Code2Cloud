package worker

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	"code2cloud/worker/internal/api"
	"code2cloud/worker/internal/builder"
	"code2cloud/worker/internal/config"
	"code2cloud/worker/internal/git"
	"code2cloud/worker/internal/k8s"
	"code2cloud/worker/internal/logging"
	"code2cloud/worker/internal/queue"
	"code2cloud/worker/internal/types"
)


type Worker struct {
	cfg        *config.Config
	queue      *queue.Queue
	api        *api.Client
	git        *git.Cloner
	builder    *builder.Builder
	k8s        *k8s.Client
	logFactory *logging.Factory 
	logger     *zap.Logger
	logStreamer *k8s.LogStreamer
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

	logFactory := logging.NewFactoryFromAPI(apiClient.SaveLogsRaw, logger)

	// ─────────────────────────────────────────────────────────
	// Initialize Git Cloner
	// ─────────────────────────────────────────────────────────
	gitCloner := git.NewCloner(cfg.WorkspacePath, logFactory, logger)

	// ─────────────────────────────────────────────────────────
	// Initialize Builder
	// ─────────────────────────────────────────────────────────
	builderConfig := builder.Config{
		BuildkitAddr:     cfg.BuildkitAddr,
		RegistryURL:      cfg.RegistryURL,
		InsecureRegistry: cfg.RegistryInsecure,
		Platform:         cfg.BuildPlatform,
		Timeout:          cfg.BuildTimeout,
	}
	bldr := builder.NewBuilder(builderConfig, logFactory, logger)

	// ─────────────────────────────────────────────────────────
	// Initialize Kubernetes Client
	// ─────────────────────────────────────────────────────────
	k8sClient, err := k8s.NewClient(k8s.Config{
		Namespace:  cfg.Namespace,
		BaseDomain: cfg.BaseDomain,
	}, logFactory, logger)
	if err != nil {
		q.Close()
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	logStreamer := k8s.NewLogStreamer(k8sClient, logFactory, logger)

	// Create worker instance
	w := &Worker{
		cfg:         cfg,
		queue:       q,
		api:         apiClient,
		git:         gitCloner,
		builder:     bldr,
		k8s:         k8sClient,
		logFactory:  logFactory,
		logger:      logger,
		logStreamer:  logStreamer,
	}

	return w, nil
}

func (w *Worker) Start(ctx context.Context) error {
	w.logger.Info("Worker started, waiting for jobs...",
		zap.String("queue", w.cfg.QueueName),
		zap.String("worker_id", w.cfg.WorkerID),
		zap.String("api_url", w.cfg.APIBaseURL),
		zap.String("workspace", w.cfg.WorkspacePath),
		zap.String("buildkit_addr", w.cfg.BuildkitAddr),
		zap.String("registry_url", w.cfg.RegistryURL),
		zap.String("k8s_namespace", w.cfg.Namespace),
	)

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("Shutting down worker...")
			return w.shutdown()
		default:
			// Continue processing
		}

		job, jobID, err := w.queue.WaitForJob(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return w.shutdown()
			}
			w.logger.Error("Error waiting for job", zap.Error(err))
			continue
		}

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
			w.api.FailDeployment(ctx, job.DeploymentID, err.Error())
			w.api.NotifyFailure(ctx, job.DeploymentID, job.ProjectName, err.Error())
			w.queue.FailJob(ctx, jobID, err.Error())
			w.logStreamer.StopStreaming(job.DeploymentID)

			continue
		}

		w.queue.CompleteJob(ctx, jobID)
	}
}

// processJob handles a single build job
func (w *Worker) processJob(ctx context.Context, job *types.BuildJob, jobID string) error {
	startTime := time.Now()

	// Create a build logger for this deployment
	buildLog := w.logFactory.CreateBuildLogger(job.DeploymentID)
	defer buildLog.Close()

	w.logger.Info("Starting job processing",
		zap.String("deployment", job.DeploymentID),
		zap.String("project", job.ProjectName),
		zap.String("branch", job.Branch),
		zap.String("commit", job.CommitHash),
	)

	// ─────────────────────────────────────────────────────────
	// Step 1: Update deployment status to BUILDING
	// ─────────────────────────────────────────────────────────
	if err := w.api.UpdateDeploymentStatus(ctx, job.DeploymentID, types.StatusBuilding); err != nil {
		return fmt.Errorf("failed to update status to BUILDING: %w", err)
	}

	buildLog.Log("═══════════════════════════════════════════════════════════")
	buildLog.Log(fmt.Sprintf("  🚀 Code2Cloud Build - %s", job.ProjectName))
	buildLog.Log("═══════════════════════════════════════════════════════════")
	buildLog.Log(fmt.Sprintf("  Branch:    %s", job.Branch))
	buildLog.Log(fmt.Sprintf("  Commit:    %s", job.CommitHash[:8]))
	buildLog.Log(fmt.Sprintf("  Framework: %s", job.BuildConfig.Framework))
	buildLog.Log(fmt.Sprintf("  Domains:   %v", job.Domains))
	buildLog.Log("═══════════════════════════════════════════════════════════")
	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 2: Get Project Settings
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
	// Step 3: Get GitHub Installation Token
	// ─────────────────────────────────────────────────────────
	buildLog.Log("📦 Phase 1: Source Code")
	buildLog.Log("─────────────────────────────────────────────────────────────")
	buildLog.Log("🔑 Authenticating with GitHub...")

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
	buildLog.Log("")
	buildLog.Log("📥 Cloning repository...")

	cloneResult, err := w.git.Clone(ctx, git.CloneOptions{
		RepoURL:        job.GitURL,
		Branch:         job.Branch,
		CommitHash:     job.CommitHash,
		InstallationID: job.InstallationID,
		Token:          token.Token,
		DeploymentID:   job.DeploymentID,
		Shallow:        true,
		Depth:          1,
	})
	if err != nil {
		return fmt.Errorf("failed to clone repository: %w", err)
	}

	defer w.git.Cleanup(cloneResult.Path)

	w.logger.Info("Repository cloned",
		zap.String("path", cloneResult.Path),
		zap.String("commit", cloneResult.CommitHash),
		zap.Duration("duration", cloneResult.Duration),
	)

	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 5: Build with Railpack + BuildKit
	// ─────────────────────────────────────────────────────────
	buildLog.Log("🔨 Phase 2: Build Image")
	buildLog.Log("─────────────────────────────────────────────────────────────")

	imageName := fmt.Sprintf("%s/%s:%s",
		w.cfg.RegistryURL,
		sanitizeName(job.ProjectName),
		cloneResult.CommitHash[:8],
	)

	// Merge environment variables
	envVars := builder.MergeEnvVars(
		builder.DefaultBuildEnv(),
		builder.FrameworkEnv(job.BuildConfig.Framework),
		job.EnvVars,
	)

	buildResult, err := w.builder.Build(ctx, builder.Options{
		SourcePath:   cloneResult.Path,
		ImageName:    imageName,
		DeploymentID: job.DeploymentID,
		ProjectName:  job.ProjectName,
		BuildConfig: builder.BuildConfigOptions{
			InstallCommand: job.BuildConfig.InstallCommand,
			BuildCommand:   job.BuildConfig.BuildCommand,
			RunCommand:     job.BuildConfig.RunCommand,
			OutputDir:      job.BuildConfig.OutputDir,
			Framework:      job.BuildConfig.Framework,
		},
		EnvVars: envVars,
	})
	if err != nil {
		return fmt.Errorf("build failed: %w", err)
	}

	w.logger.Info("Build completed",
		zap.String("image", buildResult.ImageName),
		zap.Duration("duration", buildResult.Duration),
	)

	// Update deployment with image name
	if err := w.api.UpdateDeploymentWithImage(ctx, job.DeploymentID, types.StatusBuilding, buildResult.ImageName); err != nil {
		w.logger.Warn("Failed to update deployment image", zap.Error(err))
	}

	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 6: Update status to DEPLOYING
	// ─────────────────────────────────────────────────────────
	if err := w.api.UpdateDeploymentStatus(ctx, job.DeploymentID, types.StatusDeploying); err != nil {
		return fmt.Errorf("failed to update status to DEPLOYING: %w", err)
	}

	buildLog.Log("🚢 Phase 3: Deploy to Kubernetes")
	buildLog.Log("─────────────────────────────────────────────────────────────")

	// ─────────────────────────────────────────────────────────
	// Step 7: Deploy to Kubernetes
	// ─────────────────────────────────────────────────────────
	deployOpts := k8s.DeployOptions{
		DeploymentID:  job.DeploymentID,
		ProjectID:     job.ProjectID,
		ProjectName:   job.ProjectName,
		ImageName:     buildResult.ImageName,
		Port:          3000,
		CPURequest:    settings.DefaultCPURequest(),
		CPULimit:      settings.DefaultCPULimit(),
		MemoryRequest: settings.DefaultMemoryRequest(),
		MemoryLimit:   settings.DefaultMemoryLimit(),
		Replicas:      1,
		EnvVars:       job.EnvVars,
		Domains:       job.Domains,
		BaseDomain:    w.cfg.BaseDomain,
		HealthPath:    "/health",
	}

	deployResult, err := w.k8s.Deploy(ctx, deployOpts)
	if err != nil {
		return fmt.Errorf("kubernetes deployment failed: %w", err)
	}

	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 8: Mark as READY
	// ─────────────────────────────────────────────────────────
	deploymentURL := deployResult.URLs[0] // Primary URL

	if err := w.api.UpdateDeploymentWithURL(ctx, job.DeploymentID, types.StatusReady, deploymentURL); err != nil {
		return fmt.Errorf("failed to complete deployment: %w", err)
	}

	w.api.UpdateProjectStatus(ctx, job.ProjectID, "ACTIVE")

	// Update domain statuses
	for _, domain := range job.Domains {
		// Note: You might want to pass domain IDs in the job
		w.logger.Debug("Domain configured", zap.String("domain", domain))
	}

	duration := time.Since(startTime)

	buildLog.Log("═══════════════════════════════════════════════════════════")
	buildLog.Log("  ✅ Deployment Complete!")
	buildLog.Log("═══════════════════════════════════════════════════════════")
	buildLog.Log(fmt.Sprintf("  URL:      %s", deploymentURL))
	if len(deployResult.URLs) > 1 {
		buildLog.Log(fmt.Sprintf("  Aliases:  %s", strings.Join(deployResult.URLs[1:], ", ")))
	}
	buildLog.Log(fmt.Sprintf("  Image:    %s", buildResult.ImageName))
	buildLog.Log(fmt.Sprintf("  Duration: %s", duration.Round(time.Second)))
	buildLog.Log("═══════════════════════════════════════════════════════════")

	// ─────────────────────────────────────────────────────────
	// Step 9: Send success notification
	// ─────────────────────────────────────────────────────────
	w.api.NotifySuccess(ctx, job.DeploymentID, job.ProjectName, deploymentURL, int(duration.Seconds()))

	// ─────────────────────────────────────────────────────────
	// Step 10: Start streaming runtime logs
	// ─────────────────────────────────────────────────────────
	if err := w.logStreamer.StartStreaming(ctx, job.DeploymentID, job.ProjectName); err != nil {
		w.logger.Warn("Failed to start runtime log streaming (non-fatal)",
			zap.String("deployment", job.DeploymentID),
			zap.Error(err),
		)
		// Don't return error — deployment is already live
	} else {
		w.logger.Info("Runtime log streaming started",
			zap.String("deployment", job.DeploymentID),
			zap.Int("active_streams", w.logStreamer.ActiveStreams()),
		)
	}

	w.logger.Info("Job completed successfully! 🎉",
		zap.String("deployment", job.DeploymentID),
		zap.String("url", deploymentURL),
		zap.Duration("duration", duration),
	)

	return nil
}

// shutdown cleans up resources
func (w *Worker) shutdown() error {
	w.logger.Info("Cleaning up resources...")

	if w.logStreamer != nil {
		w.logger.Info("Stopping all log streams...",
			zap.Int("active_streams", w.logStreamer.ActiveStreams()),
		)
		w.logStreamer.StopAll()
	}
	
	if w.queue != nil {
		w.queue.Close()
	}
	
	return nil
}

// sanitizeName makes a name safe for K8s/DNS
func sanitizeName(name string) string {
	name = strings.ToLower(name)
	result := make([]byte, 0, len(name))
	for i := 0; i < len(name); i++ {
		c := name[i]
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result = append(result, c)
		} else if c == '_' || c == ' ' {
			result = append(result, '-')
		}
	}
	return string(result)
}