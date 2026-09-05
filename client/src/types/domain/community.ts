export interface CommunityMember {
  id: number;
  userId: number;
  displayName: string;
  avatar?: string;
  role: "member" | "admin";
  joinedAt: string;
}

export interface Community {
  id: number;
  name: string;
  description: string;
  category?: string;
  batch?: string;
  department?: string;
  coverImage?: string;
  memberCount: number;
  isMember: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMessage {
  id: number;
  communityId: number;
  userId: number;
  displayName: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

export interface CreateCommunityRequest {
  name: string;
  description: string;
  category?: string;
  batch?: string;
  department?: string;
  isPublic?: boolean;
}

export interface PostCommunityMessageRequest {
  body: string;
}
