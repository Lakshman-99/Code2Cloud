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
	args := b.buildArgs(opts)

	buildLog.Log("")
	buildLog.Log("$ buildctl " + strings.Join(sanitizeArgs(args), " "))
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

	cmd := exec.CommandContext(ctx, "buildctl", args...)
	cmd.Dir = opts.SourcePath
	cmd.Env = os.Environ()

	if opts.BuildConfig.InstallCommand != "" {
		installCmd := normalizeInstallCommand(opts.BuildConfig.InstallCommand)
		cmd.Env = append(cmd.Env, "RAILPACK_INSTALL_CMD="+installCmd)
		args = append(args, "--secret", "id=RAILPACK_INSTALL_CMD,env=RAILPACK_INSTALL_CMD")
		cmd.Args = append(cmd.Args[:1], args...)
	}

	// ─────────────────────────────────────────────────────────
	// Step 4: Attach logging
	// ─────────────────────────────────────────────────────────
	cmd.Stdout = buildLog
	cmd.Stderr = buildLog

	// ─────────────────────────────────────────────────────────
	// Step 5: Execute build
	// ─────────────────────────────────────────────────────────
	// ─────────────────────────────────────────────────────────
	// Step 5a: Generate Railpack build plan
	// ─────────────────────────────────────────────────────────
	buildLog.Log("📋 Generating Railpack build plan...")

	prepareArgs := []string{"prepare", ".", "--plan-out", "railpack-plan.json"}
	if opts.BuildConfig.BuildCommand != "" {
		prepareArgs = append(prepareArgs, "--build-cmd", opts.BuildConfig.BuildCommand)
	}
	if opts.BuildConfig.RunCommand != "" {
		prepareArgs = append(prepareArgs, "--start-cmd", opts.BuildConfig.RunCommand)
	}
	if opts.BuildConfig.InstallCommand != "" {
		installCmd := normalizeInstallCommand(opts.BuildConfig.InstallCommand)
		prepareArgs = append(prepareArgs, "--env", "RAILPACK_INSTALL_CMD="+installCmd)
	}

	// Always tell Railpack which port the app will listen on
	if port, ok := opts.EnvVars["PORT"]; ok && port != "" {
		prepareArgs = append(prepareArgs, "--env", "PORT="+port)
	} else {
		prepareArgs = append(prepareArgs, "--env", "PORT=3000")
	}

	prepareCmd := exec.CommandContext(ctx, "railpack", prepareArgs...)
	prepareCmd.Dir = opts.SourcePath
	prepareCmd.Stdout = buildLog
	prepareCmd.Stderr = buildLog
	prepareCmd.Env = os.Environ()

	if err := prepareCmd.Run(); err != nil {
		buildLog.Flush()
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("railpack prepare failed with exit code %d", exitErr.ExitCode())
		}
		return nil, fmt.Errorf("railpack prepare failed: %w", err)
	}

	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 5b: Build with BuildKit using railpack frontend
	// ─────────────────────────────────────────────────────────
	// Exclude .git from context transfer to reduce size sent to BuildKit
	b.writeDockerIgnore(opts.SourcePath)

	buildLog.Log("🔨 Building image with BuildKit...")
	buildLog.Log("")

	if err := cmd.Run(); err != nil {
		buildLog.Flush()

		if ctx.Err() == context.DeadlineExceeded {
			return nil, fmt.Errorf("build timed out after %s", timeout)
		}
		if ctx.Err() == context.Canceled {
			return nil, fmt.Errorf("build was canceled")
		}

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

func (b *Builder) buildArgs(opts Options) []string {
	args := []string{
		"--addr", b.config.BuildkitAddr,
		"build",
		"--frontend", "gateway.v0",
		"--opt", "source=ghcr.io/railwayapp/railpack-frontend:latest",
		"--local", "context=" + opts.SourcePath,
		"--local", "dockerfile=" + opts.SourcePath,
		"--progress", "plain",
		"--export-cache", "type=inline",
		"--import-cache", "type=registry,ref=" + opts.ImageName,
	}

	output := fmt.Sprintf("type=image,name=%s,push=true,compression=uncompressed", opts.ImageName)
	if b.config.InsecureRegistry {
		output += ",registry.insecure=true"
	}
	args = append(args, "--output", output)

	return args
}

// writeDockerIgnore creates or appends to .dockerignore in the source directory
// to exclude .git/ from the BuildKit context transfer, reducing context size.
func (b *Builder) writeDockerIgnore(sourcePath string) {
	ignorePath := sourcePath + "/.dockerignore"
	if data, err := os.ReadFile(ignorePath); err == nil {
		if strings.Contains(string(data), ".git") {
			return
		}
		if f, err := os.OpenFile(ignorePath, os.O_APPEND|os.O_WRONLY, 0644); err == nil {
			f.WriteString("\n.git\n")
			f.Close()
		}
		return
	}
	os.WriteFile(ignorePath, []byte(".git\n"), 0644)
}

func normalizeInstallCommand(cmd string) string {
	cmd = strings.TrimSpace(cmd)
	if cmd == "" {
		return cmd
	}
	if cmd == "npm ci" {
		return "npm ci || npm install"
	}
	if strings.HasPrefix(cmd, "--") {
		return "npm install " + cmd
	}
	return cmd
}

func sanitizeArgs(args []string) []string {
	sanitized := make([]string, len(args))
	copy(sanitized, args)

	for i := 0; i < len(sanitized); i++ {
		if sanitized[i] == "--opt" && i+1 < len(sanitized) {
			opt := sanitized[i+1]
			if strings.HasPrefix(opt, "env:") {
				if idx := strings.Index(opt, "="); idx != -1 {
					key := opt[:idx]
					sanitized[i+1] = key + "=***"
				}
			}
		}
	}

	return sanitized
}

