export const BUILD_QUEUE_NAME = 'build-queue';
export const PROJECT_CLEANUP_QUEUE = 'project-cleanup-queue';
export const CANCEL_KEY_PREFIX = 'cancel:';

// This is the payload your Go worker will expect
export interface BuildJobData {
  deploymentId: string;
  projectId: string;
  projectName: string;
  gitUrl: string;
  installationId: number;
  branch: string;
  commitHash: string;
  rootDirectory?: string;
  // Build Config
  buildConfig: {
    installCommand?: string;
    buildCommand?: string;
    runCommand?: string;
    outputDir?: string;
    framework: string;
  };
  domains: string[];
  envVars: Record<string, string>;
  previousDeploymentId?: string;
}

export interface ProjectCleanupJobData {
  projectId: string;
  projectName: string;
  activeDeploymentIds: string[];
}