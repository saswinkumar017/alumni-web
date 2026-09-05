export type NotificationType = string;

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string | null;
  notificationType: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
