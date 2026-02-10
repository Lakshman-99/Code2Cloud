package k8s

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)


func (c *Client) CreateOrUpdateDeployment(ctx context.Context, opts DeployOptions) error {
	name := sanitizeK8sName(opts.ProjectName)
	serviceAccountName := buildServiceAccountName(name)

	c.logger.Info("Creating/updating deployment",
		zap.String("name", name),
		zap.String("image", opts.ImageName),
		zap.Int32("replicas", opts.Replicas),
	)

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

	envVars := make([]corev1.EnvVar, 0, len(opts.EnvVars)+2)
	for key, value := range opts.EnvVars {
		envVars = append(envVars, corev1.EnvVar{Name: key, Value: value})
	}
	if _, hasPort := opts.EnvVars["PORT"]; !hasPort {
		envVars = append(envVars, corev1.EnvVar{Name: "PORT", Value: fmt.Sprintf("%d", opts.Port)})
	}
	if _, hasNodeEnv := opts.EnvVars["NODE_ENV"]; !hasNodeEnv {
		envVars = append(envVars, corev1.EnvVar{Name: "NODE_ENV", Value: "production"})
	}

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: c.namespace,
			Labels:    labels,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(opts.Replicas),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": name},
			},
			Strategy: appsv1.DeploymentStrategy{
				Type: appsv1.RollingUpdateDeploymentStrategyType,
				RollingUpdate: &appsv1.RollingUpdateDeployment{
					MaxUnavailable: &intstr.IntOrString{Type: intstr.Int, IntVal: 0},
					MaxSurge:       &intstr.IntOrString{Type: intstr.Int, IntVal: 1},
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
					Annotations: map[string]string{
						"code2cloud/updated-at": time.Now().Format(time.RFC3339),
					},
				},
				Spec: corev1.PodSpec{
					TerminationGracePeriodSeconds: int64Ptr(30),
					ServiceAccountName:            serviceAccountName,

					Containers: []corev1.Container{{
						Name:            name,
						Image:           opts.ImageName,
						ImagePullPolicy: corev1.PullAlways,

						Ports: []corev1.ContainerPort{{
							Name:          "http",
							ContainerPort: opts.Port,
							Protocol:      corev1.ProtocolTCP,
						}},

						Env: envVars,

						Resources: corev1.ResourceRequirements{
							Requests: corev1.ResourceList{
								corev1.ResourceCPU:    resource.MustParse(opts.CPURequest),
								corev1.ResourceMemory: resource.MustParse(opts.MemoryRequest),
							},
							Limits: corev1.ResourceList{
								corev1.ResourceCPU:    resource.MustParse(opts.CPULimit),
								corev1.ResourceMemory: resource.MustParse(opts.MemoryLimit),
							},
						},

						LivenessProbe: &corev1.Probe{
							ProbeHandler: corev1.ProbeHandler{
								TCPSocket: &corev1.TCPSocketAction{
									Port: intstr.FromInt32(opts.Port),
								},
							},
							InitialDelaySeconds: 10,
							PeriodSeconds:       30,
							TimeoutSeconds:      5,
							FailureThreshold:    3,
						},

						ReadinessProbe: &corev1.Probe{
							ProbeHandler: corev1.ProbeHandler{
								TCPSocket: &corev1.TCPSocketAction{
									Port: intstr.FromInt32(opts.Port),
								},
							},
							InitialDelaySeconds: 5,
							PeriodSeconds:       10,
							TimeoutSeconds:      3,
							FailureThreshold:    3,
						},
					}},
				},
			},
		},
	}

	deploymentsClient := c.clientset.AppsV1().Deployments(c.namespace)

	existing, err := deploymentsClient.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// Create new deployment
			_, err = deploymentsClient.Create(ctx, deployment, metav1.CreateOptions{})
			if err != nil {
				return fmt.Errorf("failed to create deployment: %w", err)
			}
			c.logger.Info("Deployment created", zap.String("name", name))
			return nil
		}
		return fmt.Errorf("failed to get deployment: %w", err)
	}

	deployment.ResourceVersion = existing.ResourceVersion
	_, err = deploymentsClient.Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update deployment: %w", err)
	}

	c.logger.Info("Deployment updated", zap.String("name", name))
	return nil
}


func (c *Client) DeleteDeployment(ctx context.Context, name string) error {
	name = sanitizeK8sName(name)

	err := c.clientset.AppsV1().Deployments(c.namespace).Delete(ctx, name, metav1.DeleteOptions{
		PropagationPolicy: func() *metav1.DeletionPropagation {
			p := metav1.DeletePropagationForeground
			return &p
		}(),
	})

	if err != nil && !errors.IsNotFound(err) {
		return fmt.Errorf("failed to delete deployment: %w", err)
	}

	c.logger.Info("Deployment deleted", zap.String("name", name))
	return nil
}

// WaitForDeploymentReady waits for a deployment to be ready
func (c *Client) WaitForDeploymentReady(ctx context.Context, name string, timeout time.Duration) error {
	name = sanitizeK8sName(name)

	c.logger.Info("Waiting for deployment to be ready",
		zap.String("name", name),
		zap.Duration("timeout", timeout),
	)

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for deployment %s to be ready", name)
		case <-ticker.C:
			deployment, err := c.clientset.AppsV1().Deployments(c.namespace).Get(ctx, name, metav1.GetOptions{})
			if err != nil {
				c.logger.Warn("Failed to get deployment status", zap.Error(err))
				continue
			}

			// Check if deployment is ready
			if deployment.Status.ReadyReplicas >= *deployment.Spec.Replicas {
				c.logger.Info("Deployment is ready",
					zap.String("name", name),
					zap.Int32("ready", deployment.Status.ReadyReplicas),
				)
				return nil
			}

			c.logger.Debug("Deployment not ready yet",
				zap.String("name", name),
				zap.Int32("ready", deployment.Status.ReadyReplicas),
				zap.Int32("desired", *deployment.Spec.Replicas),
			)
		}
	}
}