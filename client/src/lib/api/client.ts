import { env } from "@/config/env";
import { clearAuthTokens } from "@/features/auth/_services/auth-api";

const API_BASE = env.api.baseUrl;

function handleAuthFailure(): never {
  if (typeof window !== "undefined") {
    clearAuthTokens();
    window.location.href = "/auth/login";
  }
  throw new Error("Session expired. Please log in again.");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) handleAuthFailure();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error("Unable to connect to server. Please try again later.");
  }

  if (res.status === 401) handleAuthFailure();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return apiFetch<T>(path);
  },

  post<T>(path: string, data?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(path: string, data?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: "DELETE" });
  },
};
