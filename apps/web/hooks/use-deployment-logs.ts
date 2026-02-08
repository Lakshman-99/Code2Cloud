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
  source?: LogSource;
  pollInterval?: number;
  enabled?: boolean;
  dripInterval?: number;
}

export function useDeploymentLogs(
  deploymentId: string | undefined,
  options: UseDeploymentLogsOptions = {},
) {
  const {
    source,
    pollInterval = 2000,
    enabled = true,
    dripInterval = 60,
  } = options;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const bufferRef = useRef<LogEntry[]>([]);
  const dripTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDrippingRef = useRef(false);

  const cursorRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchConfig = useRef<{ id: string; source?: LogSource } | null>(
    null,
  );
  const isFirstBatchRef = useRef(true);

  const startDrip = useCallback(() => {
    if (isDrippingRef.current) return;
    isDrippingRef.current = true;

    const drip = () => {
      if (bufferRef.current.length === 0) {
        isDrippingRef.current = false;
        return;
      }

      const next = bufferRef.current.shift()!;
      setLogs((prev) => [...prev, next]);

      dripTimerRef.current = setTimeout(drip, dripInterval);
    };

    drip();
  }, [dripInterval]);

  const enqueueLogs = useCallback(
    (incoming: LogEntry[], immediate = false) => {
      if (incoming.length === 0) return;

      if (immediate || dripInterval === 0) {
        setLogs((prev) => [...prev, ...incoming]);
        return;
      }

      bufferRef.current.push(...incoming);
      startDrip();
    },
    [dripInterval, startDrip],
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
        if (isFirstBatchRef.current) {
          enqueueLogs(data.logs, true);
          isFirstBatchRef.current = false;
        } else {
          enqueueLogs(data.logs);
        }
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
  }, [deploymentId, source, enqueueLogs]);

  useEffect(() => {
    if (!deploymentId || !enabled) return;

    const isSameConfig =
      lastFetchConfig.current?.id === deploymentId &&
      lastFetchConfig.current?.source === source;

    if (!isSameConfig) {
      setLogs([]);
      setIsLoading(true);
      setError(null);
      cursorRef.current = null;
      bufferRef.current = [];
      isFirstBatchRef.current = true;
      isDrippingRef.current = false;
      if (dripTimerRef.current) {
        clearTimeout(dripTimerRef.current);
        dripTimerRef.current = null;
      }
      lastFetchConfig.current = { id: deploymentId, source };
    }

    fetchLogs();
  }, [deploymentId, source, enabled, fetchLogs]);

  useEffect(() => {
    if (!enabled || !deploymentId) return;

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

  useEffect(() => {
    if (!isLive && !isLoading && intervalRef.current) {
      fetchLogs().then(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });
    }
  }, [isLive, isLoading, fetchLogs]);

  useEffect(() => {
    return () => {
      if (dripTimerRef.current) clearTimeout(dripTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
    bufferRef.current = [];
    cursorRef.current = null;
    isFirstBatchRef.current = true;
    if (dripTimerRef.current) {
      clearTimeout(dripTimerRef.current);
      dripTimerRef.current = null;
    }
    isDrippingRef.current = false;
  }, []);

  return {
    logs,
    isLive,
    isLoading,
    status,
    error,
    clear,
    buffered: bufferRef.current.length,
  };
}