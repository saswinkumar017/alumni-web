import { env } from "@/config/env";
import { clearAuthTokens } from "@/features/auth/_services/auth-api";
import type {
  PlatformConfig,
  FeatureFlag,
  RoleTemplate,
  Permission,
  User,
  AuditLog,
  AuditStats,
  MonitoringData,
} from "../_types";

const API_BASE = env.api.baseUrl;

function handleAuthFailure(): never {
  if (typeof window !== "undefined") {
    clearAuthTokens();
    window.location.href = "/auth/login";
  }
  throw new Error("Session expired. Please log in again.");
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    handleAuthFailure();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  });
  if (res.status === 401) {
    handleAuthFailure();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ---- Platform Config ----
export function getPlatformConfigs() {
  return apiFetch<{ data: PlatformConfig[] }>("/developer/config");
}

export function updatePlatformConfig(key: string, value: string) {
  return apiFetch<{ data: PlatformConfig }>(
    `/developer/config/${encodeURIComponent(key)}`,
    { method: "PUT", body: JSON.stringify({ value }) },
  );
}

export function createPlatformConfig(data: {
  key: string;
  value: string;
  valueType: string;
  category: string;
  description: string;
}) {
  return apiFetch<{ data: PlatformConfig }>("/developer/config", {
    method: "POST",
    body: JSON.stringify({ ...data, isSensitive: false, isReadonly: false }),
  });
}

// ---- Feature Flags ----
export function getFeatureFlags() {
  return apiFetch<{ data: FeatureFlag[] }>("/developer/feature-flags");
}

export function createFeatureFlag(data: { code: string; name: string; description?: string }) {
  return apiFetch<{ data: FeatureFlag }>("/developer/feature-flags", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function toggleFeatureFlag(id: number, enabled: boolean) {
  return apiFetch<{ data: FeatureFlag }>(
    `/developer/feature-flags/${id}/toggle`,
    { method: "PATCH", body: JSON.stringify({ enabled }) },
  );
}

export function deleteFeatureFlag(id: number) {
  return apiFetch<{ success: boolean }>(`/developer/feature-flags/${id}`, {
    method: "DELETE",
  });
}

// ---- Roles ----
export function getRoleTemplates() {
  return apiFetch<{ data: RoleTemplate[] }>("/developer/roles");
}

export function createRoleTemplate(data: { name: string; code: string; description?: string }) {
  return apiFetch<{ data: RoleTemplate }>("/developer/roles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRoleTemplate(id: number, data: { name?: string; description?: string }) {
  return apiFetch<{ data: RoleTemplate }>(`/developer/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteRoleTemplate(id: number) {
  return apiFetch<{ success: boolean }>(`/developer/roles/${id}`, {
    method: "DELETE",
  });
}

// ---- Permissions ----
export function getPermissions() {
  return apiFetch<{ data: Permission[] }>("/developer/permissions");
}

export function createPermission(data: { name: string; code: string; groupId?: number }) {
  return apiFetch<{ data: Permission }>("/developer/permissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---- Users ----
export function getUsers(page: number = 0, query: string = "") {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (query) params.set("query", query);
  return apiFetch<{ content: User[]; totalElements: number; totalPages: number }>(
    `/developer/users?${params}`,
  );
}

export function getUserById(id: number) {
  return apiFetch<{ data: User }>(`/developer/users/${id}`);
}

export function suspendUser(id: number) {
  return apiFetch<{ data: User }>(`/developer/users/${id}/suspend`, { method: "POST" });
}

export function activateUser(id: number) {
  return apiFetch<{ data: User }>(`/developer/users/${id}/activate`, { method: "POST" });
}

export function changeUserRole(id: number, role: string) {
  return apiFetch<{ data: User }>(`/developer/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

// ---- Audit Logs ----
export function getAuditLogs(filters: {
  page?: number;
  action?: string;
  userId?: number;
  from?: string;
  to?: string;
  entityType?: string;
  category?: string;
  logLevel?: string;
  method?: string;
} = {}) {
  const params = new URLSearchParams();
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.action) params.set("action", filters.action);
  if (filters.userId) params.set("userId", String(filters.userId));
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.category) params.set("category", filters.category);
  if (filters.logLevel) params.set("logLevel", filters.logLevel);
  if (filters.method) params.set("method", filters.method);
  if (filters.from) params.set("from", filters.from.includes("T") ? filters.from : `${filters.from}T00:00:00`);
  if (filters.to) params.set("to", filters.to.includes("T") ? filters.to : `${filters.to}T23:59:59`);
  return apiFetch<{ content: AuditLog[]; totalElements: number; totalPages: number }>(
    `/developer/audit?${params}`,
  );
}

export function getAuditStats() {
  return apiFetch<{ data: AuditStats }>("/developer/audit/stats");
}

export async function exportAuditLogs(
  filters: Parameters<typeof getAuditLogs>[0] = {},
  format: "csv" | "json" = "csv",
) {
  const params = new URLSearchParams({ format });
  if (filters.action) params.set("action", filters.action);
  if (filters.userId) params.set("userId", String(filters.userId));
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.category) params.set("category", filters.category);
  if (filters.logLevel) params.set("logLevel", filters.logLevel);
  if (filters.method) params.set("method", filters.method);
  if (filters.from) params.set("from", filters.from.includes("T") ? filters.from : `${filters.from}T00:00:00`);
  if (filters.to) params.set("to", filters.to.includes("T") ? filters.to : `${filters.to}T23:59:59`);

  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}/developer/audit/export?${params}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Export failed (${res.status})`);
  }
  return res.blob();
}

export function connectAuditStream(
  onMessage: (log: AuditLog) => void,
  onError?: (err: Event) => void,
) {
  const token = localStorage.getItem("accessToken");
  const url = `${API_BASE}/developer/audit/stream${token ? `?token=${token}` : ""}`;
  const source = new EventSource(url);

  source.addEventListener("audit-event", ((event: MessageEvent) => {
    try {
      const log = JSON.parse(event.data) as AuditLog;
      onMessage(log);
    } catch {
      // skip malformed events
    }
  }) as EventListener);

  source.onmessage = (event) => {
    try {
      const log = JSON.parse(event.data) as AuditLog;
      onMessage(log);
    } catch {
      // skip malformed events
    }
  };

  source.onerror = (err) => {
    onError?.(err);
  };
  return source;
}

// ---- Monitoring ----
export function getMonitoringData() {
  return apiFetch<MonitoringData>("/developer/monitoring");
}
