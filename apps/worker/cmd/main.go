package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"code2cloud/worker/internal/builder"
	"code2cloud/worker/internal/config"
	"code2cloud/worker/internal/git"
	"code2cloud/worker/internal/worker"
	"github.com/joho/godotenv"
)

func main() {
	// ─────────────────────────────────────────────────────────────
	// Step 1: Initialize Logger
	// ─────────────────────────────────────────────────────────────
	logger, err := zap.NewProduction()
	if err != nil {
		panic("failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting Code2Cloud Worker", 
		zap.String("version", "1.0.0"),
	)

	// ─────────────────────────────────────────────────────────────
	// Step 2: Load Configuration
	// ─────────────────────────────────────────────────────────────
	if err := godotenv.Load(); err != nil {
		println("No .env file found, using system environment variables")
	}

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load config", zap.Error(err))
	}

	logger.Info("Configuration loaded",
		zap.String("redis_url", cfg.RedisURL),
		zap.String("api_url", cfg.APIBaseURL),
		zap.String("buildkit_addr", cfg.BuildkitAddr),
		zap.String("registry_url", cfg.RegistryURL),
		zap.String("k8s_namespace", cfg.Namespace),
		zap.String("base_domain", cfg.BaseDomain),
	)

	// ─────────────────────────────────────────────────────────────
	// Step 3: Verify Tools (Git, Railpack)
	// ─────────────────────────────────────────────────────────────
	ctx := context.Background()

	// Verify Git
	gitResult, err := git.Verify(ctx, logger)
	if err != nil {
		logger.Fatal("Git verification failed", zap.Error(err))
	}
	logger.Info("Git ready", zap.String("version", gitResult.GitVersion))

	// Verify Railpack
	railpackResult, err := builder.Verify(ctx, cfg.BuildkitAddr, logger)
	if err != nil {
		// logger.Fatal("Railpack verification failed", zap.Error(err))
	}
	logger.Info("Railpack ready", zap.String("version", railpackResult.RailpackVersion))

	// ─────────────────────────────────────────────────────────────
	// Step 4: Create Worker Instance
	// ─────────────────────────────────────────────────────────────
	initCtx, initCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer initCancel()

	w, err := worker.New(initCtx, cfg, logger)
	if err != nil {
		logger.Fatal("Failed to create worker", zap.Error(err))
	}

	logger.Info("Worker initialized successfully",
		zap.String("worker_id", cfg.WorkerID),
		zap.String("queue", cfg.QueueName),
	)

	// ─────────────────────────────────────────────────────────────
	// Step 5: Setup Graceful Shutdown
	// ─────────────────────────────────────────────────────────────
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.Info("Received shutdown signal",
			zap.String("signal", sig.String()),
		)
		cancel()
	}()

	// ─────────────────────────────────────────────────────────────
	// Step 6: Start Worker (Blocking)
	// ─────────────────────────────────────────────────────────────
	if err := w.Start(ctx); err != nil && err != context.Canceled {
		logger.Fatal("Worker failed", zap.Error(err))
	}

	logger.Info("Worker shutdown complete")
}