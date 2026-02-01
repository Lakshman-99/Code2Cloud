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

type Queue struct {
	client    *redis.Client
	queueName string        
	logger    *zap.Logger   
}

func New(url, queueName string, logger *zap.Logger) (*Queue, error) {
	// Create Redis client
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

	logger.Info("✅ Connected to Redis", zap.String("url", url))

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
	waitKey := fmt.Sprintf("bull:%s:wait", q.queueName)
	activeKey := fmt.Sprintf("bull:%s:active", q.queueName)

	q.logger.Debug("Waiting for job...", zap.String("key", waitKey))

	for {
		select {
		case <-ctx.Done():
			return nil, "", ctx.Err()
		default:
			// Continue processing
		}

		result, err := q.client.BRPopLPush(ctx, waitKey, activeKey, 5*time.Second).Result()
		
		if err == redis.Nil {
			continue
		}
		if err != nil {
			return nil, "", fmt.Errorf("failed to pop job: %w", err)
		}

		jobID := result
		q.logger.Info("Got job", zap.String("jobId", jobID))

		// Fetch job data from hash
		job, err := q.getJobData(ctx, jobID)
		if err != nil {
			q.logger.Error("Failed to get job data", 
				zap.String("jobId", jobID),
				zap.Error(err),
			)
			q.FailJob(ctx, jobID, err.Error())
			continue
		}

		return job, jobID, nil
	}
}

// getJobData fetches and parses job data from Redis hash
func (q *Queue) getJobData(ctx context.Context, jobID string) (*types.BuildJob, error) {
	key := fmt.Sprintf("bull:%s:%s", q.queueName, jobID)

	data, err := q.client.HGet(ctx, key, "data").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get job data: %w", err)
	}

	var job types.BuildJob
	if err := json.Unmarshal([]byte(data), &job); err != nil {
		return nil, fmt.Errorf("failed to parse job data: %w", err)
	}

	return &job, nil
}

// ─────────────────────────────────────────────────────────────
// Job Completion
// ─────────────────────────────────────────────────────────────
func (q *Queue) CompleteJob(ctx context.Context, jobID string) error {
	activeKey := fmt.Sprintf("bull:%s:active", q.queueName)
	completedKey := fmt.Sprintf("bull:%s:completed", q.queueName)

	q.client.LRem(ctx, activeKey, 1, jobID)

	q.client.ZAdd(ctx, completedKey, redis.Z{
		Score:  float64(time.Now().Unix()),
		Member: jobID,
	})

	q.logger.Info("Job completed", zap.String("jobId", jobID))
	return nil
}

func (q *Queue) FailJob(ctx context.Context, jobID, reason string) error {
	activeKey := fmt.Sprintf("bull:%s:active", q.queueName)
	failedKey := fmt.Sprintf("bull:%s:failed", q.queueName)

	q.client.LRem(ctx, activeKey, 1, jobID)

	q.client.ZAdd(ctx, failedKey, redis.Z{
		Score:  float64(time.Now().Unix()),
		Member: jobID,
	})

	q.logger.Error("Job failed", 
		zap.String("jobId", jobID),
		zap.String("reason", reason),
	)
	return nil
}

func (q *Queue) Close() error {
	return q.client.Close()
}