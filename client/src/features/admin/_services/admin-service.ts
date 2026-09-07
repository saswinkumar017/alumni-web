import { env } from "@/config/env";
import { clearAuthTokens } from "@/features/auth/_services/auth-api";
import type { AuditLog, User } from "@/features/developer/_types";

const API_BASE = env.api.baseUrl;

function handleAuthFailure(): never {
  if (typeof window !== "undefined") {
    clearAuthTokens();
    window.location.href = "/auth/login";
  }
  throw new Error("Session expired. Please log in again.");
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("accessToken");
  if (!token) handleAuthFailure();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) handleAuthFailure();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ---- Dashboard ----
export function getAdminDashboard() {
  return adminFetch<any>("/admin/dashboard");
}

// ---- Users ----
export function getAdminUsers(query?: string, page = 0) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (query) params.set("query", query);
  return adminFetch<{ content: User[]; totalElements: number; totalPages: number }>(`/admin/users?${params}`);
}

export function suspendAdminUser(id: number, reason?: string) {
  return adminFetch<any>(`/admin/users/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "Suspended by admin" }),
  });
}

export function activateAdminUser(id: number) {
  return adminFetch<any>(`/admin/users/${id}/activate`, { method: "POST" });
}

// ---- Audit Logs ----
export function getAdminAuditLogs(filters: {
  page?: number;
  category?: string;
  logLevel?: string;
  method?: string;
} = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 0), size: "20" });
  if (filters.category) params.set("category", filters.category);
  if (filters.logLevel) params.set("logLevel", filters.logLevel);
  if (filters.method) params.set("method", filters.method);
  return adminFetch<{ content: AuditLog[]; totalElements: number; totalPages: number }>(`/admin/audit?${params}`);
}

export function getAdminAuditStats() {
  return adminFetch<{ totalEvents: number; errorCount: number }>("/admin/audit/stats");
}

export function connectAdminAuditStream(
  onMessage: (log: AuditLog) => void,
  onError?: (err: Event) => void,
) {
  const token = localStorage.getItem("accessToken");
  const url = `${API_BASE}/admin/audit/stream${token ? `?token=${token}` : ""}`;
  const source = new EventSource(url);

  source.addEventListener("audit-event", ((event: MessageEvent) => {
    try {
      const log = JSON.parse(event.data) as AuditLog;
      onMessage(log);
    } catch { /* skip */ }
  }) as EventListener);

  source.onerror = (err) => onError?.(err);
  return source;
}

// ---- Alumni ----
export function getAdminAlumni(query?: string, page = 0, filters?: { department?: string; batch?: string; hasAccount?: boolean; verified?: boolean }) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (query) params.set("query", query);
  if (filters?.department) params.set("department", filters.department);
  if (filters?.batch) params.set("batch", filters.batch);
  if (filters?.hasAccount !== undefined) params.set("hasAccount", String(filters.hasAccount));
  if (filters?.verified !== undefined) params.set("verified", String(filters.verified));
  return adminFetch<{ content: any[]; totalElements: number; totalPages: number }>(`/admin/alumni?${params}`);
}

export async function importAdminAlumni(file: File) {
  const token = localStorage.getItem("accessToken");
  if (!token) handleAuthFailure();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/admin/alumni/import`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
  if (res.status === 401) handleAuthFailure();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Import failed (${res.status})`);
  }
  return res.json() as Promise<{ totalRows: number; created: number; updated: number; skipped: number; errors: { row: number; registerNumber: string; message: string }[] }>;
}

// ---- Events ----
export interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  image: string | null;
  category: string;
  maxAttendees: number | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventInput {
  slug?: string;
  title: string;
  description?: string;
  venue?: string;
  eventDate: string;
  coverImageUrl?: string;
  status?: "DRAFT" | "PUBLISHED" | "CANCELLED";
  maxAttendees?: number;
  customFields?: Record<string, unknown>;
}

export function getAdminEvents() {
  return adminFetch<AdminEvent[]>("/admin/events");
}

export function createAdminEvent(input: AdminEventInput) {
  return adminFetch<AdminEvent>("/admin/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminEvent(id: string, input: Partial<AdminEventInput>) {
  return adminFetch<AdminEvent>(`/admin/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteAdminEvent(id: string) {
  return adminFetch<{ message: string }>(`/admin/events/${id}`, {
    method: "DELETE",
  });
}

// ---- Requests ----
export function getAdminRequests(status?: string, page = 0) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (status) params.set("status", status);
  return adminFetch<{ content: any[]; totalElements: number; totalPages: number }>(`/admin/requests?${params}`);
}

export function approveAdminRequest(id: number, notes?: string) {
  return adminFetch<any>(`/admin/request/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ adminNotes: notes ?? "Approved" }),
  });
}

export function rejectAdminRequest(id: number, notes?: string) {
  return adminFetch<any>(`/admin/request/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ adminNotes: notes ?? "Rejected" }),
  });
}
