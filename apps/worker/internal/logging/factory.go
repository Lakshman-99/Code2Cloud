package logging

import (
	"context"
	"io"

	"go.uber.org/zap"
)

// Factory creates StreamLoggers with shared configuration
type Factory struct {
	sender    LogSender
	zapLogger *zap.Logger
}

// NewFactory creates a new logger factory
func NewFactory(sender LogSender, zapLogger *zap.Logger) *Factory {
	return &Factory{
		sender:    sender,
		zapLogger: zapLogger,
	}
}

// NewFactoryFromAPI creates a factory using an API save function
func NewFactoryFromAPI(
	saveFunc func(ctx context.Context, deploymentID string, source string, messages []string) error,
	zapLogger *zap.Logger,
) *Factory {
	adapter := NewAPIAdapter(saveFunc)
	return NewFactory(adapter, zapLogger)
}

// CreateLogger creates a StreamLogger with default config
func (f *Factory) CreateLogger(deploymentID string) *StreamLogger {
	return NewStreamLogger(deploymentID, f.sender, f.zapLogger, DefaultConfig())
}

// CreateBuildLogger creates a logger configured for build output
func (f *Factory) CreateBuildLogger(deploymentID string) *StreamLogger {
	config := DefaultConfig()
	config.Source = SourceBuild
	return NewStreamLogger(deploymentID, f.sender, f.zapLogger, config)
}

// CreateRuntimeLogger creates a logger configured for runtime output
func (f *Factory) CreateRuntimeLogger(deploymentID string) *StreamLogger {
	config := DefaultConfig()
	config.Source = SourceRuntime
	config.BatchSize = 50           // Larger batches for runtime
	config.FlushInterval = 1 * 1e9  // 1 second flush
	return NewStreamLogger(deploymentID, f.sender, f.zapLogger, config)
}

// CreateSystemLogger creates a logger configured for system events
func (f *Factory) CreateSystemLogger(deploymentID string) *StreamLogger {
	config := DefaultConfig()
	config.Source = SourceSystem
	config.BatchSize = 10  // Smaller batches for important events
	return NewStreamLogger(deploymentID, f.sender, f.zapLogger, config)
}

// CreatePrefixedLogger creates a logger with a prefix
func (f *Factory) CreatePrefixedLogger(deploymentID string, prefix string, source Source) *StreamLogger {
	config := DefaultConfig()
	config.Source = source
	config.Prefix = prefix
	return NewStreamLogger(deploymentID, f.sender, f.zapLogger, config)
}

// Useful for writing to both StreamLogger and console
type MultiWriter struct {
	writers []io.Writer
}

// NewMultiWriter creates a writer that duplicates output to all writers
func NewMultiWriter(writers ...io.Writer) *MultiWriter {
	return &MultiWriter{writers: writers}
}

// Write implements io.Writer
func (mw *MultiWriter) Write(p []byte) (int, error) {
	for _, w := range mw.writers {
		n, err := w.Write(p)
		if err != nil {
			return n, err
		}
	}
	return len(p), nil
}

// PrefixWriter wraps an io.Writer and adds a prefix to each line
type PrefixWriter struct {
	writer io.Writer
	prefix string
}

// NewPrefixWriter creates a writer that prefixes all lines
func NewPrefixWriter(w io.Writer, prefix string) *PrefixWriter {
	return &PrefixWriter{writer: w, prefix: prefix}
}

// Write implements io.Writer
func (pw *PrefixWriter) Write(p []byte) (int, error) {
	return pw.writer.Write(p)
}