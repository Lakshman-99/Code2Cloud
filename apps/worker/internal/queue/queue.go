package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"code2cloud/worker/internal/types"
)

const (
	ProjectCleanupQueue = "project-cleanup-queue"
)

type Queue struct {
	client    *redis.Client
	queueName string        
	logger    *zap.Logger   
}

func New(url, queueName string, logger *zap.Logger) (*Queue, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
			return nil, fmt.Errorf("invalid redis url: %w", err)
	}

	client := redis.NewClient(opts)

	// Test connection with a PING
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	logger.Info("Connected to Redis", zap.String("url", url))

	return &Queue{
		client:    client,
		queueName: queueName,
		logger:    logger,
	}, nil
}

// ─────────────────────────────────────────────────────────────
// Job Processing
// ─────────────────────────────────────────────────────────────

func (q *Queue) WaitForJob(ctx context.Context) (*types.BuildJob, string, error) {
	q.logger.Debug("Waiting for job...", zap.String("key", q.queueName))

	for {
		select {
		case <-ctx.Done():
			return nil, "", ctx.Err()
		default:
			// Continue processing
		}

		result, err := q.client.BRPop(ctx, 5*time.Second, q.queueName).Result()
		
		if err == redis.Nil {
			continue
		}
		if err != nil {
			if ctx.Err() != nil {
				return nil, "", ctx.Err()
			}
			return nil, "", fmt.Errorf("failed to pop job: %w", err)
		}

		rawJSON := result[1]

		var job types.BuildJob
		if err := json.Unmarshal([]byte(rawJSON), &job); err != nil {
			q.logger.Error("Failed to parse job data",
				zap.String("raw", rawJSON),
				zap.Error(err),
			)
			continue
		}

		jobID := job.DeploymentID

		q.logger.Info("Got job",
			zap.String("jobId", jobID),
			zap.String("project", job.ProjectName),
			zap.String("deployment", job.DeploymentID),
		)

		return &job, jobID, nil
	}
}

// ─────────────────────────────────────────────────────────────
// Project Cleanup Queue
// ─────────────────────────────────────────────────────────────

func (q *Queue) PopProjectCleanup(ctx context.Context) (*types.ProjectCleanupJob, error) {
	result, err := q.client.RPop(ctx, ProjectCleanupQueue).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		q.logger.Warn("Failed to pop project cleanup job", zap.Error(err))
		return nil, err
	}

	var job types.ProjectCleanupJob
	if err := json.Unmarshal([]byte(result), &job); err != nil {
		q.logger.Error("Failed to parse project cleanup job",
			zap.String("raw", result),
			zap.Error(err),
		)
		return nil, fmt.Errorf("failed to parse cleanup job: %w", err)
	}

	q.logger.Info("Got project cleanup job",
		zap.String("project_id", job.ProjectID),
		zap.String("project_name", job.ProjectName),
		zap.Int("deployments", len(job.ActiveDeploymentIDs)),
	)

	return &job, nil
}

// ─────────────────────────────────────────────────────────────
// Job Completion
// ─────────────────────────────────────────────────────────────

func (q *Queue) CompleteJob(ctx context.Context, jobID string) error {
	q.logger.Info("Job completed", zap.String("jobId", jobID))
	return nil
}

func (q *Queue) FailJob(ctx context.Context, jobID, reason string) error {
	q.logger.Error("Job failed", 
		zap.String("jobId", jobID),
		zap.String("reason", reason),
	)
	return nil
}

// ─────────────────────────────────────────────────────────────
// Cancellation Signals
// ─────────────────────────────────────────────────────────────

func (q *Queue) IsCancelled(ctx context.Context, deploymentID string) bool {
	key := "cancel:" + deploymentID
	val, err := q.client.Get(ctx, key).Result()
	if err != nil {
		return false
	}
	return val == "1"
}

func (q *Queue) ClearCancelSignal(ctx context.Context, deploymentID string) {
	key := "cancel:" + deploymentID
	q.client.Del(ctx, key)
}

func (q *Queue) Close() error {
	return q.client.Close()
}