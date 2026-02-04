package git

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"go.uber.org/zap"
)

type VerifyResult struct {
	GitInstalled bool
	GitVersion   string
	GitPath      string
	Error        string
}

// Verify checks that git is installed and working
func Verify(ctx context.Context, logger *zap.Logger) (*VerifyResult, error) {
	result := &VerifyResult{}

	gitPath, err := exec.LookPath("git")
	if err != nil {
		result.Error = "git not found in PATH"
		logger.Error("Git verification failed", zap.String("error", result.Error))
		return result, fmt.Errorf("git not found: %w", err)
	}
	result.GitPath = gitPath
	result.GitInstalled = true

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "git", "--version")
	output, err := cmd.Output()
	if err != nil {
		result.Error = "failed to get git version"
		return result, fmt.Errorf("git version check failed: %w", err)
	}

	result.GitVersion = strings.TrimSpace(string(output))

	logger.Info("Git verification passed",
		zap.String("path", result.GitPath),
		zap.String("version", result.GitVersion),
	)

	return result, nil
}

// ParseRepoInfo extracts owner and repo name from a git URL
func ParseRepoInfo(url string) (owner, repo string, err error) {
	// Remove .git suffix
	url = strings.TrimSuffix(url, ".git")

	// Handle HTTPS URLs: https://github.com/owner/repo
	url = strings.TrimPrefix(url, "https://")
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimPrefix(url, "github.com/")
	url = strings.TrimPrefix(url, "gitlab.com/")
	url = strings.TrimPrefix(url, "bitbucket.org/")

	parts := strings.Split(url, "/")
	if len(parts) < 2 {
		return "", "", fmt.Errorf("cannot parse owner/repo from URL")
	}

	return parts[0], parts[1], nil
}

// BuildCloneURL constructs a proper HTTPS clone URL
func BuildCloneURL(host, owner, repo string) string {
	return fmt.Sprintf("https://%s/%s/%s.git", host, owner, repo)
}