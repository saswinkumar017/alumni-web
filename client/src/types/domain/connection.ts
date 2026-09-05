export interface Connection {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterRegisterNumber?: string | null;
  requesterAvatar?: string;
  recipientId: number;
  recipientName: string;
  recipientRegisterNumber?: string | null;
  recipientAvatar?: string;
  status: ConnectionStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface ConnectionRequest {
  recipientId: number;
  message?: string;
}

export type ConnectionSuggestionStatus = "CONNECTED" | "PENDING_SENT" | "PENDING_RECEIVED" | "NONE";

export interface ConnectionSuggestion {
  id: number;
  registerNumber: string | null;
  name: string;
  department: string | null;
  batch: string | null;
  yearOfPassing: number | null;
  company: string | null;
  designation: string | null;
  connectionStatus: ConnectionSuggestionStatus;
}
