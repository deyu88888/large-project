import { create } from "zustand";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
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
