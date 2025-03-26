import { create } from "zustand";
export const useAuthStore = create((set) => ({
    user: null,
    loading: true, // Default to true until user data is fetched
    setUser: (user) => {
        set({ user });
    },
    setLoading: (isLoading) => set({ loading: isLoading }),
    clearUser: () => set({ user: null }),
}));
