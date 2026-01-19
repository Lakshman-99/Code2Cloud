import { Deployment, EnvironmentType, EnvVar } from "@/types/project";
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


export const useMockStore = create<MockStore>((set) => ({
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

  getDeploymentsByProject: () =>
    [],
  getLogsByProject: () => {
    return [];
  },
}));
