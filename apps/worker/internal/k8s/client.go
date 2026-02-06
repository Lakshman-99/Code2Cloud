package k8s

import (
	"fmt"
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"code2cloud/worker/internal/logging"
)

type Client struct {
	clientset  *kubernetes.Clientset
	namespace  string
	baseDomain string
	logFactory *logging.Factory
	logger     *zap.Logger
}

type Config struct {
	Namespace  string
	BaseDomain string
}

func NewClient(config Config, logFactory *logging.Factory, logger *zap.Logger) (*Client, error) {
	k8sConfig, err := getKubeConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get kubernetes config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(k8sConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	logger.Info("Kubernetes client initialized",
		zap.String("namespace", config.Namespace),
		zap.String("baseDomain", config.BaseDomain),
	)

	return &Client{
		clientset:  clientset,
		namespace:  config.Namespace,
		baseDomain: config.BaseDomain,
		logFactory: logFactory,
		logger:     logger,
	}, nil
}

func getKubeConfig() (*rest.Config, error) {
	config, err := rest.InClusterConfig()
	if err == nil {
		return config, nil
	}

	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("failed to get home directory: %w", err)
		}
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
		return nil, fmt.Errorf("not running in cluster and kubeconfig not found at %s", kubeconfig)
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	return config, nil
}

func (c *Client) Clientset() *kubernetes.Clientset {
	return c.clientset
}

func (c *Client) Namespace() string {
	return c.namespace
}

func int32Ptr(i int32) *int32    { return &i }
func int64Ptr(i int64) *int64    { return &i }
func boolPtr(b bool) *bool       { return &b }
func stringPtr(s string) *string { return &s }