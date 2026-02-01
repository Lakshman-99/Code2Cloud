package config

import (
	"errors"
	"os"
)


type Config struct {
	Environment string
	// ─── Redis (Job Queue) ───────────────────────────────────
	RedisURL     string

	// ─── Database ────────────────────────────────────────────
	DatabaseURL string

	// ─── BuildKit ────────────────────────────────────────────
	BuildkitAddr string

	// ─── Registry ────────────────────────────────────────────
	RegistryURL      string
	RegistryInsecure bool

	// ─── Kubernetes ──────────────────────────────────────────
	Namespace string

	// ─── Domain ──────────────────────────────────────────────
	BaseDomain string

	// ─── Worker Settings ─────────────────────────────────────
	QueueName       string
	WorkerID        string
	ConcurrentJobs  int
	WorkspacePath   string
}

func Load() (*Config, error) {
	cfg := &Config{
		Environment:     getEnv("GO_ENV", "production"),
		RedisURL:        getEnv("REDIS_URL", "redis://redis.code2cloud.svc.cluster.local:6379"),
		DatabaseURL:     getEnv("DATABASE_URL", ""),
		BuildkitAddr:    getEnv("BUILDKIT_ADDR", "tcp://buildkitd.default.svc.cluster.local:1234"),
		RegistryURL:     getEnv("REGISTRY_URL", "registry.registry.svc.cluster.local:5000"),
		RegistryInsecure: getEnv("REGISTRY_INSECURE", "true") == "true",
		Namespace:       getEnv("K8S_NAMESPACE", "deployments"),
		BaseDomain:      getEnv("BASE_DOMAIN", "code2cloud.lakshman.me"),
		QueueName:       getEnv("QUEUE_NAME", "build-queue"),
		WorkerID:        getEnv("WORKER_ID", "worker-1"),
		ConcurrentJobs:  1, 
		WorkspacePath:   getEnv("WORKSPACE_PATH", "/tmp/builds"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}