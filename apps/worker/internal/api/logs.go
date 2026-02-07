package api

import (
	"context"
	"fmt"
	"time"

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
	Logs []SaveLogEntry `json:"logs"`
}

type SaveLogEntry struct {
	Source    string `json:"source"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp,omitempty"`
}

// SaveLogs saves multiple log entries for a deployment
func (c *Client) SaveLogs(ctx context.Context, deploymentID string, source LogSource, messages []string) error {
	if len(messages) == 0 {
		return nil
	}

	path := fmt.Sprintf("/internal/deployments/%s/logs", deploymentID)

	now := time.Now().UTC().Format(time.RFC3339)
	logs := make([]SaveLogEntry, 0, len(messages))
	for _, msg := range messages {
		logs = append(logs, SaveLogEntry{
			Source:    string(source),
			Message:   msg,
			Timestamp: now,
		})
	}

	body := SaveLogsRequest{Logs: logs}

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

	now := time.Now().UTC().Format(time.RFC3339)
	logs := make([]SaveLogEntry, 0, len(messages))
	for _, msg := range messages {
		logs = append(logs, SaveLogEntry{
			Source:    source,
			Message:   msg,
			Timestamp: now,
		})
	}

	body := SaveLogsRequest{Logs: logs}

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

// triggers the log cleanup process in the backend
func (c *Client) TriggerLogCleanup(ctx context.Context) (int, error) {
	path := "/internal/logs/cleanup"

	var result struct {
		Success bool `json:"success"`
		Count   int  `json:"count"`
	}

	if err := c.post(ctx, path, nil, &result); err != nil {
		return 0, err
	}

	return result.Count, nil
}