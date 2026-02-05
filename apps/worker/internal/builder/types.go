package builder

import "time"


type Config struct {
	// BuildKit daemon address
	BuildkitAddr string

	// Registry URL
	RegistryURL string

	// Allow insecure (HTTP) registry
	InsecureRegistry bool

	// Default platform (e.g., "linux/amd64", "linux/arm64")
	Platform string

	// Build timeout
	Timeout time.Duration
}

func DefaultConfig() Config {
	return Config{
		BuildkitAddr:     "tcp://localhost:1234",
		RegistryURL:      "localhost:5000",
		InsecureRegistry: true,
		Platform:         "",
		Timeout:          15 * time.Minute,
	}
}

type Options struct {
	// Source code path (cloned repo)
	SourcePath string

	// Output image name
	ImageName string

	// Deployment ID (for logging)
	DeploymentID string

	// Project name (for cache keys)
	ProjectName string

	// Build configuration from job
	BuildConfig BuildConfigOptions

	// Environment variables to bake into image
	EnvVars map[string]string

	// Build-time only env vars
	BuildEnvVars map[string]string
}

type BuildConfigOptions struct {
	InstallCommand string
	BuildCommand   string
	RunCommand     string
	OutputDir      string
	Framework      string
}

type Result struct {
	// Full image name with tag
	ImageName string

	// Image digest (sha256:...)
	Digest string

	// Build duration
	Duration time.Duration

	// Detected framework (if auto-detected)
	Framework string

	// Whether cache was used
	CacheUsed bool
}

type Framework string

const (
	FrameworkNodejs  Framework = "nodejs"
	FrameworkNextjs  Framework = "nextjs"
	FrameworkPython  Framework = "python"
	FrameworkGo      Framework = "go"
	FrameworkStatic  Framework = "static"
	FrameworkUnknown Framework = "unknown"
)