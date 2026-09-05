import { useNotificationsStore } from "@/stores";

export interface DirectoryStoreAdapter {
  notifyProfileUpdated(): void;
}

export function createDirectoryStoreAdapter(): DirectoryStoreAdapter {
  function notifyProfileUpdated(): void {
    useNotificationsStore.getState().addNotification({
      type: "success",
      title: "Profile Updated",
      message: "Your profile has been updated successfully.",
    });
  }

  return { notifyProfileUpdated };
}