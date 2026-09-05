import { createStore } from "@/stores/create-store";
import type { AppNotification, NotificationsStore } from "./types";

function generateId(): string {
  return `notif_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const initialState = {
  notifications: [] as AppNotification[],
  badgeCount: 0,
  unreadCount: 0,
};

export const useNotificationsStore = createStore<NotificationsStore>(
  (set) => ({
    ...initialState,

    addNotification(notification) {
      const newNotification: AppNotification = {
        ...notification,
        id: generateId(),
        timestamp: Date.now(),
        read: false,
      };
      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    },

    markAsRead(id) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    },

    markAllAsRead() {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    },

    dismissNotification(id) {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.read)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    },

    clearAll() {
      set({ notifications: [], unreadCount: 0 });
    },

    setBadgeCount(badgeCount) {
      set({ badgeCount });
    },

    incrementBadge() {
      set((state) => ({ badgeCount: state.badgeCount + 1 }));
    },

    reset() {
      set({ ...initialState });
    },
  }),
  {
    name: "notifications-store",
    devtools: true,
  },
);
