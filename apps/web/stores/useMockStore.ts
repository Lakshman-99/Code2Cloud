import { Deployment, DeploymentStatus, EnvironmentType, EnvVar, Project } from "@/types/project";
import { create } from "zustand";

export interface AnalyticsData {
  time: string;
  requests: number;
  bandwidth: number;
}

export interface Log {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface MockStore {
  projects: Project[];
  deployments: Deployment[];
  analytics: AnalyticsData[];
  envVars: EnvVar[];
  selectedProjectId: string | null;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  loading: boolean;

  setSelectedProject: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  setLoading: (loading: boolean) => void;
  getProjectById: (id: string) => Project | undefined;
  getDeploymentsByProject: (projectId: string) => Deployment[];
  getLogsByProject: (projectId: string) => Log[];
}

export const mockDeployments: Deployment[] = [
  {
    id: "dep_1",
    projectId: "proj_1",
    status: DeploymentStatus.READY,
    environment: EnvironmentType.PRODUCTION,

    machineCpu: 2,
    machineRam: 4096,
    machineStorage: 20,
    machineOS: "ubuntu-22.04",

    buildLogs: "Installing deps...\nBuilding app...\nDeployment successful.",
    deploymentRegion: "us-east-1",

    startedAt: "2025-01-05T10:14:22.000Z",
    finishedAt: "2025-01-05T10:16:40.000Z",
    duration: 138,

    branch: "main",
    commitHash: "a91df34c82f91a7fa921",
    commitMessage: "feat: add auth flow",
    commitAuthor: "Lakshman Siva",

    deploymentUrl: "nextpath.code2cloud.dev",
  },
  {
    id: "dep_2",
    projectId: "proj_12",
    status: DeploymentStatus.FAILED,
    environment: EnvironmentType.PREVIEW,

    machineCpu: 1,
    machineRam: 2048,
    machineStorage: 10,
    machineOS: "ubuntu-22.04",

    buildLogs: "npm run build\nError: Cannot find module 'next'",
    deploymentRegion: "us-west-2",

    startedAt: "2025-01-08T18:04:11.000Z",
    finishedAt: "2025-01-08T18:05:03.000Z",
    duration: 52,

    branch: "feature/navbar",
    commitHash: "9fd23ab7812cbb01",
    commitMessage: "wip: navbar animation",
    commitAuthor: "Lakshman Siva",

    deploymentUrl: "feature-navbar-nextpath.code2cloud.dev",
  },
];

const generateAnalytics = (): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: `${i}h`,
      requests: Math.floor(Math.random() * 5000) + 1000,
      bandwidth: Math.floor(Math.random() * 500) + 100,
    });
  }
  return data;
};

const mockEnvVars: EnvVar[] = [
  {
    id: "e1",
    key: "DATABASE_URL",
    value: "postgresql://...",
    environments: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW],
  },
  {
    id: "e2",
    key: "API_SECRET",
    value: "sk_live_...",
    environments: [EnvironmentType.PRODUCTION],
  },
  {
    id: "e3",
    key: "NEXT_PUBLIC_API_URL",
    value: "https://api.code2cloud.dev",
    environments: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW, EnvironmentType.DEVELOPMENT],
  },
  {
    id: "e4",
    key: "REDIS_URL",
    value: "redis://...",
    environments: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW],
  },
];

export const mockProjects: Project[] = [
  {
    id: "proj_1",
    name: "NextPath Visualizer",
    framework: "Next.js",
    language: "TypeScript",
    rootDirectory: "apps/web",
    installCommand: "pnpm install",
    buildCommand: "pnpm build",
    runCommand: "pnpm start",
    outputDirectory: ".next",
    autoDeploy: true,

    gitRepoName: "nextpath",
    gitRepoOwner: "lakshman-99",
    gitBranch: "main",
    gitRepoId: 9328123,
    gitRepoUrl: "",
    gitCloneUrl: "",

    deployments: mockDeployments,

    envVars: [
      { id: "e1", key: "DATABASE_URL", value: "postgres://prod-db-url", environments: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW] },
      { id: "e2", key: "NEXTAUTH_SECRET", value: "super-secret-key", environments: [EnvironmentType.PRODUCTION] },
      { id: "e3", key: "NEXT_PUBLIC_API_URL", value: "https://api.nextpath.dev", environments: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW, EnvironmentType.DEVELOPMENT] },
    ],

    createdAt: "2024-12-15T12:00:00.000Z",
    updatedAt: "2025-01-08T18:05:03.000Z",
  },

  {
    id: "proj_2",
    name: "CloudTasker",
    framework: "Node.js",
    language: "JavaScript",
    rootDirectory: "apps/api",
    installCommand: "npm install",
    buildCommand: "npm run build",
    runCommand: "npm run start:prod",
    autoDeploy: false,

    gitRepoName: "cloudtasker",
    gitRepoOwner: "lakshman-99",
    gitBranch: "develop",
    gitRepoId: 7812332,
    gitRepoUrl: "",
    gitCloneUrl: "",

    deployments: [
      {
        id: "dep_3",
        projectId: "proj_2",
        status: DeploymentStatus.BUILDING,
        environment: EnvironmentType.DEVELOPMENT,

        machineCpu: 1,
        machineRam: 2048,
        machineStorage: 10,
        machineOS: "alpine",

        deploymentRegion: "eu-central-1",

        startedAt: "2025-01-09T21:12:10.000Z",

        branch: "develop",
        commitHash: "bf2d99123",
        commitMessage: "refactor: task queue",
        commitAuthor: "Lakshman Siva",
        deploymentUrl: "dev-cloudtasker.code2cloud.dev",
      },
    ],

    createdAt: "2024-11-20T09:30:00.000Z",
    updatedAt: "2025-01-09T21:12:10.000Z",
  },
];

const pythonLogs: Log[] = [
  {
    id: "l1",
    timestamp: "12:00:01",
    type: "info",
    message: "Cloning repository...",
  },
  {
    id: "l2",
    timestamp: "12:00:03",
    type: "info",
    message: "Installing Python 3.11...",
  },
  {
    id: "l3",
    timestamp: "12:00:05",
    type: "info",
    message: "Running pip install -r requirements.txt",
  },
  {
    id: "l4",
    timestamp: "12:00:08",
    type: "success",
    message: "Collecting fastapi==0.104.1",
  },
  {
    id: "l5",
    timestamp: "12:00:10",
    type: "success",
    message: "Collecting uvicorn[standard]==0.24.0",
  },
  {
    id: "l6",
    timestamp: "12:00:12",
    type: "success",
    message: "Collecting pydantic==2.5.2",
  },
  {
    id: "l7",
    timestamp: "12:00:15",
    type: "warning",
    message: "Running database migrations...",
  },
  {
    id: "l8",
    timestamp: "12:00:18",
    type: "success",
    message: "All migrations applied successfully",
  },
  {
    id: "l9",
    timestamp: "12:00:20",
    type: "info",
    message: "Starting uvicorn server...",
  },
  {
    id: "l10",
    timestamp: "12:00:22",
    type: "success",
    message: "Application ready on port 8000",
  },
];

const nextjsLogs: Log[] = [
  {
    id: "l1",
    timestamp: "12:00:01",
    type: "info",
    message: "Cloning repository...",
  },
  {
    id: "l2",
    timestamp: "12:00:03",
    type: "info",
    message: "Detected Next.js 14.0.4",
  },
  {
    id: "l3",
    timestamp: "12:00:05",
    type: "info",
    message: "Running npm install",
  },
  {
    id: "l4",
    timestamp: "12:00:15",
    type: "success",
    message: "Dependencies installed (2341 packages)",
  },
  {
    id: "l5",
    timestamp: "12:00:18",
    type: "info",
    message: "Running next build",
  },
  {
    id: "l6",
    timestamp: "12:00:22",
    type: "info",
    message: "Creating optimized production build...",
  },
  {
    id: "l7",
    timestamp: "12:00:30",
    type: "success",
    message: "Webpack compiled successfully",
  },
  {
    id: "l8",
    timestamp: "12:00:35",
    type: "info",
    message: "Prerendering static pages (12/12)",
  },
  {
    id: "l9",
    timestamp: "12:00:40",
    type: "info",
    message: "Generating static files...",
  },
  {
    id: "l10",
    timestamp: "12:00:45",
    type: "success",
    message: "Build completed. Ready for deployment.",
  },
];

export const useMockStore = create<MockStore>((set, get) => ({
  projects: mockProjects,
  deployments: mockDeployments,
  analytics: generateAnalytics(),
  envVars: mockEnvVars,
  selectedProjectId: null,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  loading: true,

  setSelectedProject: (id) => set({ selectedProjectId: id }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setLoading: (loading) => set({ loading }),

  getProjectById: (id) => get().projects.find((p) => p.id === id),
  getDeploymentsByProject: (projectId) =>
    get().deployments.filter((d) => d.projectId === projectId),
  getLogsByProject: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    return project?.language === "python" ? pythonLogs : nextjsLogs;
  },
}));
