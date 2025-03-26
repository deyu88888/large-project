import { User } from "../types/user/user";
interface AuthStore {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    clearUser: () => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthStore>>;
export {};
