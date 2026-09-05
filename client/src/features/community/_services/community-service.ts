import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/shared";
import type { Community, CommunityMessage, CreateCommunityRequest, PostCommunityMessageRequest } from "@/types/domain/community";

export interface CommunityFilters {
  batch?: string;
  department?: string;
}

interface AlumniMessageResponse {
  id: number;
  communityId: number;
  senderId: number;
  senderName: string | null;
  senderAvatar: string | null;
  body: string;
  createdAt: string;
}

function toCommunityMessage(m: AlumniMessageResponse): CommunityMessage {
  return {
    id: m.id,
    communityId: m.communityId,
    userId: m.senderId,
    displayName: m.senderName ?? "Alumni",
    avatar: m.senderAvatar ?? undefined,
    content: m.body,
    createdAt: m.createdAt,
  };
}

export async function getCommunities(filters?: CommunityFilters): Promise<Community[]> {
  const params = new URLSearchParams();
  if (filters?.batch) params.set("batch", filters.batch);
  if (filters?.department) params.set("department", filters.department);
  const qs = params.toString();
  return apiClient.get<Community[]>(`/communities${qs ? `?${qs}` : ""}`);
}

export async function getCommunity(id: number): Promise<Community> {
  return apiClient.get<Community>(`/communities/${id}`);
}

export async function joinCommunity(id: number): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/communities/${id}/join`);
}

export async function leaveCommunity(id: number): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/communities/${id}/leave`);
}

export async function getCommunityMessages(id: number): Promise<CommunityMessage[]> {
  const messages = await apiClient.get<AlumniMessageResponse[]>(`/communities/${id}/messages`);
  return Array.isArray(messages) ? messages.map(toCommunityMessage) : [];
}

export async function postCommunityMessage(id: number, data: PostCommunityMessageRequest): Promise<CommunityMessage> {
  const res = await apiClient.post<ApiResponse<AlumniMessageResponse>>(`/communities/${id}/messages`, data);
  return toCommunityMessage(res.data);
}

export async function createCommunity(data: CreateCommunityRequest): Promise<Community> {
  const res = await apiClient.post<ApiResponse<Community>>("/communities", data);
  return res.data;
}
