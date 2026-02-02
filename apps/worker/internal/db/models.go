package db

import "time"


type Deployment struct {
	ID               string
	Status           string
	Environment      string
	CommitHash       string
	CommitMessage    *string
	CommitAuthor     *string
	Branch           string
	MachineCPU       float64
	MachineRAM       int
	MachineStorage   int
	MachineOS        string
	ContainerImage   *string
	DeploymentURL    *string
	DeploymentRegion string
	StartedAt        time.Time
	FinishedAt       *time.Time
	Duration         *int
	ProjectID        string
	InitiatorID      *string
}

type Project struct {
	ID              string
	Name            string
	Language        string
	Framework       string
	RootDirectory   string
	InstallCommand  *string
	BuildCommand    *string
	RunCommand      *string
	OutputDirectory *string
	GitRepoOwner    string
	GitRepoName     string
	GitRepoID       int
	GitBranch       string
	GitCloneURL     string
	GitRepoURL      string
	ConfigChanged   bool
	AutoDeploy      bool
	OnlineStatus    string
	UserID          string
}

type Domain struct {
	ID        string
	Name      string
	Status    string
	Type      string
	ProjectID string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type SystemConfig struct {
	ID                  string
	UserID              string
	DefaultRegion       string
	MaxConcurrentBuilds int
	LogRetentionDays    int
	TurboMode           bool
	GlobalTTLMinutes    int
	AutoDeploy          bool
	SlackWebhook        *string
	EmailDeployFailed   bool
	EmailDeploySuccess  bool
	UpdatedAt           time.Time
}

type EnvironmentVariable struct {
	ID        string
	Key       string
	Value     string
	Targets   []string
	ProjectID string
}

type User struct {
	ID       string
	Email    string
	Name     *string
	Provider *string
}