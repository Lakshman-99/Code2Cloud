// Matches Prisma schema and CreateProjectDto
export enum DeploymentStatus {
  QUEUED = 'QUEUED',
  BUILDING = 'BUILDING',
  DEPLOYING = 'DEPLOYING',
  READY = 'READY',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum DomainDnsStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  VERIFYING = 'VERIFYING',
}

export enum EnvironmentType {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  PREVIEW = 'PREVIEW',
}

export enum LogSource {
  BUILD = 'BUILD',
  RUNTIME = 'RUNTIME',
  SYSTEM = 'SYSTEM',
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  targets: EnvironmentType[];
}

export interface Domain {
  id: string;
  name: string;
  status: DomainDnsStatus;
  type: EnvironmentType
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
  }[];
}

export interface LogEntry {
  id: string;
  deploymentId: string;
  source: LogSource;
  timestamp: string;
  message: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  environment: EnvironmentType;

  machineCpu: number;
  machineRam: number; 
  machineStorage: number;
  machineOS: string;

  logs?: LogEntry[];
  deploymentRegion: string;

  startedAt: string;
  finishedAt?: string;
  duration?: number; // in seconds

  branch: string;
  commitHash: string;
  commitMessage?: string;
  commitAuthor?: string;

  deploymentUrl: string;
}

export interface Project {
  id: string;
  name: string;
  framework: string;
  language: string;
  rootDirectory: string;
  installCommand?: string;
  buildCommand?: string;
  runCommand?: string;
  outputDirectory?: string;
  pythonVersion?: string;
  autoDeploy: boolean;
  configChanged: boolean;
  onlineStatus: DomainDnsStatus;

  // Git Info
  gitRepoName: string;
  gitRepoOwner: string;
  gitBranch: string;
  gitRepoId: number;
  gitRepoUrl: string;
  gitCloneUrl: string;

  // Deployments
  deployments: Deployment[];

  // Environment Variables
  envVars?: EnvVar[];

  // Domains
  domains?: Domain[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Add this to your existing file
export interface CreateProjectPayload {
  name: string;
  framework: string;
  rootDirectory: string;
  
  // Build Settings
  installCommand?: string;
  buildCommand?: string;
  runCommand?: string;
  outputDirectory?: string;
  pythonVersion?: string;
  
  // Git Source
  gitRepoOwner: string;
  gitRepoName: string;
  gitBranch: string;
  gitRepoUrl: string;
  gitCloneUrl: string;
  
  // Env Vars
  envVars?: Partial<EnvVar>[];
}

export type UpdateProjectPayload = Partial<Project>;