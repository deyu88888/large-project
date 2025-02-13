import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SettingsState = {
  drawer: boolean;
  toggleDrawer: VoidFunction;
  //
  themeMode: "light" | "dark";
  setThemeMode: (mode: "light" | "dark") => void;
  toggleThemeMode: VoidFunction;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
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
      setThemeMode: (mode: "light" | "dark") => {
        set({
          themeMode: mode,
        });
      },
      toggleThemeMode: () => {
        const { themeMode } = get();
        set({ themeMode: themeMode === "dark" ? "light" : "dark" });
      },
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
