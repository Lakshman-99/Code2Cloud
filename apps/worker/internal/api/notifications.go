package api

import (
	"context"

	"go.uber.org/zap"
)

type NotificationType string

const (
	NotificationSuccess NotificationType = "success"
	NotificationFailed  NotificationType = "failed"
)

type DeploymentNotification struct {
	DeploymentID string           `json:"deploymentId"`
	Type         NotificationType `json:"type"`
	ProjectName  string           `json:"projectName"`
	URL          *string          `json:"url,omitempty"`
	Error        *string          `json:"error,omitempty"`
	Duration     *int             `json:"duration,omitempty"` // seconds
}

func (c *Client) SendDeploymentNotification(ctx context.Context, notification DeploymentNotification) error {
	path := "/internal/notifications/deployment"

	if err := c.post(ctx, path, notification, nil); err != nil {
		// Log but don't fail deployment for notification errors
		c.logger.Warn("Failed to send notification",
			zap.String("deploymentId", notification.DeploymentID),
			zap.String("type", string(notification.Type)),
			zap.Error(err),
		)
		return nil // Don't propagate error
	}

	c.logger.Info("Sent deployment notification",
		zap.String("deploymentId", notification.DeploymentID),
		zap.String("type", string(notification.Type)),
	)

	return nil
}

// NotifySuccess sends a success notification
func (c *Client) NotifySuccess(ctx context.Context, deploymentID, projectName, url string, duration int) error {
	return c.SendDeploymentNotification(ctx, DeploymentNotification{
		DeploymentID: deploymentID,
		Type:         NotificationSuccess,
		ProjectName:  projectName,
		URL:          &url,
		Duration:     &duration,
	})
}

// NotifyFailure sends a failure notification
func (c *Client) NotifyFailure(ctx context.Context, deploymentID, projectName, errorMsg string) error {
	return c.SendDeploymentNotification(ctx, DeploymentNotification{
		DeploymentID: deploymentID,
		Type:         NotificationFailed,
		ProjectName:  projectName,
		Error:        &errorMsg,
	})
}