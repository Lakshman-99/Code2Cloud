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
	}

	for key, value := range opts.EnvVars {
		cmd.Env = append(cmd.Env, key+"="+value)
		args = append(args, "--secret", "id="+key+",env="+key)
	}

	cmd.Args = append(cmd.Args[:1], args...)

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
	prepareStart := time.Now()

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

	// Pass build-time environment variables to railpack
	for key, value := range opts.EnvVars {
		prepareArgs = append(prepareArgs, "--env", fmt.Sprintf("%s=%s", key, value))
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

	prepareDuration := time.Since(prepareStart)
	buildLog.Log(fmt.Sprintf("✓ Plan generated in %s", prepareDuration.Round(time.Millisecond)))
	buildLog.Log("")

	// ─────────────────────────────────────────────────────────
	// Step 5b: Build with BuildKit using railpack frontend
	// ─────────────────────────────────────────────────────────
	cacheRef := b.cacheRef(opts.ProjectName)
	if cacheRef != "" {
		buildLog.Log(fmt.Sprintf("🔨 Building image with BuildKit (cache: %s)...", cacheRef))
	} else {
		buildLog.Log("🔨 Building image with BuildKit (no cache)...")
	}
	buildLog.Log("")

	buildStart := time.Now()

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

	buildDuration := time.Since(buildStart)
	totalDuration := time.Since(startTime)

	buildLog.Log("")
	buildLog.Log(fmt.Sprintf("✓ Plan:  %s", prepareDuration.Round(time.Second)))
	buildLog.Log(fmt.Sprintf("✓ Build: %s (includes push to registry)", buildDuration.Round(time.Second)))
	buildLog.Log(fmt.Sprintf("✓ Total: %s", totalDuration.Round(time.Second)))
	buildLog.Log(fmt.Sprintf("✓ Image pushed: %s", opts.ImageName))

	b.logger.Info("Build completed",
		zap.String("image", opts.ImageName),
		zap.Duration("total", totalDuration),
		zap.Duration("prepare", prepareDuration),
		zap.Duration("build_and_push", buildDuration),
	)

	return &Result{
		ImageName: opts.ImageName,
		Duration:  totalDuration,
		Framework: opts.BuildConfig.Framework,
		CacheUsed: cacheRef != "",
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
	}

	output := fmt.Sprintf("type=image,name=%s,push=true", opts.ImageName)
	if b.config.InsecureRegistry {
		output += ",registry.insecure=true"
	}
	args = append(args, "--output", output)

	cacheRef := b.cacheRef(opts.ProjectName)
	if cacheRef != "" {
		args = append(args, "--import-cache", fmt.Sprintf("type=registry,ref=%s", cacheRef))
		args = append(args, "--export-cache", fmt.Sprintf("type=registry,ref=%s,mode=max", cacheRef))
	}

	return args
}

// cacheRef builds the registry reference used for layer caching.
// Each project gets its own cache tag so layers are reused across deploys.
func (b *Builder) cacheRef(projectName string) string {
	if b.config.RegistryURL == "" || projectName == "" {
		return ""
	}
	name := sanitizeProjectName(projectName)
	if name == "" {
		return ""
	}
	return fmt.Sprintf("%s/%s:buildcache", b.config.RegistryURL, name)
}

func sanitizeProjectName(name string) string {
	name = strings.ToLower(name)
	result := make([]byte, 0, len(name))
	for i := 0; i < len(name); i++ {
		c := name[i]
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result = append(result, c)
		} else if c == '_' || c == ' ' {
			result = append(result, '-')
		}
	}
	return string(result)
}

func normalizeInstallCommand(cmd string) string {
	cmd = strings.TrimSpace(cmd)
	if cmd == "" {
		return cmd
	}
	// If it starts with "--", it's just flags — prepend "npm install"
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