package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"code2cloud/worker/internal/config"
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
	// Step 3: Create Worker Instance
	// ─────────────────────────────────────────────────────────────
	// Create a context for initialization (with timeout)
	initCtx, initCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer initCancel()

	// NewWorker creates and initializes our worker
	// It will connect to Redis and verify NestJS API
	w, err := worker.New(initCtx, cfg, logger)
	if err != nil {
		logger.Fatal("Failed to create worker", zap.Error(err))
	}

	// ─────────────────────────────────────────────────────────────
	// Step 4: Setup Graceful Shutdown
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
	// Step 5: Start Worker (Blocking)
	// ─────────────────────────────────────────────────────────────
	if err := w.Start(ctx); err != nil && err != context.Canceled {
		logger.Fatal("Worker failed", zap.Error(err))
	}

	logger.Info("Worker shutdown complete")
}