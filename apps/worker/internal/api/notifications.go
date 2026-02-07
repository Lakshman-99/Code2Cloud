package api

import (
	"context"

	"go.uber.org/zap"
)

type DeploymentNotification struct {
	DeploymentID  string  `json:"deploymentId"`
	Status        string  `json:"status"`
	ProjectName   string  `json:"projectName"`
	DeploymentURL *string `json:"deploymentUrl,omitempty"`
	Message       *string `json:"message,omitempty"`
}

func (c *Client) SendDeploymentNotification(ctx context.Context, notification DeploymentNotification) error {
	path := "/internal/notifications/deployment"

	if err := c.post(ctx, path, notification, nil); err != nil {
		// Log but don't fail deployment for notification errors
		c.logger.Warn("Failed to send notification",
			zap.String("deploymentId", notification.DeploymentID),
			zap.String("status", notification.Status),
			zap.Error(err),
		)
		return nil // Don't propagate error
	}

	c.logger.Info("Sent deployment notification",
		zap.String("deploymentId", notification.DeploymentID),
		zap.String("status", notification.Status),
	)

	return nil
}

// NotifySuccess sends a success notification
func (c *Client) NotifySuccess(ctx context.Context, deploymentID, projectName, url string, duration int) error {
	return c.SendDeploymentNotification(ctx, DeploymentNotification{
		DeploymentID:  deploymentID,
		Status:        "READY",
		ProjectName:   projectName,
		DeploymentURL: &url,
	})
}

// NotifyFailure sends a failure notification
func (c *Client) NotifyFailure(ctx context.Context, deploymentID, projectName, errorMsg string) error {
	return c.SendDeploymentNotification(ctx, DeploymentNotification{
		DeploymentID: deploymentID,
		Status:       "FAILED",
		ProjectName:  projectName,
		Message:      &errorMsg,
	})
}