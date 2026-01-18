export const BUILD_QUEUE_NAME = 'build-queue';

// This is the payload your Go worker will expect
export interface BuildJobData {
  deploymentId: string;
  projectId: string;
  gitUrl: string;
  branch: string;
  commitHash: string;
  // Build Config
  buildConfig: {
    installCommand?: string;
    buildCommand?: string;
    outputDir?: string;
    framework: string;
  };
  // Environment Variables (Already encrypted!)
  envVars: Record<string, string>;
}