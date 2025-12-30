"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { GitConnectionStatus, GitRepository } from "@/types/git";

export function useGit() {
  const { data: status, isLoading: isStatusLoading, mutate: refreshStatus } =
    useSWR<GitConnectionStatus>("/git/status", async (url) => {
      try {
        return await api.get(url);
      } catch {
        return { connected: false, accounts: [] };
      }
    }, { revalidateOnFocus: true });

  // USER INTENT ONLY — not system default
  const [explicitSelectedId, setExplicitSelectedId] = useState<string | null>(null);

  // DERIVED — NEVER STORE
  const activeAccount =
    status?.accounts?.find(a => a.id === explicitSelectedId) ??
    status?.accounts?.[0] ??
    null;

  const { data: repos, isLoading: isReposLoading } =
    useSWR<GitRepository[]>(
      status?.connected && activeAccount?.installationId
        ? `/git/repos?installationId=${activeAccount.installationId}`
        : null,
      (url: string) => api.get<GitRepository[]>(url)
    );

  return {
    isConnected: !!status?.connected,
    status, 
    accounts: status?.accounts || [],
    selectedAccount: activeAccount,
    setSelectedAccount: setExplicitSelectedId, // user override only
    repos,
    isLoading: isStatusLoading || (!!activeAccount && isReposLoading),
    refreshStatus
  };
}
