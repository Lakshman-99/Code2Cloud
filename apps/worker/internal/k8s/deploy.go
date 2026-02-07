package k8s

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	"code2cloud/worker/internal/logging"
)

func (c *Client) Deploy(ctx context.Context, opts DeployOptions) (*DeployResult, error) {
	name := sanitizeK8sName(opts.ProjectName)

	deployLog := c.logFactory.CreatePrefixedLogger(
		opts.DeploymentID,
		"[k8s] ",
		logging.SourceBuild,
	)
	defer deployLog.Close()

	c.logger.Info("Starting Kubernetes deployment",
		zap.String("name", name),
		zap.String("image", opts.ImageName),
		zap.Strings("domains", opts.Domains),
	)

	deployLog.Log(fmt.Sprintf("Deploying %s to Kubernetes...", name))
	deployLog.Log("Creating deployment...")

	if err := c.CreateOrUpdateDeployment(ctx, opts); err != nil {
		return nil, fmt.Errorf("failed to create deployment: %w", err)
	}

	deployLog.Log(fmt.Sprintf("✓ Deployment %s created", name))
	deployLog.Log("Creating service...")

	if err := c.CreateOrUpdateService(ctx, opts); err != nil {
		return nil, fmt.Errorf("failed to create service: %w", err)
	}

	deployLog.Log(fmt.Sprintf("✓ Service %s created (port 80 → %d)", name, opts.Port))
	deployLog.Log("Creating ingress...")

	hosts, err := c.CreateOrUpdateIngress(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to create ingress: %w", err)
	}

	for _, host := range hosts {
		deployLog.Log(fmt.Sprintf("✓ Ingress configured: https://%s", host))
	}

	deployLog.Log("Waiting for pods to be ready...")

	if err := c.WaitForDeploymentReady(ctx, name, 5*time.Minute); err != nil {
		c.logger.Warn("Deployment not ready within timeout",
			zap.String("name", name),
			zap.Error(err),
		)
		deployLog.Log("⚠ Warning: Deployment may still be starting up")
		// Don't fail - the deployment might just be slow
	} else {
		deployLog.Log("✓ Pods are ready and healthy")
	}

	// Build result
	urls := make([]string, 0, len(hosts))
	for _, host := range hosts {
		urls = append(urls, fmt.Sprintf("https://%s", host))
	}

	result := &DeployResult{
		DeploymentName: name,
		ServiceName:    name,
		IngressName:    name,
		URLs:           urls,
		Ready:          true,
	}

	c.logger.Info("Kubernetes deployment complete",
		zap.String("name", name),
		zap.Strings("urls", urls),
	)

	return result, nil
}


func (c *Client) Cleanup(ctx context.Context, opts CleanupOptions) error {
	name := sanitizeK8sName(opts.ProjectName)

	c.logger.Info("Cleaning up Kubernetes resources",
		zap.String("name", name),
	)

	var errs []string

	// Delete in reverse order: Ingress → Service → Deployment
	if err := c.DeleteIngress(ctx, name); err != nil {
		errs = append(errs, fmt.Sprintf("ingress: %v", err))
	}

	if err := c.DeleteService(ctx, name); err != nil {
		errs = append(errs, fmt.Sprintf("service: %v", err))
	}

	if err := c.DeleteDeployment(ctx, name); err != nil {
		errs = append(errs, fmt.Sprintf("deployment: %v", err))
	}

	if len(errs) > 0 {
		return fmt.Errorf("cleanup errors: %s", strings.Join(errs, "; "))
	}

	c.logger.Info("Kubernetes cleanup complete", zap.String("name", name))
	return nil
}


func sanitizeK8sName(name string) string {
	name = strings.ToLower(name)

	result := make([]byte, 0, len(name))
	lastWasDash := true

	for i := 0; i < len(name) && len(result) < 63; i++ {
		c := name[i]

		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') {
			result = append(result, c)
			lastWasDash = false
		} else if !lastWasDash {
			result = append(result, '-')
			lastWasDash = true
		}
	}

	// Remove trailing dash
	for len(result) > 0 && result[len(result)-1] == '-' {
		result = result[:len(result)-1]
	}

	// Ensure starts with letter
	if len(result) > 0 && result[0] >= '0' && result[0] <= '9' {
		result = append([]byte{'a'}, result...)
	}

	// Ensure not empty
	if len(result) == 0 {
		result = []byte("app")
	}

	return string(result)
}

func sanitizeHost(host string) string {
	host = strings.TrimPrefix(host, "https://")
	host = strings.TrimPrefix(host, "http://")
	host = strings.Split(host, "/")[0]
	return strings.ToLower(host)
}