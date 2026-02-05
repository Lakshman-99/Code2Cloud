package builder

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"go.uber.org/zap"

	"code2cloud/worker/internal/logging"
)

type Builder struct {
	config     Config
	logFactory *logging.Factory
	logger     *zap.Logger
}

func NewBuilder(config Config, logFactory *logging.Factory, logger *zap.Logger) *Builder {
	return &Builder{
		config:     config,
		logFactory: logFactory,
		logger:     logger,
	}
}

func (b *Builder) Build(ctx context.Context, opts Options) (*Result, error) {
	startTime := time.Now()

	buildLog := b.logFactory.CreatePrefixedLogger(
		opts.DeploymentID,
		"[build] ",
		logging.SourceBuild,
	)
	defer buildLog.Close()

	b.logger.Info("Starting build",
		zap.String("sourcePath", opts.SourcePath),
		zap.String("imageName", opts.ImageName),
		zap.String("framework", opts.BuildConfig.Framework),
	)

	// ─────────────────────────────────────────────────────────
	// Step 1: Verify source path exists
	// ─────────────────────────────────────────────────────────
	if _, err := os.Stat(opts.SourcePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("source path does not exist: %s", opts.SourcePath)
	}

	buildLog.Log(fmt.Sprintf("Building from: %s", opts.SourcePath))
	buildLog.Log(fmt.Sprintf("Target image: %s", opts.ImageName))

	// ─────────────────────────────────────────────────────────
	// Step 2: Build command arguments
	// ─────────────────────────────────────────────────────────
	args := b.buildRailpackArgs(opts)

	buildLog.Log("")
	buildLog.Log("$ railpack " + strings.Join(sanitizeArgs(args), " "))
	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 3: Create command with timeout
	// ─────────────────────────────────────────────────────────
	timeout := b.config.Timeout
	if timeout == 0 {
		timeout = 15 * time.Minute
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "railpack", args...)
	cmd.Dir = opts.SourcePath

	// Set environment
	cmd.Env = b.buildEnv(opts)

	// ─────────────────────────────────────────────────────────
	// Step 4: Attach logging
	// ─────────────────────────────────────────────────────────
	cmd.Stdout = buildLog
	cmd.Stderr = buildLog

	// ─────────────────────────────────────────────────────────
	// Step 5: Execute build
	// ─────────────────────────────────────────────────────────
	buildLog.Log("🔨 Starting Railpack build...")
	buildLog.Log("")

	if err := cmd.Run(); err != nil {
		buildLog.Flush()

		// Check for context errors
		if ctx.Err() == context.DeadlineExceeded {
			return nil, fmt.Errorf("build timed out after %s", timeout)
		}
		if ctx.Err() == context.Canceled {
			return nil, fmt.Errorf("build was canceled")
		}

		// Check exit code
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("build failed with exit code %d", exitErr.ExitCode())
		}

		return nil, fmt.Errorf("build failed: %w", err)
	}

	duration := time.Since(startTime)

	buildLog.Log("")
	buildLog.Log(fmt.Sprintf("✓ Build completed in %s", duration.Round(time.Second)))
	buildLog.Log(fmt.Sprintf("✓ Image pushed: %s", opts.ImageName))

	b.logger.Info("Build completed",
		zap.String("image", opts.ImageName),
		zap.Duration("duration", duration),
	)

	return &Result{
		ImageName: opts.ImageName,
		Duration:  duration,
		Framework: opts.BuildConfig.Framework,
	}, nil
}


func (b *Builder) buildRailpackArgs(opts Options) []string {
	args := []string{"build", "."}

	args = append(args, "--image", opts.ImageName)

	if b.config.BuildkitAddr != "" {
		args = append(args, "--buildkit-addr", b.config.BuildkitAddr)
	}

	args = append(args, "--push")

	if b.config.InsecureRegistry {
		args = append(args, "--insecure-registry")
	}

	if b.config.Platform != "" {
		args = append(args, "--platform", b.config.Platform)
	}

	if opts.ProjectName != "" {
		args = append(args, "--cache-key", opts.ProjectName)
	}

	if opts.BuildConfig.InstallCommand != "" {
		args = append(args, "--install-cmd", opts.BuildConfig.InstallCommand)
	}
	if opts.BuildConfig.BuildCommand != "" {
		args = append(args, "--build-cmd", opts.BuildConfig.BuildCommand)
	}
	if opts.BuildConfig.RunCommand != "" {
		args = append(args, "--start-cmd", opts.BuildConfig.RunCommand)
	}

	for key, value := range opts.EnvVars {
		args = append(args, "--env", fmt.Sprintf("%s=%s", key, value))
	}

	for key, value := range opts.BuildEnvVars {
		args = append(args, "--build-env", fmt.Sprintf("%s=%s", key, value))
	}

	return args
}

func (b *Builder) buildEnv(opts Options) []string {
	env := os.Environ()

	env = append(env,
		"DOCKER_BUILDKIT=1",
		"BUILDKIT_PROGRESS=plain",
	)

	return env
}

func sanitizeArgs(args []string) []string {
	sanitized := make([]string, len(args))
	copy(sanitized, args)

	// Patterns to hide
	sensitiveFlags := []string{"--env", "--build-env", "-e"}

	for i := 0; i < len(sanitized)-1; i++ {
		for _, flag := range sensitiveFlags {
			if sanitized[i] == flag {
				// Hide the value part after =
				if idx := strings.Index(sanitized[i+1], "="); idx != -1 {
					key := sanitized[i+1][:idx]
					sanitized[i+1] = key + "=***"
				}
			}
		}
	}

	return sanitized
}