package k8s

import (
	"context"
	"fmt"

	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)


func (c *Client) CreateOrUpdateService(ctx context.Context, opts DeployOptions) error {
	name := sanitizeK8sName(opts.ProjectName)

	c.logger.Info("Creating/updating service",
		zap.String("name", name),
		zap.Int32("port", opts.Port),
	)

	labels := map[string]string{
		"app":                          name,
		"app.kubernetes.io/name":       name,
		"app.kubernetes.io/managed-by": "code2cloud",
		"code2cloud/project-id":        opts.ProjectID,
	}

	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: c.namespace,
			Labels:    labels,
		},
		Spec: corev1.ServiceSpec{
			Type: corev1.ServiceTypeClusterIP,

			Selector: map[string]string{
				"app": name,
			},

			Ports: []corev1.ServicePort{{
				Name:       "http",
				Protocol:   corev1.ProtocolTCP,
				Port:       80,
				TargetPort: intstr.FromInt32(opts.Port),
			}},
		},
	}

	servicesClient := c.clientset.CoreV1().Services(c.namespace)

	existing, err := servicesClient.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// Create new service
			_, err = servicesClient.Create(ctx, service, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("failed to create service: %w", err)
			}
			c.logger.Info("Service created", zap.String("name", name))
			return nil
		}
		return fmt.Errorf("failed to get service: %w", err)
	}

	// Note: ClusterIP is immutable, so we preserve it
	service.Spec.ClusterIP = existing.Spec.ClusterIP
	service.ResourceVersion = existing.ResourceVersion

	_, err = servicesClient.Update(ctx, service, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update service: %w", err)
	}

	c.logger.Info("Service updated", zap.String("name", name))
	return nil
}


func (c *Client) DeleteService(ctx context.Context, name string) error {
	name = sanitizeK8sName(name)

	err := c.clientset.CoreV1().Services(c.namespace).Delete(ctx, name, metav1.DeleteOptions{})

	if err != nil && !errors.IsNotFound(err) {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	c.logger.Info("Service deleted", zap.String("name", name))
	return nil
}

func (c *Client) GetServiceClusterIP(ctx context.Context, name string) (string, error) {
	name = sanitizeK8sName(name)

	service, err := c.clientset.CoreV1().Services(c.namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to get service: %w", err)
	}

	return service.Spec.ClusterIP, nil
}