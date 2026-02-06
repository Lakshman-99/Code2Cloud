package config

import (
	"errors"
	"os"
	"strconv"
	"time"
)


type Config struct {
	// ─── NestJS API ──────────────────────────────────────────
	APIBaseURL   string
	WorkerAPIKey string
	Environment	 string

	// ─── Redis (Job Queue) ───────────────────────────────────
	RedisURL     string

	// ─── BuildKit ────────────────────────────────────────────
	BuildkitAddr string

	// ─── Registry ────────────────────────────────────────────
	RegistryURL      string
	RegistryInsecure bool

	// ─── Build Settings ──────────────────────────────────────
	BuildTimeout time.Duration
	BuildPlatform string

	// ─── Kubernetes ──────────────────────────────────────────
	Namespace string

	// ─── Domain ──────────────────────────────────────────────
	ServerIP string
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
		APIBaseURL:      getEnv("API_BASE_URL", "http://api.code2cloud.lakshman.me"),
		WorkerAPIKey:    getEnv("WORKER_API_KEY", ""),
		RedisURL:        getEnv("REDIS_URL", "redis://redis.code2cloud.svc.cluster.local:6379"),
		BuildkitAddr:    getEnv("BUILDKIT_ADDR", "tcp://buildkitd.default.svc.cluster.local:1234"),
		RegistryURL:     getEnv("REGISTRY_URL", "registry.registry.svc.cluster.local:5000"),
		RegistryInsecure: getEnv("REGISTRY_INSECURE", "true") == "true",
		BuildTimeout:    getDurationEnv("BUILD_TIMEOUT", 15*time.Minute),
		BuildPlatform:   getEnv("BUILD_PLATFORM", ""),
		Namespace:       getEnv("K8S_NAMESPACE", "deployments"),
		ServerIP:        getEnv("SERVER_IP", ""),
		BaseDomain:      getEnv("BASE_DOMAIN", "code2cloud.lakshman.me"),
		QueueName:       getEnv("QUEUE_NAME", "build-queue"),
		WorkerID:        getEnv("WORKER_ID", "worker-1"),
		ConcurrentJobs:  getIntEnv("CONCURRENT_JOBS", 1),
		WorkspacePath:   getEnv("WORKSPACE_PATH", "/tmp/builds"),
	}

	// Validate required fields
	if cfg.WorkerAPIKey == "" {
		return nil, errors.New("WORKER_API_KEY is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}