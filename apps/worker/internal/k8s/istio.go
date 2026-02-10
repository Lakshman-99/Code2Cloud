package k8s

import (
	"context"
	"fmt"
	"strings"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

var authorizationPolicyGVR = schema.GroupVersionResource{
	Group:    "security.istio.io",
	Version:  "v1beta1",
	Resource: "authorizationpolicies",
}

func (c *Client) CreateOrUpdateServiceAccount(ctx context.Context, opts DeployOptions) error {
	name := sanitizeK8sName(opts.ProjectName)
	serviceAccountName := buildServiceAccountName(name)

	labels := map[string]string{
		"app":                          name,
		"app.kubernetes.io/name":       name,
		"app.kubernetes.io/managed-by": "code2cloud",
		"code2cloud/deployment-id":     opts.DeploymentID,
		"code2cloud/project-id":        opts.ProjectID,
	}
	for k, v := range opts.Labels {
		labels[k] = v
	}

	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      serviceAccountName,
			Namespace: c.namespace,
			Labels:    labels,
		},
	}

	serviceAccounts := c.clientset.CoreV1().ServiceAccounts(c.namespace)
	existing, err := serviceAccounts.Get(ctx, serviceAccountName, metav1.GetOptions{})
	if err != nil {
		if apierrors.IsNotFound(err) {
			_, err = serviceAccounts.Create(ctx, serviceAccount, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("failed to create service account: %w", err)
			}
			return nil
		}
		return fmt.Errorf("failed to get service account: %w", err)
	}

	serviceAccount.ResourceVersion = existing.ResourceVersion
	_, err = serviceAccounts.Update(ctx, serviceAccount, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update service account: %w", err)
	}

	return nil
}

func (c *Client) DeleteServiceAccount(ctx context.Context, appName string) error {
	serviceAccountName := buildServiceAccountName(sanitizeK8sName(appName))
	serviceAccounts := c.clientset.CoreV1().ServiceAccounts(c.namespace)
	if err := serviceAccounts.Delete(ctx, serviceAccountName, metav1.DeleteOptions{}); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return fmt.Errorf("failed to delete service account: %w", err)
	}
	return nil
}

func (c *Client) CreateOrUpdateAuthorizationPolicy(ctx context.Context, opts DeployOptions) error {
	name := sanitizeK8sName(opts.ProjectName)
	policyName := buildPolicyName(name)
	serviceAccountName := buildServiceAccountName(name)

	policy := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "security.istio.io/v1beta1",
		"kind":       "AuthorizationPolicy",
		"metadata": map[string]interface{}{
			"name":      policyName,
			"namespace": c.namespace,
			"labels": map[string]interface{}{
				"app":                      name,
				"code2cloud/deployment-id": opts.DeploymentID,
				"code2cloud/project-id":    opts.ProjectID,
			},
		},
		"spec": map[string]interface{}{
			"selector": map[string]interface{}{
				"matchLabels": map[string]interface{}{
					"app": name,
				},
			},
			"action": "ALLOW",
			"rules": []interface{}{
				map[string]interface{}{
					"from": []interface{}{
						map[string]interface{}{
							"source": map[string]interface{}{
								"principals": []interface{}{
									fmt.Sprintf("cluster.local/ns/%s/sa/%s", c.namespace, serviceAccountName),
								},
							},
						},
						map[string]interface{}{
							"source": map[string]interface{}{
								"namespaces": []interface{}{
									"traefik",
								},
							},
						},
					},
				},
			},
		},
	}}

	policyClient := c.dynamicClient.Resource(authorizationPolicyGVR).Namespace(c.namespace)
	existing, err := policyClient.Get(ctx, policyName, metav1.GetOptions{})
	if err != nil {
		if apierrors.IsNotFound(err) {
			_, err = policyClient.Create(ctx, policy, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("failed to create authorization policy: %w", err)
			}
			return nil
		}
		return fmt.Errorf("failed to get authorization policy: %w", err)
	}

	policy.SetResourceVersion(existing.GetResourceVersion())
	_, err = policyClient.Update(ctx, policy, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update authorization policy: %w", err)
	}

	return nil
}

func (c *Client) DeleteAuthorizationPolicy(ctx context.Context, appName string) error {
	policyName := buildPolicyName(sanitizeK8sName(appName))
	policyClient := c.dynamicClient.Resource(authorizationPolicyGVR).Namespace(c.namespace)
	if err := policyClient.Delete(ctx, policyName, metav1.DeleteOptions{}); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return fmt.Errorf("failed to delete authorization policy: %w", err)
	}
	return nil
}

func buildServiceAccountName(appName string) string {
	return buildNameWithSuffix(appName, "-sa")
}

func buildPolicyName(appName string) string {
	return buildNameWithSuffix(appName, "-allow")
}

func buildNameWithSuffix(base string, suffix string) string {
	if base == "" {
		base = "app"
	}
	maxLen := 63
	if len(base)+len(suffix) <= maxLen {
		return strings.TrimSuffix(base, "-") + suffix
	}
	trimLen := maxLen - len(suffix)
	if trimLen < 1 {
		return suffix[len(suffix)-maxLen:]
	}
	trimmed := strings.TrimSuffix(base[:trimLen], "-")
	if trimmed == "" {
		trimmed = "app"
	}
	return trimmed + suffix
}
