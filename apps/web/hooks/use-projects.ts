/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";
import { api } from "@/lib/api-client";
import { CreateProjectPayload, EnvVar, Project, UpdateProjectPayload } from "@/types/project";

export function useProjects() {
  // 1. Fetch
  const { data: projects, error, isLoading, mutate } = useSWR<Project[]>("/projects",
    (url: string) => api.get<Project[]>(url)
  );

  // 2. Create Action
  const createProject = async (payload: CreateProjectPayload) => {
    try {
      const response = await api.post<Project>("/projects", payload);
      mutate(); // Refresh list immediately
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  // 3. Update Action
  const updateProject = async (id: string, payload: UpdateProjectPayload) => {
    if (!projects) return;

    // Optimistic Update
    const previous = projects;
    mutate(
      (current) =>
        current?.map((p) => (p.id === id ? { ...p, ...payload } : p)) ?? [],
      false
    );

    try {
      const updated = await api.put<Project>(`/projects/${id}`, payload);
      mutate(); // Revalidate with server
      return updated;
    } catch (err: any) {
      mutate(previous, false); // Rollback on error
      throw err;
    }
  };

  // 3. Delete Action
  const deleteProject = async (id: string) => {
    try {
      // B. API Call
      await api.delete(`/projects/${id}`);
      mutate(); // Ensure data is fresh
    } catch (err: any) {
      throw err;
    } 
  };

  const saveEnvVars = async (projectId: string, variables: EnvVar[]) => {
    const previous = projects;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const payload = variables.map(({id, ...rest}) => rest);
    
    // Optimistic Update: Find project and replace its envVars
    mutate((current) => current?.map(p => {
        if (p.id === projectId) {
            return { ...p, envVars: variables };
        }
        return p;
    }) ?? [], false);

    try {
      await api.put(`/projects/${projectId}/envs`, { variables: payload });
      mutate(); // Revalidate to get IDs/Timestamps from server
    } catch (err: any) {
      mutate(previous, false);
      throw err;
    }
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects?.find((p) => p.id === id);
  }

  return {
    projects,
    isLoading,
    isError: !!error,
    createProject,
    updateProject,
    deleteProject,
    saveEnvVars,
    getProjectById,
  };
}