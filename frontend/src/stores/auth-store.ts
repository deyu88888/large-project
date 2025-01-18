import { create } from "zustand";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role: string;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user: User) => set({ user }),
  clearUser: () => set({ user: null }),
}));
