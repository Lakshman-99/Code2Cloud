package logging

import (
	"context"
	"time"
)

// APIAdapter wraps an API client to implement LogSender interface
type APIAdapter struct {
	saveFunc func(ctx context.Context, deploymentID string, source string, messages []string) error
	timeout  time.Duration
}

// NewAPIAdapter creates an adapter from a save function
// This allows us to not depend on the api package directly
func NewAPIAdapter(
	saveFunc func(ctx context.Context, deploymentID string, source string, messages []string) error,
) *APIAdapter {
	return &APIAdapter{
		saveFunc: saveFunc,
		timeout:  10 * time.Second,
	}
}

// SendLogs implements LogSender interface
func (a *APIAdapter) SendLogs(deploymentID string, source Source, messages []string) error {
	ctx, cancel := context.WithTimeout(context.Background(), a.timeout)
	defer cancel()

	return a.saveFunc(ctx, deploymentID, string(source), messages)
}

// ─────────────────────────────────────────────────────────────
// Mock Sender (for testing)
// ─────────────────────────────────────────────────────────────

// MockSender is a LogSender that stores logs in memory (for testing)
type MockSender struct {
	Logs []MockLog
}

// MockLog represents a stored log entry
type MockLog struct {
	DeploymentID string
	Source       Source
	Messages     []string
}

// NewMockSender creates a new mock sender
func NewMockSender() *MockSender {
	return &MockSender{
		Logs: make([]MockLog, 0),
	}
}

// SendLogs stores logs in memory
func (m *MockSender) SendLogs(deploymentID string, source Source, messages []string) error {
	m.Logs = append(m.Logs, MockLog{
		DeploymentID: deploymentID,
		Source:       source,
		Messages:     messages,
	})
	return nil
}

// GetAllMessages returns all logged messages (for assertions)
func (m *MockSender) GetAllMessages() []string {
	var all []string
	for _, log := range m.Logs {
		all = append(all, log.Messages...)
	}
	return all
}

// Clear clears all stored logs
func (m *MockSender) Clear() {
	m.Logs = m.Logs[:0]
}