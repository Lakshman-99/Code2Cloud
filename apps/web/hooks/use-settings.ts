/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";
import { api } from "@/lib/api-client";
import { SystemConfig } from "@/types/auth";


export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<SystemConfig>("/settings", 
    (url: string) => api.get<SystemConfig>(url)
  );

  const updateSettings = async (partialConfig: Partial<SystemConfig>) => {
    // 1. Optimistic Update
    mutate((current) => current ? { ...current, ...partialConfig } : undefined, false);

    try {
      // 2. API Call
      await api.put("/settings", partialConfig);
      
      // 3. Revalidate to ensure sync
      mutate();
    } catch (err: any) {
      mutate(); // Rollback
      throw err;
    }
  };

  return {
    settings: data,
    isLoading,
    isError: !!error,
    updateSettings
  };
}