package k8s

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"
)

type LogCleanupWorker struct {
	triggerCleanup func(ctx context.Context) error
	interval       time.Duration
	logger         *zap.Logger
	wg             sync.WaitGroup
}

func NewLogCleanupWorker(
	triggerCleanup func(ctx context.Context) error,
	interval time.Duration,
	logger *zap.Logger,
) *LogCleanupWorker {
	if interval == 0 {
		interval = 1 * time.Hour
	}

	return &LogCleanupWorker{
		triggerCleanup: triggerCleanup,
		interval:       interval,
		logger:         logger,
	}
}

func (lc *LogCleanupWorker) Start(ctx context.Context) {
	lc.wg.Add(1)

	go func() {
		defer lc.wg.Done()

		lc.logger.Info("Log cleanup worker started",
			zap.Duration("interval", lc.interval),
		)

		// Run immediately on startup
		lc.run(ctx)

		ticker := time.NewTicker(lc.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				lc.logger.Info("Log cleanup worker stopped")
				return
			case <-ticker.C:
				lc.run(ctx)
			}
		}
	}()
}

func (lc *LogCleanupWorker) Stop() {
	lc.wg.Wait()
}

func (lc *LogCleanupWorker) run(ctx context.Context) {
	if ctx.Err() != nil {
		return
	}

	lc.logger.Info("Triggering log cleanup...")

	if err := lc.triggerCleanup(ctx); err != nil {
		lc.logger.Warn("Log cleanup call failed", zap.Error(err))
		return
	}

	lc.logger.Info("Log cleanup completed ✅")
}