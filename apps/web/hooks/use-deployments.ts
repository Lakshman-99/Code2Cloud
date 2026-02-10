"use client";

import useSWR, { useSWRConfig } from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Deployment } from "@/types/project";

// --- HOOK 1: List & Actions ---
// Pass projectId to filter by project, or leave empty for global feed
export function useDeployments(projectId?: string) {
  const { mutate } = useSWRConfig();
  const [isDeploying, setIsDeploying] = useState(false);

  // 1. Determine API Endpoint
  const endpoint = projectId 
    ? `/deployments/project/${projectId}` 
    : `/deployments`;

  // 2. Fetch Data (Auto-refresh every 5s if items are building)
  const { data, error, isLoading } = useSWR<Deployment[]>(
    endpoint,
    (url: string) => api.get<Deployment[]>(url),
    // {
    //   // Smart Polling: Refresh faster if we detect active builds in the list
    //   refreshInterval: (latestData) => {
    //     const hasActive = latestData?.some(d => 
    //       ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(d.status)
    //     );
    //     return hasActive ? 3000 : 0; // Poll every 3s if active, else stop
    //   }
    // }
  );

  // 3. ACTION: Redeploy
  const redeploy = async (targetProjectId: string) => {
    setIsDeploying(true);
    const toastId = toast.loading("Queuing deployment...");

    try {
      const deployment = await api.post<Deployment>("/deployments", { projectId: targetProjectId });
      
      toast.success("Deployment queued", { id: toastId });
      
      // Refresh lists immediately
      mutate((key) => typeof key === 'string' && key.startsWith('/deployments'));
      // Also refresh the project card to show status update
      mutate((key) => typeof key === 'string' && key.startsWith('/projects'));

      return deployment;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to trigger redeployment", { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    deployments: data || [],
    isLoading,
    isError: !!error,
    redeploy,
    isDeploying
  };
}

// --- HOOK 2: Single Detail ---
export function useDeployment(deploymentId: string) {
  const { data, error, isLoading, mutate } = useSWR<Deployment>(
    deploymentId ? `/deployments/${deploymentId}` : null,
    (url: string) => api.get<Deployment>(url),
    {
      // Poll detailed logs if building
      refreshInterval: (data) => {
        return data && ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(data.status) 
          ? 2000 
          : 0;
      }
    }
  );

  const cancelDeployment = async () => {
    const toastId = toast.loading("Cancelling deployment...");
    try {
      await api.post(`/deployments/${deploymentId}/cancel`);
      toast.success("Deployment cancelled", { id: toastId });
      mutate();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to cancel deployment", { id: toastId });
    }
  };

  return {
    deployment: data,
    isLoading,
    isError: !!error,
    mutate,
    cancelDeployment
  };
}