export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface SystemConfig {
  defaultRegion: string;
  maxConcurrentBuilds: number;
  logRetentionDays: number;
  turboMode: boolean;
  globalTTLMinutes: number;
  autoDeploy: boolean;
  slackWebhook: string;
  emailDeployFailed: boolean;
  emailDeploySuccess: boolean;
  emailBilling: boolean;
  updatedAt: string;
}