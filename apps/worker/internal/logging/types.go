package logging

import "time"

type Source string

const (
	SourceBuild   Source = "BUILD"   // Logs from build process (git, railpack, docker)
	SourceRuntime Source = "RUNTIME" // Logs from running container (stdout/stderr)
	SourceSystem  Source = "SYSTEM"  // Kubernetes/infrastructure events
)

type Config struct {
	// BatchSize is the number of log lines to batch before sending
	// Default: 20
	BatchSize int

	// FlushInterval is how often to flush logs even if batch isn't full
	// Default: 2 seconds
	FlushInterval time.Duration

	// Source is the default log source for this logger
	// Default: SourceBuild
	Source Source

	// Prefix is an optional prefix to add to all log messages
	// Example: "[git] " or "[railpack] "
	Prefix string
}

// DefaultConfig returns sensible default configuration
func DefaultConfig() Config {
	return Config{
		BatchSize:     20,
		FlushInterval: 2 * time.Second,
		Source:        SourceBuild,
		Prefix:        "",
	}
}

// LogSender is the interface for sending logs to the backend
type LogSender interface {
	SendLogs(deploymentID string, source Source, messages []string) error
}