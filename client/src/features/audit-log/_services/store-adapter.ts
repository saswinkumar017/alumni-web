import { useNotificationsStore } from "@/stores";

export interface AuditLogStoreAdapter {
  notifyQueryFailed(reason: string): void;
}

export function createAuditLogStoreAdapter(): AuditLogStoreAdapter {
  function notifyQueryFailed(reason: string): void {
    useNotificationsStore.getState().addNotification({
      type: "error",
      title: "Audit Query Failed",
      message: reason,
    });
  }

  return { notifyQueryFailed };
}