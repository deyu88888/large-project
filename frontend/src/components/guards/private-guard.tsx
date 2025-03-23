import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { jwtDecode } from "jwt-decode";
import { LoadingView } from "../loading/loading-view";

type UserRole = "admin" | "student";

interface PrivateGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function PrivateGuard({ children, requiredRole }: PrivateGuardProps) {
  const [authState, setAuthState] = useState({
    isAuthorized: false,
    loading: true,
  });

  const { user, setUser } = useAuthStore();
  const location = useLocation();
  const isPublicDashboard = location.pathname === "/";

  const authenticate = useCallback(async () => {
    console.log("[PrivateGuard] Starting authentication for path:", location.pathname);

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      console.log("[PrivateGuard] Token exists:", !!token);

      if (!token) {
        if (isPublicDashboard) {
          console.log("[PrivateGuard] No token - public dashboard access");
          setAuthState({ isAuthorized: false, loading: false });
          return;
        }
        throw new Error("No access token available");
      }

      const isTokenStillValid = await validateToken(token);
      console.log("[PrivateGuard] Token valid:", isTokenStillValid);

      if (!isTokenStillValid) {
        localStorage.removeItem(ACCESS_TOKEN); // Remove expired token

        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          if (isPublicDashboard) {
            console.log("[PrivateGuard] No refresh token - treating as guest");
            setAuthState({ isAuthorized: false, loading: false });
            return;
          }
          throw new Error("No refresh token available");
        }

        try {
          await handleTokenRefresh();
        } catch (error) {
          console.error("[PrivateGuard] Failed to refresh token:", error);
          if (isPublicDashboard) {
            setAuthState({ isAuthorized: false, loading: false });
            return;
          }
          throw error;
        }
      }

      if (isPublicDashboard) {
        console.log("[PrivateGuard] Public dashboard authenticated access");
        setAuthState({ isAuthorized: true, loading: false });
        return;
      }

      try {
        const userData = await fetchUserData();
        console.log("[PrivateGuard] User data fetched:", userData);
        setUser(userData);
        setAuthState({ isAuthorized: true, loading: false });
      } catch (error) {
        console.error("[PrivateGuard] Error fetching user data:", error);

        if (error.response?.status === 404) {
          try {
            const { user_id } = jwtDecode<{ user_id: number }>(token);
            setUser({ id: user_id, role: "student" });
            setAuthState({ isAuthorized: true, loading: false });
            return;
          } catch (err) {
            console.error("[PrivateGuard] Token decode failed:", err);
          }
        }

        throw error;
      }
    } catch (error) {
      console.error("[PrivateGuard] Authentication failed:", error);
      setAuthState({ isAuthorized: false, loading: false });
    }
  }, [setUser, isPublicDashboard]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authState.loading) {
        console.log("[PrivateGuard] Timeout - fallback to guest for dashboard");
        setAuthState({ isAuthorized: false, loading: false });
      }
    }, 5000);

    authenticate();

    return () => clearTimeout(timeoutId);
  }, [authenticate, authState.loading]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  const handleTokenRefresh = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await apiClient.post(apiPaths.USER.REFRESH, { refresh: refreshToken });

    if (response.status === 200 && response.data?.access) {
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
    } else {
      throw new Error("Failed to refresh token");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get(apiPaths.USER.CURRENT);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const fallback = await apiClient.get(`${apiPaths.USER.CURRENT}/`);
        return fallback.data;
      }
      throw error;
    }
  };

  if (authState.loading) return <LoadingView />;

  if (isPublicDashboard && !authState.isAuthorized) {
    return <>{children}</>;
  }

  if (!authState.isAuthorized) {
    return isPublicDashboard ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  if (isPublicDashboard && user?.role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  }

  return <>{children}</>;
}