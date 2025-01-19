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
  loading: boolean; // Indicates if the user is being fetched
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true, // Default to true until user data is fetched
  setUser: (user: User | null) => set({ user }),
  setLoading: (isLoading) => set({ loading: isLoading }),
  clearUser: () => set({ user: null }),
}));
