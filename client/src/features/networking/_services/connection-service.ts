import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/shared";
import type { Connection, ConnectionStatus, ConnectionSuggestion } from "@/types/domain/connection";

const STATUS_MAP: Record<string, ConnectionStatus> = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

function normalizeConnection(raw: Connection): Connection {
  return { ...raw, status: STATUS_MAP[raw.status] ?? "pending" };
}

export async function getConnections(): Promise<Connection[]> {
  return (await apiClient.get<Connection[]>("/connections")).map(normalizeConnection);
}

export async function getPendingRequests(): Promise<Connection[]> {
  return (await apiClient.get<Connection[]>("/connections/pending")).map(normalizeConnection);
}

export async function getSentRequests(): Promise<Connection[]> {
  return (await apiClient.get<Connection[]>("/connections/sent")).map(normalizeConnection);
}

export async function getSuggestions(batch?: string): Promise<ConnectionSuggestion[]> {
  const qs = batch ? `?batch=${encodeURIComponent(batch)}` : "";
  return apiClient.get<ConnectionSuggestion[]>(`/connections/suggestions${qs}`);
}

export async function sendConnectionRequest(
  recipientId: number,
  message?: string,
): Promise<ApiResponse<Connection>> {
  const res = await apiClient.post<ApiResponse<Connection>>("/connections", { recipientId, message });
  return { ...res, data: normalizeConnection(res.data) };
}

export async function sendConnectionRequestByRegister(
  registerNumber: string,
  message?: string,
): Promise<void> {
  await apiClient.post<ApiResponse<unknown>>(`/connections/by-register/${encodeURIComponent(registerNumber)}`, {
    message,
  });
}

export async function acceptConnection(id: number): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/connections/${id}/accept`);
}

export async function rejectConnection(id: number): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/connections/${id}/reject`);
}

export async function removeConnection(id: number): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/connections/${id}`);
}
