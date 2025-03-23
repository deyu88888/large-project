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

  // Public routes: Only unauthenticated users should be allowed here.
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Authenticate the user by validating token and fetching user data.
  const authenticate = useCallback(async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setAuthState({ isAuthorized: false, loading: false });
        return;
      }

      const isTokenValid = await validateToken(token);
      if (!isTokenValid) {
        localStorage.removeItem(ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          setAuthState({ isAuthorized: false, loading: false });
          return;
        }
        try {
          await handleTokenRefresh();
        } catch (error) {
          setAuthState({ isAuthorized: false, loading: false });
          return;
        }
      }

      try {
        const userData = await fetchUserData();
        setUser(userData);
        setAuthState({ isAuthorized: true, loading: false });
      } catch (error) {
        setAuthState({ isAuthorized: false, loading: false });
      }
    } catch (error) {
      setAuthState({ isAuthorized: false, loading: false });
    }
  }, [setUser]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

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

  // If not authorized, only allow access to public routes.
  if (!authState.isAuthorized) {
    return isPublicRoute ? <>{children}</> : <Navigate to="/" replace />;
  }

  // If authorized, disallow access to public routes.
  if (authState.isAuthorized && isPublicRoute) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/student"} replace />;
  }

  // If a specific role is required and the user does not have it, redirect accordingly.
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  // Otherwise, render the protected component.
  return <>{children}</>;
}