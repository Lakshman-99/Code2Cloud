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
	// Step 1: Load Env Variables and Config
	// ─────────────────────────────────────────────────────────────
	if err := godotenv.Load(); err != nil {
		println("No .env file found, using system environment variables")
	}

	cfg, err := config.Load()
	if err != nil {
		panic("❌ Failed to load config: " + err.Error())
	}

	// ─────────────────────────────────────────────────────────────
	// Step 2: Dynamic Logger Initialization
	// ─────────────────────────────────────────────────────────────
	var logger *zap.Logger
	if cfg.Environment == "development" {
		logger, err = zap.NewDevelopment()
	} else {
		logger, err = zap.NewProduction()
	}

	if err != nil {
		panic("failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting Code2Cloud Worker", 
		zap.String("env", cfg.Environment),
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
		logger.Fatal("Railpack verification failed", zap.Error(err))
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