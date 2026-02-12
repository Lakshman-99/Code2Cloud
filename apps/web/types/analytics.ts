// ── Analytics Types ─────────────────────────────────────────
// Matches the shape returned by GET /analytics/overview
// and GET /analytics/projects/:projectId

export interface DeploymentTimePoint {
  date: string;
  total: number;
  success: number;
  failed: number;
}

export interface BuildTimeTrendPoint {
  date: string;
  avgDuration: number;
}

export interface ProjectDeploymentCount {
  projectId: string;
  projectName: string;
  framework: string;
  count: number;
}

export interface RecentActivityItem {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  commitHash: string;
  commitMessage?: string;
  branch: string;
}

// Dashboard Overview Analytics (all user projects)
export interface OverviewAnalytics {
  totalDeployments: number;
  totalProjects: number;
  deploymentsThisWeek: number;
  avgBuildTime: number; // in seconds
  successRate: number; // 0-100
  deploymentsOverTime: DeploymentTimePoint[];
  statusDistribution: Record<string, number>;
  deploymentsByProject: ProjectDeploymentCount[];
  buildTimeTrend: BuildTimeTrendPoint[];
}

// Per-Project Analytics
export interface ProjectAnalytics {
  projectId: string;
  projectName: string;
  framework: string;
  totalDeployments: number;
  deploymentsThisWeek: number;
  avgBuildTime: number;
  successRate: number;
  fastestBuild: number;
  slowestBuild: number;
  statusDistribution: Record<string, number>;
  deploymentsOverTime: DeploymentTimePoint[];
  buildTimeTrend: BuildTimeTrendPoint[];
  recentActivity: RecentActivityItem[];
}
