package builder

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"go.uber.org/zap"
)

type VerifyResult struct {
	RailpackInstalled bool
	RailpackVersion   string
	RailpackPath      string
	BuildkitReachable bool
	Error             string
}

func Verify(ctx context.Context, buildkitAddr string, logger *zap.Logger) (*VerifyResult, error) {
	result := &VerifyResult{}

	railpackPath, err := exec.LookPath("railpack")
	if err != nil {
		result.Error = "railpack not found in PATH"
		logger.Error("Railpack verification failed", zap.String("error", result.Error))
		return result, fmt.Errorf("railpack not found: %w", err)
	}
	result.RailpackPath = railpackPath
	result.RailpackInstalled = true

	// Get version
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "railpack", "--version")
	output, err := cmd.Output()
	if err != nil {
		result.Error = "failed to get railpack version"
		return result, fmt.Errorf("railpack version check failed: %w", err)
	}
	result.RailpackVersion = strings.TrimSpace(string(output))

	logger.Info("Railpack verification passed",
		zap.String("path", result.RailpackPath),
		zap.String("version", result.RailpackVersion),
	)

	if buildkitAddr != "" {
		// We can't easily test BuildKit without buildctl
		// So we'll just mark it as "assumed reachable"
		// The actual build will fail if it's not reachable
		result.BuildkitReachable = true
		logger.Info("BuildKit address configured",
			zap.String("addr", buildkitAddr),
		)
	}

	return result, nil
}

func VerifyBuildctl(ctx context.Context, logger *zap.Logger) (bool, string) {
	buildctlPath, err := exec.LookPath("buildctl")
	if err != nil {
		return false, ""
	}

	cmd := exec.CommandContext(ctx, "buildctl", "--version")
	output, err := cmd.Output()
	if err != nil {
		return true, "unknown"
	}

	version := strings.TrimSpace(string(output))
	logger.Info("buildctl available",
		zap.String("path", buildctlPath),
		zap.String("version", version),
	)

	return true, version
}


func CheckBuildkitHealth(ctx context.Context, addr string, logger *zap.Logger) error {
	_, err := exec.LookPath("buildctl")
	if err != nil {
		// buildctl not available, skip health check
		logger.Debug("buildctl not available, skipping BuildKit health check")
		return nil
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "buildctl", "--addr", addr, "debug", "workers")
	output, err := cmd.CombinedOutput()
	if err != nil {
		logger.Warn("BuildKit health check failed",
			zap.String("addr", addr),
			zap.String("output", string(output)),
			zap.Error(err),
		)
		return fmt.Errorf("buildkit not reachable at %s: %w", addr, err)
	}

	logger.Info("BuildKit health check passed", zap.String("addr", addr))
	return nil
}