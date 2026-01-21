package main

import (
	"code2cloud/worker/internal/config"
	"code2cloud/worker/internal/db"
	"code2cloud/worker/internal/queue"
	"code2cloud/worker/internal/worker"
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/redis/go-redis/v9"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	// 0. Setup Logger (JSON format is best for prod)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 1. Config
	cfg := config.Load()
	slog.Info("🚀 Code2Cloud Worker Starting", "env", cfg.Environment)

	// 2. Dependencies
	database := db.Connect(cfg.DatabaseURL)
	defer database.Pool.Close()

	redisOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		slog.Error("❌ Invalid Redis URL", "error", err)
		os.Exit(1)
	}
	rdb := redis.NewClient(redisOpts)
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		slog.Error("❌ Redis unreachable", "error", err)
		os.Exit(1)
	}
	slog.Info("✅ Connected to Redis")

	// 3. Kubernetes
	k8sConfig, err := clientcmd.BuildConfigFromFlags("", cfg.KubeConfig)
	if err != nil {
		slog.Error("❌ Kubeconfig error", "error", err)
		os.Exit(1)
	}
	k8sClient, err := kubernetes.NewForConfig(k8sConfig)
	if err != nil {
		slog.Error("❌ K8s Client error", "error", err)
		os.Exit(1)
	}
	slog.Info("✅ Connected to Kubernetes")

	// 4. Wiring
	// Processor knows HOW to build
	processor := worker.NewProcessor(cfg, k8sClient, database)
	// Consumer knows WHEN to build
	consumer := queue.NewConsumer(rdb, processor)

	// 5. Graceful Shutdown
	ctx, cancel := context.WithCancel(context.Background())
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start Consumer in Background
	go consumer.Start(ctx)

	// Wait for Stop Signal
	<-sigChan
	slog.Info("🛑 Shutdown signal received")
	cancel() // Signals the consumer to stop its loop
	slog.Info("👋 Bye!")
}