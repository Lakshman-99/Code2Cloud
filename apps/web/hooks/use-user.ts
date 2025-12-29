"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { api } from "@/lib/api-client";
import { tokenManager } from "@/lib/token-manager";
import { User } from "@/types/auth";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

// 1. Reactive Token Store
function subscribe(callback: () => void) {
  tokenManager.addEventListener("change", callback);
  return () => tokenManager.removeEventListener("change", callback);
}

function getSnapshot() {
  return tokenManager.getAccessToken();
}

function getServerSnapshot() {
  return null;
}

export function useUser() {
  const router = useRouter();
  // If this changes, the hook re-runs and SWR gets a new key
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const fetcher = useCallback(async () => {
    try {
      const signal = AbortSignal.timeout(5000);
      return await api.get<User>("/auth/me", { signal });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // If the token is invalid (401), clear it immediately to stop retries
      const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
      const isAuthError = error?.status === 401 || error?.response?.status === 401;
      const isNetworkError = error?.message === 'Failed to fetch';

      // If Unauthorized (401), Timeout (Server hanging), or Network Error (Server down)
      if (isAuthError || isTimeout || isNetworkError) {
        console.warn("Auth check failed (Timeout/401/Network). Logging out...");
        tokenManager.clearTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:logout"));
        }
      }
      throw error;
    }
  }, []);

  const { data, error, isLoading, mutate } = useSWR<User | null>(
    token ? ["/auth/me", token] : null,
    fetcher,
    {
      revalidateOnFocus: true,      // Auto-check session on tab switch
      revalidateOnReconnect: true,  // Auto-check on internet reconnect
      shouldRetryOnError: false,    // Don't loop if 401
      dedupingInterval: 2000,       // Prevent double-firing
      loadingTimeout: 5000,        // Consider loading if >5s
    }
  );

  useEffect(() => {
    const handleLogout = () => {
      mutate(null, false);
      tokenManager.clearTokens();
      router.push("/auth"); 
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [mutate, router]);

  return {
    user: data || null,
    // We are loading if SWR is validating AND we have a token (otherwise we are just Guest)
    isUserLoading: isLoading && !!token, 
    error,
    isAuthenticated: !!data,
    mutate, // Expose mutate so you can update user data manually (e.g. after profile edit)
  };
}