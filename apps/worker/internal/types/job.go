package types

type BuildConfig struct {
	InstallCommand string `json:"installCommand,omitempty"`
	BuildCommand   string `json:"buildCommand,omitempty"`
	RunCommand     string `json:"runCommand,omitempty"`
	OutputDir      string `json:"outputDir,omitempty"`
	Framework      string `json:"framework"`
}

type BuildJob struct {
	DeploymentID   string `json:"deploymentId"`
	ProjectID      string `json:"projectId"`
	ProjectName    string `json:"projectName"`
	GitURL         string `json:"gitUrl"`
	InstallationID int    `json:"installationId"`
	Branch         string `json:"branch"`
	CommitHash     string `json:"commitHash"`

	// Nested struct
	BuildConfig BuildConfig `json:"buildConfig"`

	// []string = array of strings
	Domains []string `json:"domains"`

	// map[string]string = { [key: string]: string }
	EnvVars map[string]string `json:"envVars"`
}

// ─────────────────────────────────────────────────────────────
// Deployment Status Constants
// ─────────────────────────────────────────────────────────────
type DeploymentStatus string

const (
	StatusQueued    DeploymentStatus = "QUEUED"
	StatusBuilding  DeploymentStatus = "BUILDING"
	StatusDeploying DeploymentStatus = "DEPLOYING"
	StatusReady     DeploymentStatus = "READY"
	StatusFailed    DeploymentStatus = "FAILED"
	StatusCanceled  DeploymentStatus = "CANCELED"
	StatusExpired   DeploymentStatus = "EXPIRED"
)

// ─────────────────────────────────────────────────────────────
// Log Entry Types
// ─────────────────────────────────────────────────────────────
type LogSource string

const (
	LogSourceBuild   LogSource = "BUILD"
	LogSourceRuntime LogSource = "RUNTIME"
	LogSourceSystem  LogSource = "SYSTEM"
)

type LogEntry struct {
	DeploymentID string
	Source       LogSource
	Message      string
}

// ExpiredDeployment represents a deployment that has exceeded its TTL
type ExpiredDeployment struct {
	ID             string `json:"id"`
	ProjectID      string `json:"projectId"`
	ProjectName    string `json:"projectName"`
	ContainerImage string `json:"containerImage"`
	TTLMinutes     int    `json:"ttlMinutes"`
	ExpiredAt      string `json:"expiredAt"`
}