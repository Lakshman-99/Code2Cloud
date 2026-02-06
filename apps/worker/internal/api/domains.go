package api

import (
	"context"
	"fmt"

	"code2cloud/worker/internal/k8s"
)

func (c *Client) GetPendingDomains(ctx context.Context) ([]k8s.PendingDomain, error) {
	var domains []k8s.PendingDomain

	err := c.get(ctx, "/internal/domains/pending", &domains)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending domains: %w", err)
	}

	return domains, nil
}

func (c *Client) UpdateDomainStatus(ctx context.Context, domainID string, status string, errorMsg string) error {
	body := map[string]string{
		"status": status,
		"error":  errorMsg,
	}

	return c.patch(ctx, fmt.Sprintf("/internal/domains/%s/status", domainID), body)
}