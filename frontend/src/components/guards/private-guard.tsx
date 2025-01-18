import { Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { LoadingView } from "../loading/loading-view";
import { jwtDecode } from "jwt-decode";

export function PrivateGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState({
    isAuthorized: null as boolean | null,
    loading: true,
  });
  const { setUser } = useAuthStore();

  const authenticate = useCallback(async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) throw new Error("No access token available");

      const isTokenValid = await validateToken(token);
      if (!isTokenValid) await handleTokenRefresh();

      const userData = await fetchUserData();
      setUser(userData);

      setAuthState({ isAuthorized: true, loading: false });
    } catch (error) {
      console.error("Authentication failed:", error);
      setAuthState({ isAuthorized: false, loading: false });
    }
  }, [setUser]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  const validateToken = async (token: string): Promise<boolean> => {
    const { exp: tokenExpiration } = jwtDecode<{ exp: number }>(token);
    const now = Date.now() / 1000;
    return !!tokenExpiration && tokenExpiration > now;
  };

  const handleTokenRefresh = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await apiClient.post(apiPaths.USER.REFRESH, {
      refresh: refreshToken,
    });
    if (response.status === 200 && response.data?.access) {
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
    } else {
      throw new Error("Failed to refresh token");
    }
  };

  const fetchUserData = async () => {
    const response = await apiClient.get(apiPaths.USER.CURRENT);
    if (response.data) {
      return response.data;
    } else {
      throw new Error("User data not found");
    }
  };

  if (authState.loading) {
    return <LoadingView />;
  }

  return authState.isAuthorized ? children : <Navigate to="/login" />;
}
