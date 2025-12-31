// lib/api.ts
import { FetchClient } from "./fetch-client";
import { urlConfig } from "./url-config";

// Prevent duplicate instances in dev / HMR
declare global {
  var __apiClient: FetchClient | undefined;
}

function createClient() {
  return new FetchClient({
    baseUrl: urlConfig.apiUrl,
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