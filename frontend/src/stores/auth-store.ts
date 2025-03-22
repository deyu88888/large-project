import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role: string;
  is_president?: boolean;
  is_vice_president: boolean;
  vice_president_of_society?: number;
  is_event_manager?: boolean;
  event_manager_of_society?: number;
  is_super_admin: boolean;
  icon?: string;
  major?: string;
  societies?: string[];
  president_of?: number;
  president_of_society_name?: string;
}

interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;

  refreshToken: string | null;
  setRefreshToken: (token: string) => void;

  user: User | null;
  setUser: (user: User | null) => void;

  loading: boolean;
  setLoading: (isLoading: boolean) => void;

  reset: () => void;

  resetAccessToken: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token: string | null) => {
        set({ token });
      },
      //
      refreshToken: null,
      setRefreshToken: (refreshToken: string | null) => {
        set({ refreshToken });
      },
      //
      user: null,
      setUser: (user: User | null) => {
        set({ user });
      },
      //
      loading: false,
      setLoading: (loading) => set({ loading: loading }),
      //
      reset: () => set({ user: null, token: null, refreshToken: null }),
      //
      resetAccessToken: () => set({ token: null }),
    }),
    {
      name: "app-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
