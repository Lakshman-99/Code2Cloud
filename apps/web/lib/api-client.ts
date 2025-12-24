// lib/api.ts
import { FetchClient } from "./fetch-client";

// Prevent duplicate instances in dev / HMR
declare global {
  var __apiClient: FetchClient | undefined;
}

function createClient() {
  return new FetchClient({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
    timeoutMs: 10_000,
    defaultHeaders: {
      Accept: 'application/json',
    },
  });
}

export const api = globalThis.__apiClient ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__apiClient = api;
}