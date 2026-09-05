import type { SessionUser } from "@/types";
import { createStore } from "@/stores/create-store";
import type { AuthStore } from "./types";

const initialState = {
  user: null as SessionUser | null,
  status: "idle" as AuthStore["status"],
  error: null as string | null,
};

export const useAuthStore = createStore<AuthStore>(
  (set) => ({
    ...initialState,

    login(user: SessionUser) {
      set({ user, status: "authenticated", error: null });
    },

    logout() {
      set({ user: null, status: "unauthenticated", error: null });
    },

    setUser(user: SessionUser) {
      set({ user, status: "authenticated" });
    },

    setLoading() {
      set({ status: "loading" });
    },

    setError(error: string) {
      set({ error, status: "unauthenticated" });
    },

    hydrate(user: SessionUser) {
      set({ user, status: "authenticated", error: null });
    },

    reset() {
      set({ ...initialState });
    },
  }),
  {
    name: "auth-store",
    devtools: true,
  },
);
