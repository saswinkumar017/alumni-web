import { createStore } from "@/stores/create-store";
import type { FeatureFlagsStore } from "./types";

const initialState = {
  flags: {} as Record<string, boolean>,
  loading: true,
};

export const useFeatureFlagsStore = createStore<FeatureFlagsStore>(
  (set, get) => ({
    ...initialState,

    setFlag(key, value) {
      set((state) => ({ flags: { ...state.flags, [key]: value } }));
    },

    setFlags(flags) {
      set({ flags, loading: false });
    },

    setLoading(loading) {
      set({ loading });
    },

    isEnabled(key) {
      return get().flags[key] ?? false;
    },

    reset() {
      set({ ...initialState });
    },
  }),
  {
    name: "feature-flags-store",
    devtools: true,
  },
);
