package k8s

import (
	"context"
	"fmt"
	"strings"

	"go.uber.org/zap"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const wildcardTLSSecret = "preview-wildcard-tls"

func (c *Client) CreateOrUpdateIngress(ctx context.Context, opts DeployOptions) ([]string, error) {
	name := sanitizeK8sName(opts.ProjectName)

	var subdomainHosts []string
	var customHosts []string
	allHosts := make([]string, 0, len(opts.Domains))

	for _, domain := range opts.Domains {
		if domain == "" {
			continue
		}
		host := sanitizeHost(domain)
		allHosts = append(allHosts, host)

		if isSubdomain(host, c.baseDomain) {
			subdomainHosts = append(subdomainHosts, host)
		} else {
			customHosts = append(customHosts, host)
		}
	}

	c.logger.Info("Creating/updating ingress",
		zap.String("name", name),
		zap.Strings("subdomain_hosts", subdomainHosts),
		zap.Strings("custom_hosts", customHosts),
	)

	labels := map[string]string{
		"app":                          name,
		"app.kubernetes.io/name":       name,
		"app.kubernetes.io/managed-by": "code2cloud",
		"code2cloud/project-id":        opts.ProjectID,
	}

	rules := buildIngressRules(allHosts, name)
	tls := buildTLSEntries(name, subdomainHosts, customHosts)

	// Only add cert-manager annotation when custom domains need certs.
	// Subdomain hosts use the pre-existing wildcard — no issuing needed.
	annotations := map[string]string{
		"traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
		"traefik.ingress.kubernetes.io/router.tls":         "true",
	}
	if len(customHosts) > 0 {
		annotations["cert-manager.io/cluster-issuer"] = "letsencrypt-prod"
	}

	ingressClassName := "traefik"

	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:        name,
			Namespace:   c.namespace,
			Labels:      labels,
			Annotations: annotations,
		},
		Spec: networkingv1.IngressSpec{
			IngressClassName: &ingressClassName,
			TLS:              tls,
			Rules:            rules,
		},
	}

	ingressClient := c.clientset.NetworkingV1().Ingresses(c.namespace)

	existing, err := ingressClient.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			_, err = ingressClient.Create(ctx, ingress, metav1.CreateOptions{})
			if err != nil {
				return nil, fmt.Errorf("failed to create ingress: %w", err)
			}
			c.logger.Info("Ingress created",
				zap.String("name", name),
				zap.Strings("hosts", allHosts),
			)
			return allHosts, nil
		}
		return nil, fmt.Errorf("failed to get ingress: %w", err)
	}

	ingress.ResourceVersion = existing.ResourceVersion
	_, err = ingressClient.Update(ctx, ingress, metav1.UpdateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingress: %w", err)
	}

	c.logger.Info("Ingress updated",
		zap.String("name", name),
		zap.Strings("hosts", allHosts),
	)
	return allHosts, nil
}

func (c *Client) DeleteIngress(ctx context.Context, name string) error {
	name = sanitizeK8sName(name)

	err := c.clientset.NetworkingV1().Ingresses(c.namespace).Delete(ctx, name, metav1.DeleteOptions{})

	if err != nil && !errors.IsNotFound(err) {
		return fmt.Errorf("failed to delete ingress: %w", err)
	}

	c.logger.Info("Ingress deleted", zap.String("name", name))
	return nil
}

func (c *Client) UpdateIngressHosts(ctx context.Context, name string, hosts []string) error {
	name = sanitizeK8sName(name)

	c.logger.Info("Updating ingress hosts",
		zap.String("name", name),
		zap.Strings("hosts", hosts),
	)

	ingressClient := c.clientset.NetworkingV1().Ingresses(c.namespace)

	ingress, err := ingressClient.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get ingress: %w", err)
	}

	// Re-classify hosts
	var subdomainHosts []string
	var customHosts []string
	for _, host := range hosts {
		h := sanitizeHost(host)
		if isSubdomain(h, c.baseDomain) {
			subdomainHosts = append(subdomainHosts, h)
		} else {
			customHosts = append(customHosts, h)
		}
	}

	ingress.Spec.Rules = buildIngressRules(hosts, name)
	ingress.Spec.TLS = buildTLSEntries(name, subdomainHosts, customHosts)

	if ingress.Annotations == nil {
		ingress.Annotations = make(map[string]string)
	}
	if len(customHosts) > 0 {
		ingress.Annotations["cert-manager.io/cluster-issuer"] = "letsencrypt-prod"
	} else {
		delete(ingress.Annotations, "cert-manager.io/cluster-issuer")
	}

	_, err = ingressClient.Update(ctx, ingress, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update ingress: %w", err)
	}

	c.logger.Info("Ingress hosts updated",
		zap.String("name", name),
		zap.Strings("subdomain_hosts", subdomainHosts),
		zap.Strings("custom_hosts", customHosts),
	)
	return nil
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// isSubdomain checks if host is under the platform's base domain.
// c.baseDomain = "preview.code2cloud.lakshman.me"
//
// "my-app.preview.code2cloud.lakshman.me" → true  (wildcard cert)
// "app.example.com"                       → false (needs own cert)
func isSubdomain(host, baseDomain string) bool {
	if baseDomain == "" {
		return false
	}
	return strings.HasSuffix(
		strings.ToLower(host),
		"."+strings.ToLower(baseDomain),
	) || strings.EqualFold(host, baseDomain)
}

// buildIngressRules creates rules for all hosts pointing to the service.
func buildIngressRules(hosts []string, serviceName string) []networkingv1.IngressRule {
	pathType := networkingv1.PathTypePrefix
	rules := make([]networkingv1.IngressRule, 0, len(hosts))

	for _, host := range hosts {
		rules = append(rules, networkingv1.IngressRule{
			Host: sanitizeHost(host),
			IngressRuleValue: networkingv1.IngressRuleValue{
				HTTP: &networkingv1.HTTPIngressRuleValue{
					Paths: []networkingv1.HTTPIngressPath{{
						Path:     "/",
						PathType: &pathType,
						Backend: networkingv1.IngressBackend{
							Service: &networkingv1.IngressServiceBackend{
								Name: serviceName,
								Port: networkingv1.ServiceBackendPort{
									Number: 80,
								},
							},
						},
					}},
				},
			},
		})
	}

	return rules
}

func buildTLSEntries(name string, subdomainHosts, customHosts []string) []networkingv1.IngressTLS {
	var tls []networkingv1.IngressTLS

	if len(subdomainHosts) > 0 {
		tls = append(tls, networkingv1.IngressTLS{
			Hosts:      subdomainHosts,
			SecretName: wildcardTLSSecret,
		})
	}

	if len(customHosts) > 0 {
		tls = append(tls, networkingv1.IngressTLS{
			Hosts:      customHosts,
			SecretName: fmt.Sprintf("%s-custom-tls", name),
		})
	}

	return tls
}