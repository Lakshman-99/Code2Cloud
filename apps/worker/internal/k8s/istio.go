package k8s

import (
	"context"
	"fmt"
	"strings"

	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ---------------------------------------------------------------------------
// Service Accounts (one per user app for least-privilege)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Network Policies (L3/L4 tenant isolation)
// ---------------------------------------------------------------------------
// Each user app gets a NetworkPolicy that only allows ingress from:
//   1. Pods with the same "app" label (replicas of the same deployment)
//   2. Any pod in the "traefik" namespace  (ingress controller)
// Combined with the namespace-level default-deny-ingress NetworkPolicy,
// this guarantees that app-A pods can never reach app-B pods.
// ---------------------------------------------------------------------------

func (c *Client) CreateOrUpdateNetworkPolicy(ctx context.Context, opts DeployOptions) error {
	name := sanitizeK8sName(opts.ProjectName)
	policyName := buildPolicyName(name)

	labels := map[string]string{
		"app":                          name,
		"app.kubernetes.io/managed-by": "code2cloud",
		"code2cloud/deployment-id":     opts.DeploymentID,
		"code2cloud/project-id":        opts.ProjectID,
	}

	policy := &networkingv1.NetworkPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Name:      policyName,
			Namespace: c.namespace,
			Labels:    labels,
		},
		Spec: networkingv1.NetworkPolicySpec{
			// Target only this app's pods
			PodSelector: metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": name,
				},
			},
			PolicyTypes: []networkingv1.PolicyType{
				networkingv1.PolicyTypeIngress,
			},
			Ingress: []networkingv1.NetworkPolicyIngressRule{
				{
					// Rule 1: allow from same-app pods (replicas)
					From: []networkingv1.NetworkPolicyPeer{
						{
							PodSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									"app": name,
								},
							},
						},
					},
				},
				{
					// Rule 2: allow from Traefik namespace (ingress controller)
					From: []networkingv1.NetworkPolicyPeer{
						{
							NamespaceSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									"app.kubernetes.io/name": "traefik",
								},
							},
						},
					},
				},
			},
		},
	}

	policyClient := c.clientset.NetworkingV1().NetworkPolicies(c.namespace)
	existing, err := policyClient.Get(ctx, policyName, metav1.GetOptions{})
	if err != nil {
		if apierrors.IsNotFound(err) {
			_, err = policyClient.Create(ctx, policy, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("failed to create network policy: %w", err)
			}
			return nil
		}
		return fmt.Errorf("failed to get network policy: %w", err)
	}

	policy.ResourceVersion = existing.ResourceVersion
	_, err = policyClient.Update(ctx, policy, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update network policy: %w", err)
	}

	return nil
}

func (c *Client) DeleteNetworkPolicy(ctx context.Context, appName string) error {
	policyName := buildPolicyName(sanitizeK8sName(appName))
	policyClient := c.clientset.NetworkingV1().NetworkPolicies(c.namespace)
	if err := policyClient.Delete(ctx, policyName, metav1.DeleteOptions{}); err != nil {
		if apierrors.IsNotFound(err) {
			return nil
		}
		return fmt.Errorf("failed to delete network policy: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func buildServiceAccountName(appName string) string {
	return buildNameWithSuffix(appName, "-sa")
}

func buildPolicyName(appName string) string {
	return buildNameWithSuffix(appName, "-netpol")
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
