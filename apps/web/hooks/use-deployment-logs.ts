"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { LogEntry, LogSource, DeploymentStatus } from "@/types/project";

interface LogsResponse {
  logs: LogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  status: DeploymentStatus;
  isLive: boolean;
}

interface UseDeploymentLogsOptions {
  /** Which log source to fetch (BUILD, RUNTIME). Omit for all. */
  source?: LogSource;
  /** Polling interval in ms for live deployments. Default: 2000 */
  pollInterval?: number;
  /** Whether polling is enabled. Default: true */
  enabled?: boolean;
}

export function useDeploymentLogs(
  deploymentId: string | undefined,
  options: UseDeploymentLogsOptions = {},
) {
  const { source, pollInterval = 2000, enabled = true } = options;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cursor tracks the last log ID we've seen — subsequent fetches only get new logs
  const cursorRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchConfig = useRef<{ id: string; source?: LogSource } | null>(
    null,
  );

  const fetchLogs = useCallback(async () => {
    if (!deploymentId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const params = new URLSearchParams();
      if (source) params.set("source", source);
      if (cursorRef.current) params.set("after", cursorRef.current);
      params.set("limit", "200");

      const qs = params.toString();
      const url = `/deployments/${deploymentId}/logs${qs ? `?${qs}` : ""}`;

      const data = await api.get<LogsResponse>(url);

      if (data.logs.length > 0) {
        setLogs((prev) => [...prev, ...data.logs]);
        cursorRef.current = data.nextCursor;
      }

      setIsLive(data.isLive);
      setStatus(data.status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch logs"));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [deploymentId, source]);

  // Initial fetch
  useEffect(() => {
    if (!deploymentId || !enabled) return;

    const isSameConfig =
      lastFetchConfig.current?.id === deploymentId &&
      lastFetchConfig.current?.source === source;

    if (!isSameConfig) {
      // Reset state on deploymentId/source change
      setLogs([]);
      setIsLoading(true);
      setError(null);
      cursorRef.current = null;
      lastFetchConfig.current = { id: deploymentId, source };
    }

    fetchLogs();
  }, [deploymentId, source, enabled, fetchLogs]);

  // Live polling
  useEffect(() => {
    if (!enabled || !deploymentId) return;

    // Always poll — stop when backend says isLive=false and we've done at least one fetch
    intervalRef.current = setInterval(() => {
      fetchLogs();
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deploymentId, enabled, pollInterval, fetchLogs]);

  // Stop polling when deployment is no longer live (terminal state)
  useEffect(() => {
    if (!isLive && !isLoading && intervalRef.current) {
      // Do one final fetch to catch remaining logs, then stop
      fetchLogs().then(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });
    }
  }, [isLive, isLoading, fetchLogs]);

  const clear = useCallback(() => {
    setLogs([]);
    cursorRef.current = null;
  }, []);

  return {
    logs,
    isLive,
    isLoading,
    status,
    error,
    clear,
  };
}
