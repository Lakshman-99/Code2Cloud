package k8s

type DeployOptions struct {
	DeploymentID string
	ProjectID    string
	ProjectName  string

	ImageName string
	Port      int32

	CPURequest    string
	CPULimit      string
	MemoryRequest string
	MemoryLimit   string

	Replicas int32

	EnvVars map[string]string

	Domains    []string
	BaseDomain string

	HealthPath string

	Labels map[string]string
}

func DefaultDeployOptions() DeployOptions {
	return DeployOptions{
		Port:          3000,
		CPURequest:    "100m",
		CPULimit:      "500m",
		MemoryRequest: "128Mi",
		MemoryLimit:   "512Mi",
		Replicas:      1,
		HealthPath:    "/health",
	}
}

type DeployResult struct {
	DeploymentName string
	ServiceName    string
	IngressName    string

	// Access URLs
	URLs []string

	// Status
	Ready bool
}

type CleanupOptions struct {
	DeploymentID string
	ProjectName  string
	Namespace    string
}