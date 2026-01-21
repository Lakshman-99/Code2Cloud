package types

// Domain represents a URL that this deployment will serve.
type Domain struct {
	Name      string `json:"name"`      // e.g., "api.code2cloud.app"
	IsPrimary bool   `json:"isPrimary"` // Is this the main domain?
}

// BuildConfig holds framework-specific settings
type BuildConfig struct {
	InstallCommand string `json:"installCommand,omitempty"`
	BuildCommand   string `json:"buildCommand,omitempty"`
	OutputDir      string `json:"outputDir,omitempty"`
	Framework      string `json:"framework"` // e.g., "nextjs", "python"
}

// MachineConfig defines the hardware for the build pod
type MachineConfig struct {
	CPU    float64 `json:"cpu"`    // e.g., 0.5 or 1.0
	Memory int     `json:"memory"` // in MB, e.g., 512 or 1024
}

// BuildJobData is the payload received from Redis
type BuildJobData struct {
	DeploymentID   string            `json:"deploymentId"`
	ProjectID      string            `json:"projectId"`
	ProjectName    string            `json:"projectName"`
	UserID         string            `json:"userId"` // [ADDED] Important for limits/metrics
	
	// Git Source
	GitURL         string            `json:"gitUrl"`
	InstallationID int64             `json:"installationId"`
	Branch         string            `json:"branch"`
	CommitHash     string            `json:"commitHash"`
	CommitMessage  string            `json:"commitMessage,omitempty"` // [ADDED] Nice for logs
	
	// Configuration
	BuildConfig    BuildConfig       `json:"buildConfig"`
	MachineConfig  MachineConfig     `json:"machineConfig"`
	
	// Routing
	Domains        []Domain          `json:"domains"`
	
	// Environment
	// Note: If these are encrypted, the Worker needs the SECRET_KEY to decrypt them!
	EnvVars        map[string]string `json:"envVars"`
}