import { Deployment, DeploymentStatus, EnvironmentType, EnvVar } from "@/types/project";
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
  getDeploymentsByProject: (projectId: string) => Deployment[];
  getLogsByProject: (projectId: string) => Log[];
}

export const mockDeployments: Deployment[] = [
  {
    id: "dep_1",
    projectId: "proj_1",
    status: DeploymentStatus.DEPLOYING,
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
    targets: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW],
  },
  {
    id: "e2",
    key: "API_SECRET",
    value: "sk_live_...",
    targets: [EnvironmentType.PRODUCTION],
  },
  {
    id: "e3",
    key: "NEXT_PUBLIC_API_URL",
    value: "https://api.code2cloud.dev",
    targets: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW, EnvironmentType.DEVELOPMENT],
  },
  {
    id: "e4",
    key: "REDIS_URL",
    value: "redis://...",
    targets: [EnvironmentType.PRODUCTION, EnvironmentType.PREVIEW],
  },
];


export const useMockStore = create<MockStore>((set, get) => ({
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

  getDeploymentsByProject: (projectId) =>
    get().deployments.filter((d) => d.projectId === projectId),
  getLogsByProject: () => {
    return [];
  },
}));
