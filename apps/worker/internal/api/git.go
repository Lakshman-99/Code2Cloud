package api

import (
	"context"
	"fmt"

	"go.uber.org/zap"
)

type InstallationToken struct {
	Token     string `json:"token"`
	ExpiresAt string `json:"expiresAt"`
}

// GetInstallationToken fetches a GitHub App installation token
func (c *Client) GetInstallationToken(ctx context.Context, installationID int) (*InstallationToken, error) {
	path := fmt.Sprintf("/internal/git/installation-token/%d", installationID)

	var token InstallationToken
	if err := c.get(ctx, path, &token); err != nil {
		return nil, fmt.Errorf("failed to get installation token: %w", err)
	}

	c.logger.Debug("Got installation token",
		zap.Int("installationId", installationID),
		zap.String("expiresAt", token.ExpiresAt),
	)

	return &token, nil
}