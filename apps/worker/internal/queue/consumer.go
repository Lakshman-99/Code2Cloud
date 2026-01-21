package queue

import (
	"code2cloud/worker/internal/worker"
	"context"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type Consumer struct {
	Redis     *redis.Client
	Processor *worker.Processor
	QueueName string
}

func NewConsumer(rdb *redis.Client, proc *worker.Processor) *Consumer {
	return &Consumer{
		Redis:     rdb,
		Processor: proc,
		QueueName: "build-queue",
	}
}

// Start begins the infinite loop
func (c *Consumer) Start(ctx context.Context) {
	slog.Info("👀 Queue Consumer Started", "queue", c.QueueName)

	for {
		select {
		case <-ctx.Done():
			slog.Info("🛑 Consumer stopping...")
			return
		default:
			// BLPop blocks for 5 seconds
			result, err := c.Redis.BLPop(ctx, 5*time.Second, c.QueueName).Result()
			if err != nil {
				if err != redis.Nil {
					slog.Error("Redis connection error", "error", err)
					time.Sleep(1 * time.Second) // Backoff slightly on error
				}
				continue
			}

			// result[0] is key, result[1] is value
			payload := result[1]

			// Hand off to the processor
			// Note: We intentionally block here. For concurrent builds, we would spawn a go-routine.
			// But for now, 1 Worker = 1 Concurrent Build is safer.
			if err := c.Processor.Process(ctx, payload); err != nil {
				slog.Error("Failed to process job", "error", err)
				// TODO: Push to a "dead-letter-queue" if needed
			}
		}
	}
}