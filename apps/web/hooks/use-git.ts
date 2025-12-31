"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { GitConnectionStatus, GitFrameworkDetection, GitRepository } from "@/types/git";

export interface FileNode {
  name: string;
  path: string;
  type: "dir" | "file";
}

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


  const detectFramework = async (installationId: string, repoFullName: string, path: string = '') => {
    const [owner, repo] = repoFullName.split('/');
    return api.get<GitFrameworkDetection>(
        `/git/detect?installationId=${installationId}&owner=${owner}&repo=${repo}&path=${path}`
    );
  };

  return {
    isConnected: !!status?.connected,
    status, 
    accounts: status?.accounts || [],
    selectedAccount: activeAccount,
    setSelectedAccount: setExplicitSelectedId, // user override only
    repos,
    isLoading: isStatusLoading || (!!activeAccount && isReposLoading),
    refreshStatus,
    detectFramework,
  };
}

export function useGitTree(installationId: string | undefined, repoFullName: string | undefined, path: string = '') {
  const shouldFetch = installationId && repoFullName;
  
  const { data, isLoading, error } = useSWR<FileNode[]>(
    shouldFetch ? `/git/tree-key-${installationId}-${repoFullName}-${path}` : null, // Custom Key
    async () => {
      const [owner, repo] = repoFullName!.split('/');
      const res = await api.get<FileNode[]>(
        `/git/tree?installationId=${installationId}&owner=${owner}&repo=${repo}&path=${path}`
      );
      return res;
    }
  );

  return {
    files: data || [],
    isLoading,
    isError: !!error
  };
}