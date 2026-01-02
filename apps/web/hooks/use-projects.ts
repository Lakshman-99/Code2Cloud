/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";
import { api } from "@/lib/api-client";
import { CreateProjectPayload, Project, UpdateProjectPayload } from "@/types/project";

export function useProjects() {
  // 1. Fetch
  const { data: projects, error, isLoading, mutate } = useSWR<Project[]>("/projects",
    (url: string) => api.get<Project[]>(url)
  );

  // 2. Create Action
  const createProject = async (payload: CreateProjectPayload) => {
    try {
      // Optimistic Update is hard for creation (we don't have ID), so we just await
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
    // A. Optimistic Update: Remove from UI immediately
    const previous = projects;
    mutate((current) => current?.filter((p) => p.id !== id) ?? [], false);

    try {
      // B. API Call
      await api.delete(`/projects/${id}`);
      mutate(); // Ensure data is fresh
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
    getProjectById,
  };
}