import { createStore } from "@/stores/create-store";
import type { PreferencesStore } from "./types";

const initialState = {
  theme: "system" as PreferencesStore["theme"],
  sidebar: "expanded" as PreferencesStore["sidebar"],
  fontSize: "medium" as PreferencesStore["fontSize"],
  reducedMotion: false,
};

export const usePreferencesStore = createStore<PreferencesStore>(
  (set) => ({
    ...initialState,

    setTheme(theme) {
      set({ theme });
    },

    toggleSidebar() {
      set((state) => ({ sidebar: state.sidebar === "expanded" ? "collapsed" : "expanded" }));
    },

    setSidebar(sidebar) {
      set({ sidebar });
    },

    setFontSize(fontSize) {
      set({ fontSize });
    },

    setReducedMotion(reducedMotion) {
      set({ reducedMotion });
    },

    reset() {
      set({ ...initialState });
    },
  }),
  {
    name: "preferences-store",
    persist: true,
    persistKey: "jjcet:prefs",
    partialize: (state) => ({
      theme: state.theme,
      sidebar: state.sidebar,
      fontSize: state.fontSize,
      reducedMotion: state.reducedMotion,
    }),
    devtools: true,
  },
);
