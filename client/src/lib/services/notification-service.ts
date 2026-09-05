import type { AppNotification } from "@/stores/global/types";
import { useNotificationsStore } from "@/stores/global/notifications-store";

export interface NotificationInput {
  type: AppNotification["type"];
  title: string;
  message?: string;
  link?: string;
}

export function sendNotification(input: NotificationInput): void {
  useNotificationsStore.getState().addNotification(input);
}

export function sendSuccess(title: string, message?: string): void {
  sendNotification({ type: "success", title, message });
}

export function sendError(title: string, message?: string): void {
  sendNotification({ type: "error", title, message });
}

export function sendWarning(title: string, message?: string): void {
  sendNotification({ type: "warning", title, message });
}

export function sendInfo(title: string, message?: string): void {
  sendNotification({ type: "info", title, message });
}

export function incrementBadge(): void {
  useNotificationsStore.getState().incrementBadge();
}

export function clearNotifications(): void {
  useNotificationsStore.getState().clearAll();
}
