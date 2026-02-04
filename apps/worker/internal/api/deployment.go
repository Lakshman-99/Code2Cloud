package api

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"code2cloud/worker/internal/types"
)

type DeploymentStatusUpdate struct {
	Status         string  `json:"status"`
	ContainerImage *string `json:"containerImage,omitempty"`
	DeploymentURL  *string `json:"deploymentUrl,omitempty"`
	ErrorMessage   *string `json:"errorMessage,omitempty"`
}

type Deployment struct {
	ID               string  `json:"id"`
	Status           string  `json:"status"`
	Environment      string  `json:"environment"`
	CommitHash       string  `json:"commitHash"`
	CommitMessage    *string `json:"commitMessage"`
	Branch           string  `json:"branch"`
	ContainerImage   *string `json:"containerImage"`
	DeploymentURL    *string `json:"deploymentUrl"`
	DeploymentRegion string  `json:"deploymentRegion"`
	ProjectID        string  `json:"projectId"`
}

func (c *Client) GetDeployment(ctx context.Context, id string) (*Deployment, error) {
	var deployment Deployment
	path := fmt.Sprintf("/deployments/%s", id)

	if err := c.get(ctx, path, &deployment); err != nil {
		return nil, fmt.Errorf("failed to get deployment: %w", err)
	}

	return &deployment, nil
}

// UpdateDeploymentStatus updates the status of a deployment
func (c *Client) UpdateDeploymentStatus(ctx context.Context, id string, status types.DeploymentStatus) error {
	path := fmt.Sprintf("/internal/deployments/%s/status", id)
	body := DeploymentStatusUpdate{
		Status: string(status),
	}

	if err := c.patch(ctx, path, body); err != nil {
		return fmt.Errorf("failed to update deployment status: %w", err)
	}

	c.logger.Debug("Updated deployment status",
		zap.String("deploymentId", id),
		zap.String("status", string(status)),
	)

	return nil
}

// UpdateDeploymentWithImage updates status and sets container image
func (c *Client) UpdateDeploymentWithImage(ctx context.Context, id string, status types.DeploymentStatus, imageName string) error {
	path := fmt.Sprintf("/internal/deployments/%s/status", id)
	body := DeploymentStatusUpdate{
		Status:         string(status),
		ContainerImage: &imageName,
	}

	return c.patch(ctx, path, body)
}

// UpdateDeploymentWithURL updates status and sets deployment URL
func (c *Client) UpdateDeploymentWithURL(ctx context.Context, id string, status types.DeploymentStatus, url string) error {
	path := fmt.Sprintf("/internal/deployments/%s/status", id)
	body := DeploymentStatusUpdate{
		Status:        string(status),
		DeploymentURL: &url,
	}

	return c.patch(ctx, path, body)
}

// FailDeployment marks deployment as failed with error message
func (c *Client) FailDeployment(ctx context.Context, id string, errorMsg string) error {
	path := fmt.Sprintf("/internal/deployments/%s/status", id)
	body := DeploymentStatusUpdate{
		Status:       string(types.StatusFailed),
		ErrorMessage: &errorMsg,
	}

	return c.patch(ctx, path, body)
}

// ExpiredDeployment represents a deployment that has exceeded TTL
type ExpiredDeployment struct {
	ID             string `json:"id"`
	ProjectID      string `json:"projectId"`
	ProjectName    string `json:"projectName"`
	ContainerImage string `json:"containerImage"`
	TTLMinutes     int    `json:"ttlMinutes"`
	ExpiredAt      string `json:"expiredAt"`
}

// GetExpiredDeployments fetches deployments past their TTL
func (c *Client) GetExpiredDeployments(ctx context.Context) ([]ExpiredDeployment, error) {
	var result struct {
		Deployments []ExpiredDeployment `json:"deployments"`
	}

	if err := c.get(ctx, "/internal/deployments/expired", &result); err != nil {
		return nil, fmt.Errorf("failed to get expired deployments: %w", err)
	}

	return result.Deployments, nil
}

// NestJS handles DB cleanup, worker handles K8s cleanup
func (c *Client) CleanupDeployment(ctx context.Context, id string) error {
	path := fmt.Sprintf("/internal/deployments/%s/resources", id)
	return c.delete(ctx, path)
}