import { createApiClient } from "./client";
import { env } from "@/config/env";
import { DEFAULT_RETRY_CONFIG } from "./types";
import { getCsrfToken, isCsrfTokenRequired, createCorrelationId } from "@/lib/security/csrf";

let tokenProvider: () => Promise<string | null> = async () => null;
let authFailureHandler: (() => void) | undefined;
let tokenRefreshHandler: (() => Promise<string | null>) | undefined;

export function setTokenProvider(provider: () => Promise<string | null>): void {
  tokenProvider = provider;
}

export function setAuthFailureHandler(handler: () => void): void {
  authFailureHandler = handler;
}

export function setTokenRefreshHandler(handler: () => Promise<string | null>): void {
  tokenRefreshHandler = handler;
}

export const apiClient = createApiClient({
  baseUrl: env.api.baseUrl,
  defaultTimeout: env.api.timeout,
  retryConfig: DEFAULT_RETRY_CONFIG,
  getToken: () => tokenProvider(),
  onAuthFailure: () => authFailureHandler?.(),
  onTokenRefresh: async () => (tokenRefreshHandler ? tokenRefreshHandler() : null),
  applySecurityHeaders: (method) => {
    const headers: Record<string, string> = {
      "X-Correlation-ID": createCorrelationId(),
    };
    const csrfToken = getCsrfToken();
    if (csrfToken && isCsrfTokenRequired(method)) {
      headers["X-CSRF-Token"] = csrfToken;
    }
    return headers;
  },
});