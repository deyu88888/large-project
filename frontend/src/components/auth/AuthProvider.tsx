import { useAuthStore } from "../../stores/auth-store";
import { apiClient, apiPaths } from "../../api";
import { AuthContext } from "./AuthContext";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router-dom";

// ----------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { token, setUser, setLoading, reset, refreshToken, resetAccessToken } =
    useAuthStore();

  // ------------------------------------------------

  const currentSessionQuery = useQuery({
    queryKey: ["user.current"],
    queryFn: async () => {
      setLoading(true);
      return await apiClient.get(apiPaths.USER.CURRENT);
    },
    onSettled: () => setLoading(false),
    onSuccess: (res) => {
      setUser(res.data);
    },
    onError: () => {
      resetAccessToken();
    },
    enabled: token !== null,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      reset();
      return Promise.resolve();
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  // ------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        currentSessionQuery,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
