import type { SessionUser } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface AuthServiceContext {
  tracer: Tracer;
  authRepo: {
    login(credentials: { email: string; password: string }): Promise<import("@/lib/data/types").Result<import("@/types/api/auth").AuthResponse>>;
    register(data: { firstName: string; lastName: string; email: string; password: string }): Promise<import("@/lib/data/types").Result<import("@/types/api/auth").AuthResponse>>;
    logout(): Promise<import("@/lib/data/types").Result<void>>;
    getCurrentUser(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<SessionUser>>;
    refreshToken(): Promise<import("@/lib/data/types").Result<{ token: string }>>;
  };
  storeAdapter: AuthStoreAdapter;
  store: {
    getAuthToken: () => string | null;
    setAuthToken: (token: string) => void;
    clearAuthToken: () => void;
    getUser: () => SessionUser | null;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}

export interface AuthStoreAdapter {
  login: (user: SessionUser) => void;
  logout: () => void;
  setUser: (user: SessionUser) => void;
  setLoading: () => void;
  setError: (error: string) => void;
  hydrate: (user: SessionUser) => void;
  reset: () => void;
}

export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
}
