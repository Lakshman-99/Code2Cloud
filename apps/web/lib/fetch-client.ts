// lib/fetch-client.ts
import { ApiError } from "./api-error";
import { tokenManager } from "./token-manager";
import { AuthResponse } from "@/types/auth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface FetchClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  defaultHeaders?: HeadersInit;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class FetchClient {
  private readonly baseUrl: string;
  private readonly timeoutMs?: number;
  private readonly defaultHeaders: HeadersInit;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: FetchClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? "";
    this.timeoutMs = config.timeoutMs;
    this.defaultHeaders = config.defaultHeaders ?? {};
  }

  async request<T>(
    method: HttpMethod,
    url: string,
    options: RequestOptions = {},
  ): Promise<T> {
    let signal = options.signal; // 1. Check for external signal
    let timeoutId: NodeJS.Timeout | undefined;

    if (!signal) {
        const controller = new AbortController();
        const timeout = options.timeoutMs ?? this.timeoutMs;
        if (timeout) {
            timeoutId = setTimeout(() => controller.abort(), timeout);
        }
        signal = controller.signal;
    }

    const fullUrl = this.buildUrl(url, options.params);
    const { body, skipAuth, ...rest } = options;

    // 1. Inject Access Token (from Cookies via TokenManager)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders as Record<string, string>,
      ...options.headers as Record<string, string>,
    };

    if (!skipAuth) {
      const token = tokenManager.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const fetchBody = body ? JSON.stringify(body) : undefined;

    const doFetch = async (newHeaders?: Record<string, string>) =>
      fetch(fullUrl, {
        ...rest,
        method,
        signal,
        headers: newHeaders ?? headers,
        body: fetchBody,
      });

    try {
      let res = await doFetch();

      // 2. Handle 401 -> Refresh Token Flow
      if (res.status === 401 && !skipAuth && tokenManager.getRefreshToken()) {
        try {
          const newToken = await this.refreshTokens();
          if (!newToken) throw new Error("Refresh failed");

          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };
          
          res = await doFetch(newHeaders);
        } catch (error) {
          // If refresh fails, clear everything and redirect
          tokenManager.clearTokens();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("auth:logout"));
          }
          throw error;
        }
      }

      if (!res.ok) {
        const errorData = await this.safeParse(res);
        const message =
          typeof errorData === "object" &&
          errorData !== null &&
          "message" in errorData
            ? String((errorData as { message?: unknown }).message)
            : res.statusText;
        throw new ApiError(message, res.status, errorData);
      }

      return this.safeParse<T>(res);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // --- REFRESH LOGIC (Updated for RtGuard) ---
  private async refreshTokens() {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      // Use a fresh fetch call here to avoid circular logic
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`, // Send in Header
        },
      });

      if (!response.ok) throw new Error("Refresh failed");

      const data: AuthResponse = await response.json();
      tokenManager.setTokens(data); // Updates tokens
      return data.accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Helper Wrappers
  get<T>(url: string, options?: RequestOptions) {
    return this.request<T>("GET", url, options);
  }
  post<T>(url: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("POST", url, { ...options, body });
  }
  put<T>(url: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PUT", url, { ...options, body });
  }
  delete<T>(url: string, options?: RequestOptions) {
    return this.request<T>("DELETE", url, options);
  }

  private buildUrl(url: string, params?: RequestOptions["params"]): string {
    const fullUrl = this.baseUrl + url;
    if (!params) return fullUrl;
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) search.append(key, String(value));
    });
    return `${fullUrl}?${search.toString()}`;
  }

  private async safeParse<T = unknown>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) return res.json();
    if (res.status === 204) return undefined as T;
    return res.text() as unknown as T;
  }
}
