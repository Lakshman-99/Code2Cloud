package api

import (
	"context"
	"fmt"

	"go.uber.org/zap"
)

type LogSource string

const (
	LogSourceBuild   LogSource = "BUILD"
	LogSourceRuntime LogSource = "RUNTIME"
	LogSourceSystem  LogSource = "SYSTEM"
)

type LogEntry struct {
	ID           string `json:"id"`
	DeploymentID string `json:"deploymentId"`
	Source       string `json:"source"`
	Timestamp    string `json:"timestamp"`
	Message      string `json:"message"`
}

type SaveLogsRequest struct {
	Source   string   `json:"source"`
	Messages []string `json:"messages"`
}

// SaveLogs saves multiple log entries for a deployment
func (c *Client) SaveLogs(ctx context.Context, deploymentID string, source LogSource, messages []string) error {
	if len(messages) == 0 {
		return nil
	}

	path := fmt.Sprintf("/internal/deployments/%s/logs", deploymentID)
	body := SaveLogsRequest{
		Source:   string(source),
		Messages: messages,
	}

	if err := c.post(ctx, path, body, nil); err != nil {
		return fmt.Errorf("failed to save logs: %w", err)
	}

	c.logger.Debug("Saved logs",
		zap.String("deploymentId", deploymentID),
		zap.String("source", string(source)),
		zap.Int("count", len(messages)),
	)

	return nil
}

// SaveLogsRaw is a generic version that accepts string source
func (c *Client) SaveLogsRaw(ctx context.Context, deploymentID string, source string, messages []string) error {
	if len(messages) == 0 {
		return nil
	}

	path := fmt.Sprintf("/internal/deployments/%s/logs", deploymentID)
	body := SaveLogsRequest{
		Source:   source,
		Messages: messages,
	}

	if err := c.post(ctx, path, body, nil); err != nil {
		return fmt.Errorf("failed to save logs: %w", err)
	}

	return nil
}

// SaveLog saves a single log entry (convenience method)
func (c *Client) SaveLog(ctx context.Context, deploymentID string, source LogSource, message string) error {
	return c.SaveLogs(ctx, deploymentID, source, []string{message})
}

// GetLogs retrieves logs for a deployment
func (c *Client) GetLogs(ctx context.Context, deploymentID string, source *LogSource, limit int) ([]LogEntry, error) {
	path := fmt.Sprintf("/internal/deployments/%s/logs?limit=%d", deploymentID, limit)
	if source != nil {
		path += fmt.Sprintf("&source=%s", *source)
	}

	var result struct {
		Logs    []LogEntry `json:"logs"`
		HasMore bool       `json:"hasMore"`
	}

	if err := c.get(ctx, path, &result); err != nil {
		return nil, fmt.Errorf("failed to get logs: %w", err)
	}

	return result.Logs, nil
}