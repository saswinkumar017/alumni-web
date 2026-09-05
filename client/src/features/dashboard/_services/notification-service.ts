import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/shared";
import type { Notification, UnreadCountResponse } from "@/types/domain/notification";

export async function getNotifications(): Promise<Notification[]> {
  return apiClient.get<Notification[]>("/notifications");
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>("/notifications/unread/count");
}

export async function markAsRead(id: number): Promise<void> {
  await apiClient.put<ApiResponse<null>>(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.put<ApiResponse<null>>("/notifications/read-all");
}
