import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
export const useSettingsStore = create()(persist((set, get) => ({
    // Drawer
    drawer: true,
    toggleDrawer: () => {
        const { drawer } = get();
        set({
            drawer: !drawer,
        });
    },
    // Theme
    themeMode: "light",
    setThemeMode: (mode) => {
        set({
            themeMode: mode,
        });
    },
    toggleThemeMode: () => {
        const { themeMode } = get();
        set({ themeMode: themeMode === "dark" ? "light" : "dark" });
    },
}), {
    name: "app-settings",
    storage: createJSONStorage(() => localStorage),
}));
