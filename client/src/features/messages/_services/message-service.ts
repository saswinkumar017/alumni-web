import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/shared";

export interface ConversationSummary {
  userId: number;
  name: string;
  registerNumber: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ThreadMessage {
  id: number;
  senderId: number;
  receiverId: number | null;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface BroadcastMessage {
  id: number;
  senderId: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface SendMessageRequest {
  recipientId: number;
  content: string;
}

interface RawMessage {
  id: number;
  senderId: number;
  receiverId: number | null;
  subject: string | null;
  body: string | null;
  isRead?: boolean;
  createdAt: string;
}

function toThreadMessage(raw: RawMessage): ThreadMessage {
  return {
    id: raw.id,
    senderId: raw.senderId,
    receiverId: raw.receiverId ?? null,
    body: raw.body ?? raw.subject ?? "",
    isRead: Boolean(raw.isRead),
    createdAt: raw.createdAt,
  };
}

export async function getConversations(): Promise<ConversationSummary[]> {
  return apiClient.get<ConversationSummary[]>("/messages/conversations");
}

export async function getThread(userId: number): Promise<ThreadMessage[]> {
  const messages = await apiClient.get<RawMessage[]>(`/messages/thread/${userId}`);
  return Array.isArray(messages) ? messages.map(toThreadMessage) : [];
}

export async function sendMessage(data: SendMessageRequest): Promise<ThreadMessage> {
  const res = await apiClient.post<ApiResponse<RawMessage>>("/messages", {
    receiverId: data.recipientId,
    subject: null,
    body: data.content,
  });
  return toThreadMessage(res.data);
}

export async function markAsRead(id: number): Promise<void> {
  await apiClient.put<ApiResponse<null>>(`/messages/${id}/read`);
}

export async function deleteMessage(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`/messages/${id}`);
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<{ unreadCount: number }>("/messages/unread/count");
  return res.unreadCount;
}

type RawBroadcast = RawMessage;

export async function getBroadcasts(): Promise<BroadcastMessage[]> {
  const broadcasts = await apiClient.get<RawBroadcast[]>("/messages/broadcasts");
  return broadcasts.map((b) => ({
    id: b.id,
    senderId: b.senderId,
    title: b.subject ?? "Announcement",
    content: b.body ?? "",
    createdAt: b.createdAt,
  }));
}
