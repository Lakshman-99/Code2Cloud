package git

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"go.uber.org/zap"

	"code2cloud/worker/internal/logging"
)

type Cloner struct {
	workspacePath string
	logFactory    *logging.Factory
	logger        *zap.Logger
}

func NewCloner(workspacePath string, logFactory *logging.Factory, logger *zap.Logger) *Cloner {
	return &Cloner{
		workspacePath: workspacePath,
		logFactory:    logFactory,
		logger:        logger,
	}
}

type CloneOptions struct {
	RepoURL        string
	Branch         string
	CommitHash     string
	InstallationID int
	Token          string
	DeploymentID   string
	Shallow        bool
	Depth          int
}

type CloneResult struct {
	Path       string
	CommitHash string
	Duration   time.Duration
}

func (c *Cloner) Clone(ctx context.Context, opts CloneOptions) (*CloneResult, error) {
	startTime := time.Now()

	// Create a logger for this clone operation
	streamLogger := c.logFactory.CreatePrefixedLogger(opts.DeploymentID, "[git] ", logging.SourceBuild)
	defer streamLogger.Close()

	// ─────────────────────────────────────────────────────────
	// Step 1: Create unique directory for this clone
	// ─────────────────────────────────────────────────────────
	clonePath := filepath.Join(c.workspacePath, opts.DeploymentID)

	// Ensure workspace exists
	if err := os.MkdirAll(c.workspacePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create workspace: %w", err)
	}

	// Remove if exists (clean slate)
	os.RemoveAll(clonePath)

	c.logger.Info("Cloning repository",
		zap.String("url", opts.RepoURL),
		zap.String("branch", opts.Branch),
		zap.String("path", clonePath),
		zap.Bool("shallow", opts.Shallow),
	)

	// ─────────────────────────────────────────────────────────
	// Step 2: Build authenticated URL
	// ─────────────────────────────────────────────────────────
	authURL := c.buildAuthURL(opts.RepoURL, opts.Token)

	// ─────────────────────────────────────────────────────────
	// Step 3: Build git clone command
	// ─────────────────────────────────────────────────────────
	args := []string{"clone"}

	// Shallow clone (faster - only latest commit)
	if opts.Shallow {
		depth := opts.Depth
		if depth == 0 {
			depth = 1
		}
		args = append(args, "--depth", fmt.Sprintf("%d", depth))
	}

	// Specify branch
	if opts.Branch != "" {
		args = append(args, "--branch", opts.Branch)
	}

	// Single branch (faster)
	args = append(args, "--single-branch")

	// Progress output
	args = append(args, "--progress")

	// Add URL and destination
	args = append(args, authURL, clonePath)

	// ─────────────────────────────────────────────────────────
	// Step 4: Execute git clone with live logging
	// ─────────────────────────────────────────────────────────
	cmd := exec.CommandContext(ctx, "git", args...)

	// Set environment for git
	cmd.Env = append(os.Environ(),
		"GIT_TERMINAL_PROMPT=0", // Never prompt for credentials
	)

	// Use StreamLogger for both stdout and stderr
	cmd.Stdout = streamLogger
	cmd.Stderr = streamLogger

	// Log command (without exposing token!)
	safeURL := c.sanitizeURL(opts.RepoURL)
	streamLogger.Log(fmt.Sprintf("$ git clone --depth 1 --branch %s %s", opts.Branch, safeURL))

	// Run the command
	if err := cmd.Run(); err != nil {
		streamLogger.Flush()
		return nil, fmt.Errorf("git clone failed: %w", err)
	}

	// ─────────────────────────────────────────────────────────
	// Step 5: Checkout specific commit if provided
	// ─────────────────────────────────────────────────────────
	actualCommit := opts.CommitHash
	if opts.CommitHash != "" && !opts.Shallow {
		if err := c.checkout(ctx, clonePath, opts.CommitHash, streamLogger); err != nil {
			c.logger.Warn("Failed to checkout specific commit, using branch HEAD",
				zap.Error(err),
			)
		}
	}

	// Get actual commit hash if not provided
	if actualCommit == "" {
		actualCommit, _ = c.getHeadCommit(ctx, clonePath)
	}

	duration := time.Since(startTime)

	streamLogger.Log(fmt.Sprintf("✓ Clone completed in %s (commit: %s)", duration.Round(time.Millisecond), actualCommit[:8]))

	c.logger.Info("Clone completed",
		zap.String("path", clonePath),
		zap.String("commit", actualCommit),
		zap.Duration("duration", duration),
	)

	return &CloneResult{
		Path:       clonePath,
		CommitHash: actualCommit,
		Duration:   duration,
	}, nil
}

// Cleanup removes the cloned repository
func (c *Cloner) Cleanup(path string) error {
	c.logger.Debug("Cleaning up clone", zap.String("path", path))
	return os.RemoveAll(path)
}

// buildAuthURL adds token authentication to the URL
// https://github.com/user/repo.git -> https://x-access-token:TOKEN@github.com/user/repo.git
func (c *Cloner) buildAuthURL(repoURL, token string) string {
	if token == "" {
		return repoURL
	}

	// Handle HTTPS URLs
	if strings.HasPrefix(repoURL, "https://") {
		// Insert token after https://
		return strings.Replace(
			repoURL,
			"https://",
			fmt.Sprintf("https://x-access-token:%s@", token),
			1,
		)
	}

	// Handle github.com shorthand
	if strings.HasPrefix(repoURL, "github.com/") {
		return fmt.Sprintf("https://x-access-token:%s@%s", token, repoURL)
	}

	return repoURL
}

// sanitizeURL removes sensitive info from URL for logging
func (c *Cloner) sanitizeURL(url string) string {
	// Remove any embedded credentials
	if idx := strings.Index(url, "@"); idx != -1 {
		if protoIdx := strings.Index(url, "://"); protoIdx != -1 {
			return url[:protoIdx+3] + url[idx+1:]
		}
	}
	return url
}

// checkout checks out a specific commit
func (c *Cloner) checkout(ctx context.Context, repoPath, commit string, streamLogger *logging.StreamLogger) error {
	cmd := exec.CommandContext(ctx, "git", "checkout", commit)
	cmd.Dir = repoPath
	cmd.Stdout = streamLogger
	cmd.Stderr = streamLogger

	streamLogger.Log(fmt.Sprintf("$ git checkout %s", commit[:8]))

	return cmd.Run()
}

// getHeadCommit gets the current HEAD commit hash
func (c *Cloner) getHeadCommit(ctx context.Context, repoPath string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", "rev-parse", "HEAD")
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(output)), nil
}