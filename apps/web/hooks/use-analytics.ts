"use client";

import useSWR from "swr";
import { api } from "@/lib/api-client";
import { OverviewAnalytics, ProjectAnalytics } from "@/types/analytics";

// ── Dashboard Overview Analytics ───────────────────────────
export function useAnalytics() {
  const { data, error, isLoading, mutate } = useSWR<OverviewAnalytics>(
    "/analytics/overview",
    (url: string) => api.get<OverviewAnalytics>(url),
    {
      refreshInterval: 30_000, // Refresh every 30s
      revalidateOnFocus: true,
    },
  );

  return {
    analytics: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

// ── Per-Project Analytics ──────────────────────────────────
export function useProjectAnalytics(projectId?: string) {
  const { data, error, isLoading, mutate } = useSWR<ProjectAnalytics>(
    projectId ? `/analytics/projects/${projectId}` : null,
    (url: string) => api.get<ProjectAnalytics>(url),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    },
  );

  return {
    analytics: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
