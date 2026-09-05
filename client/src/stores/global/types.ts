import type { SessionUser } from "@/types";

export interface AuthState {
  user: SessionUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "mfa_required";
  error: string | null;
}

export interface AuthActions {
  login: (user: SessionUser) => void;
  logout: () => void;
  setUser: (user: SessionUser) => void;
  setLoading: () => void;
  setError: (error: string) => void;
  hydrate: (user: SessionUser) => void;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

export type ThemeMode = "light";
export type SidebarState = "expanded" | "collapsed";
export type FontSize = "small" | "medium" | "large";

export interface PreferencesState {
  theme: ThemeMode;
  sidebar: SidebarState;
  fontSize: FontSize;
  reducedMotion: boolean;
}

export interface PreferencesActions {
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebar: (state: SidebarState) => void;
  setFontSize: (size: FontSize) => void;
  setReducedMotion: (reduced: boolean) => void;
  reset: () => void;
}

export type PreferencesStore = PreferencesState & PreferencesActions;

export interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export interface NotificationsState {
  notifications: AppNotification[];
  badgeCount: number;
  unreadCount: number;
}

export interface NotificationsActions {
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  setBadgeCount: (count: number) => void;
  incrementBadge: () => void;
  reset: () => void;
}

export type NotificationsStore = NotificationsState & NotificationsActions;

export interface FeatureFlagsState {
  flags: Record<string, boolean>;
  loading: boolean;
}

export interface FeatureFlagsActions {
  setFlag: (key: string, value: boolean) => void;
  setFlags: (flags: Record<string, boolean>) => void;
  setLoading: (loading: boolean) => void;
  isEnabled: (key: string) => boolean;
  reset: () => void;
}

export type FeatureFlagsStore = FeatureFlagsState & FeatureFlagsActions;
