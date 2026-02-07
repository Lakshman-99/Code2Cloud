package k8s

import (
	"context"
	"fmt"

	"go.uber.org/zap"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (c *Client) CreateOrUpdateIngress(ctx context.Context, opts DeployOptions) ([]string, error) {
	name := sanitizeK8sName(opts.ProjectName)

	hosts := make([]string, 0, len(opts.Domains)+1)

	defaultHost := sanitizeHost(fmt.Sprintf("%s.%s", name, c.baseDomain))
	hosts = append(hosts, defaultHost)

	for _, domain := range opts.Domains {
		if domain != "" && domain != defaultHost {
			hosts = append(hosts, domain)
		}
	}

	c.logger.Info("Creating/updating ingress",
		zap.String("name", name),
		zap.Strings("hosts", hosts),
	)

	labels := map[string]string{
		"app":                          name,
		"app.kubernetes.io/name":       name,
		"app.kubernetes.io/managed-by": "code2cloud",
		"code2cloud/project-id":        opts.ProjectID,
	}

	rules := make([]networkingv1.IngressRule, 0, len(hosts))
	pathType := networkingv1.PathTypePrefix

	for _, host := range hosts {
		rules = append(rules, networkingv1.IngressRule{
			Host: host,
			IngressRuleValue: networkingv1.IngressRuleValue{
				HTTP: &networkingv1.HTTPIngressRuleValue{
					Paths: []networkingv1.HTTPIngressPath{{
						Path:     "/",
						PathType: &pathType,
						Backend: networkingv1.IngressBackend{
							Service: &networkingv1.IngressServiceBackend{
								Name: name,
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

	tls := []networkingv1.IngressTLS{{
		Hosts:      hosts,
		SecretName: fmt.Sprintf("%s-tls", name),
	}}

	ingressClassName := "traefik"

	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: c.namespace,
			Labels:    labels,
			Annotations: map[string]string{
				"traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
				"traefik.ingress.kubernetes.io/router.tls":         "true",

				"cert-manager.io/cluster-issuer": "letsencrypt-prod",
			},
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
				zap.Strings("hosts", hosts),
			)
			return hosts, nil
		}
		return nil, fmt.Errorf("failed to get ingress: %w", err)
	}

	// Must set ResourceVersion for update (K8s optimistic locking)
	ingress.ResourceVersion = existing.ResourceVersion
	_, err = ingressClient.Update(ctx, ingress, metav1.UpdateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to update ingress: %w", err)
	}

	c.logger.Info("Ingress updated",
		zap.String("name", name),
		zap.Strings("hosts", hosts),
	)
	return hosts, nil
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

	pathType := networkingv1.PathTypePrefix
	rules := make([]networkingv1.IngressRule, 0, len(hosts))

	for _, host := range hosts {
		cleanHost := sanitizeHost(host)
		
		rules = append(rules, networkingv1.IngressRule{
			Host: cleanHost,
			IngressRuleValue: networkingv1.IngressRuleValue{
				HTTP: &networkingv1.HTTPIngressRuleValue{
					Paths: []networkingv1.HTTPIngressPath{{
						Path:     "/",
						PathType: &pathType,
						Backend: networkingv1.IngressBackend{
							Service: &networkingv1.IngressServiceBackend{
								Name: name,
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

	if len(ingress.Spec.TLS) > 0 {
		ingress.Spec.TLS[0].Hosts = hosts
	}

	ingress.Spec.Rules = rules

	_, err = ingressClient.Update(ctx, ingress, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update ingress: %w", err)
	}

	c.logger.Info("Ingress hosts updated",
		zap.String("name", name),
		zap.Strings("hosts", hosts),
	)
	return nil
}