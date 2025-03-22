import { useAuthStore } from "../../stores/auth-store";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LoadingView } from "../loading/loading-view";
import { jwtDecode } from "jwt-decode";
import { useMutation } from "react-query";
import { apiClient, apiPaths } from "../../api";
import { useAuthContext } from "../auth/AuthContext";

const validateToken = (token: string): boolean => {
  try {
    const { exp: tokenExpiration } = jwtDecode<{ exp: number }>(token);
    return tokenExpiration > Date.now() / 1000;
  } catch {
    return false;
  }
};

interface PrivateGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "student";
}

export function PrivateGuard({ children, requiredRole }: PrivateGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, token, setToken, refreshToken, user, setLoading } =
    useAuthStore();
  const { currentSessionQuery } = useAuthContext();

  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      if (!refreshToken) throw new Error("No refresh token available");
      setLoading(true);
      return await apiClient.post(apiPaths.USER.REFRESH, {
        refresh: refreshToken,
      });
    },
    onSettled: () => setLoading(false),
    onSuccess: (response) => {
      setToken(response.data.access);
    },
    onError: () => {
      console.error("[PrivateGuard] Token refresh failed");
      navigate("/login", { replace: true });
    },
  });

  useEffect(() => {
    const checkAuth = () => {
      if (!token && !refreshToken) {
        navigate("/login", { replace: true });
        return;
      }

      if (!token || !validateToken(token)) {
        if (!refreshTokenMutation.isLoading) {
          refreshTokenMutation.mutate();
        }
      }
    };

    if (!loading) {
      checkAuth();
    }
  }, [token, loading, refreshToken, refreshTokenMutation.isLoading, navigate]);

  // Show a loading state while checking authentication
  if (
    loading ||
    refreshTokenMutation.isLoading ||
    currentSessionQuery.isFetching
  ) {
    return <LoadingView />;
  }

  // Show loading if we have a valid token but no user data yet
  if (!user && token) {
    return <LoadingView />;
  }

  // Role-based access check with a correct template literal
  if (requiredRole && user && requiredRole !== user.role) {
    return <Navigate to={user.role ? `/${user.role}` : "/login"} replace />;
  }

  // Redirect root path based on user role
  if (location.pathname === "/" && user?.role) {
    const roleRedirect = user.role === "admin" ? "/admin" : "/student";
    return <Navigate to={roleRedirect} replace />;
  }

  return <>{children}</>;
}
