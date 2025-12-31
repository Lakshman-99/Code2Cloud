import { create } from "zustand";

export type FrameworkType = "nextjs" | "nestjs" | "vite" | "create-react-app" | "vue" | "angular" | "express" | "node" | "django" | "flask" | "fastapi" | "streamlit" | "python" | "unknown";
export type DeploymentStatus = "ready" | "building" | "error" | "queued";

export interface Project {
  id: string;
  name: string;
  type: FrameworkType;
  status: DeploymentStatus;
  domain: string;
  lastDeployed: string;
  branch: string;
  commit: string;
  commitMessage: string;
  duration: number;
  teamId: string;
  repoUrl?: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  commit: string;
  commitMessage: string;
  branch: string;
  duration: string;
  timestamp?: string;
  runtime: string;
  createdAt: string;
  author: string;
}

export interface AnalyticsData {
  time: string;
  requests: number;
  bandwidth: number;
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  environments: ("production" | "preview" | "development")[];
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
  addProject: (project: {
    name: string;
    type: FrameworkType;
    domain: string;
    branch: string;
  }) => void;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "api-gateway",
    type: "python",
    status: "ready",
    domain: "api.code2cloud.dev",
    lastDeployed: "2 min ago",
    branch: "main",
    commit: "a3f2c1b",
    commitMessage: "feat: add rate limiting middleware",
    duration: 45,
    teamId: "team-1",
  },
  {
    id: "2",
    name: "web-dashboard",
    type: "nextjs",
    status: "building",
    domain: "dashboard.code2cloud.dev",
    lastDeployed: "Building...",
    branch: "develop",
    commit: "f8d9e2a",
    commitMessage: "fix: responsive layout issues",
    duration: 0,
    teamId: "team-1",
  },
  {
    id: "3",
    name: "ml-service",
    type: "python",
    status: "ready",
    domain: "ml.code2cloud.dev",
    lastDeployed: "1 hour ago",
    branch: "main",
    commit: "c7b4a3d",
    commitMessage: "chore: upgrade tensorflow to 2.15",
    duration: 120,
    teamId: "team-1",
  },
  {
    id: "4",
    name: "landing-page",
    type: "nextjs",
    status: "ready",
    domain: "code2cloud.dev",
    lastDeployed: "3 hours ago",
    branch: "main",
    commit: "e1f0d9c",
    commitMessage: "feat: add pricing section",
    duration: 32,
    teamId: "team-1",
  },
];

const mockDeployments: Deployment[] = [
  {
    id: "d1",
    projectId: "1",
    status: "ready",
    commit: "a3f2b1c",
    commitMessage: "feat: add rate limiting middleware",
    branch: "main",
    duration: "45s",
    runtime: "Python 3.11",
    createdAt: "2 min ago",
    author: "sarah.chen",
  },
  {
    id: "d2",
    projectId: "2",
    status: "building",
    commit: "b7e4d2a",
    commitMessage: "fix: resolve hydration mismatch",
    branch: "develop",
    duration: "1m 23s",
    runtime: "Node 18.x",
    createdAt: "15 min ago",
    author: "alex.kim",
  },
  {
    id: "d3",
    projectId: "1",
    status: "ready",
    commit: "c9f8e3d",
    commitMessage: "refactor: optimize database queries",
    branch: "main",
    duration: "38s",
    runtime: "Python 3.11",
    createdAt: "1 hour ago",
    author: "sarah.chen",
  },
  {
    id: "d4",
    projectId: "3",
    status: "ready",
    commit: "d2a1b4c",
    commitMessage: "feat: add batch inference endpoint",
    branch: "main",
    duration: "2m 15s",
    runtime: "Python 3.11",
    createdAt: "1 hour ago",
    author: "mike.zhang",
  },
  {
    id: "d5",
    projectId: "4",
    status: "ready",
    commit: "e5c3f7b",
    commitMessage: "update: new hero section design",
    branch: "main",
    duration: "52s",
    runtime: "Node 18.x",
    createdAt: "3 hours ago",
    author: "emma.wilson",
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
    environments: ["production", "preview"],
  },
  {
    id: "e2",
    key: "API_SECRET",
    value: "sk_live_...",
    environments: ["production"],
  },
  {
    id: "e3",
    key: "NEXT_PUBLIC_API_URL",
    value: "https://api.code2cloud.dev",
    environments: ["production", "preview", "development"],
  },
  {
    id: "e4",
    key: "REDIS_URL",
    value: "redis://...",
    environments: ["production", "preview"],
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
    return project?.type === "python" ? pythonLogs : nextjsLogs;
  },

  addProject: ({ name, type, domain, branch }) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      type,
      status: "building",
      domain,
      lastDeployed: "Just now",
      branch,
      commit: Math.random().toString(36).substring(2, 9),
      commitMessage: "Initial deployment",
      duration: 0,
      teamId: "team-1",
    };
    set((state) => ({ projects: [newProject, ...state.projects] }));

    // Simulate build completion after 5 seconds
    setTimeout(() => {
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === newProject.id
            ? {
                ...p,
                status: "ready",
                lastDeployed: "Just now",
                duration: Math.floor(Math.random() * 60) + 30,
              }
            : p,
        ),
      }));
    }, 5000);
  },
}));
