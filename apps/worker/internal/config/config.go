package config

import (
	"log"
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	RedisURL    string
	DatabaseURL string
	KubeConfig  string
	Environment string
	
	BuildImage  string 
	RegistryURL string 
}

// Load reads .env files and environment variables, returning a Config struct.
func Load() *Config {
	// 1. Load .env file
	_ = godotenv.Load()

	return &Config{
		RedisURL:    getEnvOrPanic("REDIS_URL"),
		DatabaseURL: getEnvOrPanic("DATABASE_URL"),
		KubeConfig:  os.Getenv("KUBECONFIG"),
		Environment: getEnv("APP_ENV", "dev"),
		
		BuildImage:  getEnv("BUILDER_IMAGE", "registry.kube-system.svc.cluster.local:5000/builder:latest"),
		RegistryURL: getEnv("REGISTRY_URL", "registry.kube-system.svc.cluster.local:5000"),
	}
}

// Helper: Get an env var or return a default value if missing
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// Helper: Get an env var or CRASH if missing (Fail Fast)
func getEnvOrPanic(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		log.Fatalf("❌ FATAL: Environment variable %s is required", key)
	}
	return value
}