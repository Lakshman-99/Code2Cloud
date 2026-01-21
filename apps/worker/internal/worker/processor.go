package worker

import (
	"code2cloud/worker/internal/config"
	"code2cloud/worker/internal/db"
	"code2cloud/worker/internal/types"
	"context"
	"encoding/json"
	"log/slog"

	"k8s.io/client-go/kubernetes"
)

type Processor struct {
	K8s    *kubernetes.Clientset
	DB     *db.DB
	Config *config.Config
}

func NewProcessor(cfg *config.Config, k8s *kubernetes.Clientset, database *db.DB) *Processor {
	return &Processor{
		Config: cfg,
		K8s:    k8s,
		DB:     database,
	}
}

// Process is the main entry point for a single job
func (p *Processor) Process(ctx context.Context, payload string) error {
	// 1. Parse JSON
	var job types.BuildJobData
	if err := json.Unmarshal([]byte(payload), &job); err != nil {
		slog.Error("❌ Failed to parse job JSON", "error", err, "payload", payload)
		// Return nil so we acknowledge the message and remove it from queue (don't retry bad JSON)
		return nil 
	}

	// 2. Structured Logging
	logger := slog.With(
		"deploymentId", job.DeploymentID,
		"project", job.ProjectName,
		"commit", job.CommitHash,
	)
	logger.Info("⚙️ Processing Build Job")

	// 3. Update DB Status -> "BUILDING"
	// TODO: p.DB.SetStatus(ctx, job.DeploymentID, "BUILDING")

	// 4. Trigger the Build (The Logic we wrote earlier, moved here later)
	// err := p.StartBuildPod(ctx, job)
	
	logger.Info("✅ Job Processed Successfully")
	return nil
}