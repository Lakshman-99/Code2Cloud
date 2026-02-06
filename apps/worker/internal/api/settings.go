package api

import (
	"context"
	"fmt"

	"go.uber.org/zap"
)

type ProjectSettings struct {
	// TTL & Lifecycle
	GlobalTTLMinutes    int  `json:"globalTTLMinutes"`
	TurboMode           bool `json:"turboMode"`
	LogRetentionDays    int  `json:"logRetentionDays"`
	MaxConcurrentBuilds int  `json:"maxConcurrentBuilds"`

	// Notifications
	SlackWebhook       *string `json:"slackWebhook"`
	EmailDeployFailed  bool    `json:"emailDeployFailed"`
	EmailDeploySuccess bool    `json:"emailDeploySuccess"`

	// User info (for notifications)
	User struct {
		ID    string  `json:"id"`
		Email string  `json:"email"`
		Name  *string `json:"name"`
	} `json:"user"`
}

func (s *ProjectSettings) DefaultCPURequest() string {
	if s.TurboMode {
		return "200m"
	}
	return "100m"
}

func (s *ProjectSettings) DefaultCPULimit() string {
	if s.TurboMode {
		return "1000m"
	}
	return "500m"
}

func (s *ProjectSettings) DefaultMemoryRequest() string {
	if s.TurboMode {
		return "256Mi"
	}
	return "128Mi"
}

func (s *ProjectSettings) DefaultMemoryLimit() string {
	if s.TurboMode {
		return "1Gi"
	}
	return "512Mi"
}

func (c *Client) GetProjectSettings(ctx context.Context, projectID string) (*ProjectSettings, error) {
	path := fmt.Sprintf("/internal/settings/by-project/%s", projectID)

	var settings ProjectSettings
	if err := c.get(ctx, path, &settings); err != nil {
		// Return defaults if settings don't exist
		c.logger.Warn("Failed to get project settings, using defaults",
			zap.String("projectId", projectID),
			zap.Error(err),
		)
		return &ProjectSettings{
			GlobalTTLMinutes:    5,
			TurboMode:           false,
			LogRetentionDays:    1,
			MaxConcurrentBuilds: 1,
			EmailDeployFailed:   true,
			EmailDeploySuccess:  true,
		}, nil
	}

	return &settings, nil
}

// UpdateProjectStatus updates the online status of a project
func (c *Client) UpdateProjectStatus(ctx context.Context, projectID string, status string) error {
	path := fmt.Sprintf("/internal/projects/%s/status", projectID)
	body := map[string]string{"onlineStatus": status}

	if err := c.patch(ctx, path, body); err != nil {
		return fmt.Errorf("failed to update project status: %w", err)
	}

	return nil
}
