export const BUILD_QUEUE_NAME = 'build-queue';

// This is the payload your Go worker will expect
export interface BuildJobData {
  deploymentId: string;
  projectId: string;
  projectName: string;
  gitUrl: string;
  installationId: number;
  branch: string;
  commitHash: string;
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
}