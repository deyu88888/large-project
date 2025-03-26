declare const useAuthCheck: () => {
    isAuthenticated: boolean | null;
    user: any;
};
export default useAuthCheck;
