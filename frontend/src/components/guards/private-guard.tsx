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

  const authenticate = useCallback(async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      // For the home page (dashboard), allow access even without a token
      if (location.pathname === "/" && !token) {
        console.log("[PrivateGuard] Public dashboard access detected");
        setAuthState({ isAuthorized: false, loading: false });
        return;
      }
      
      if (!token) throw new Error("No access token available");
      
      const isTokenValid = await validateToken(token);
      if (!isTokenValid) await handleTokenRefresh();
      
      const userData = await fetchUserData();
      console.log("%c[PrivateGuard] User data fetched:", "color: green;", userData);
      setUser(userData);
      setAuthState({ isAuthorized: true, loading: false });
    } catch (error) {
      console.error("[PrivateGuard] Authentication failed:", error);
      
      // For the home page (dashboard), allow access even with authentication errors
      if (location.pathname === "/") {
        console.log("[PrivateGuard] Allowing public access to dashboard despite auth failure");
        setAuthState({ isAuthorized: false, loading: false });
      } else {
        setAuthState({ isAuthorized: false, loading: false });
      }
    }
  }, [setUser, location.pathname]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const { exp: tokenExpiration } = jwtDecode<{ exp: number }>(token);
      return tokenExpiration > Date.now() / 1000;
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
    const response = await apiClient.get(apiPaths.USER.CURRENT);
    return response.data;
  };

  if (authState.loading) return <LoadingView />;

  // Always allow access to main dashboard even without auth
  if (location.pathname === "/" && !authState.isAuthorized) {
    return <>{children}</>;
  }

  // For other private routes that require a role, redirect to login if not authenticated
  if (!authState.isAuthorized) {
    // Don't redirect from dashboard
    if (location.pathname === "/") {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if the user has the role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  // Redirect from home page to role-specific dashboard if authenticated
  if (location.pathname === "/" && user?.role) {
    const roleRedirect = user.role === "admin" ? "/admin" : "/student";
    return <Navigate to={roleRedirect} replace />;
  }

  return <>{children}</>;
}