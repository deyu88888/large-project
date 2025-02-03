import { Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { jwtDecode } from "jwt-decode";
import { LoadingView } from "../loading/loading-view";

export function PrivateGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState({
    isAuthorized: null as boolean | null,
    loading: true,
  });
  const { setUser } = useAuthStore();

  const authenticate = useCallback(async () => {
    console.log("%c[PrivateGuard] Starting authentication...", "color: blue; font-weight: bold;");
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.error("%c[PrivateGuard] No access token found.", "color: red;");
        throw new Error("No access token available");
      }

      const isTokenValid = await validateToken(token);
      console.log("%c[PrivateGuard] Access token validity:", "color: green;", isTokenValid);

      if (!isTokenValid) {
        console.log("%c[PrivateGuard] Access token expired. Refreshing...", "color: orange;");
        await handleTokenRefresh();
      }

      console.log("%c[PrivateGuard] Fetching user data...", "color: blue;");
      const userData = await fetchUserData();
      console.log("%c[PrivateGuard] User data fetched:", "color: green;", userData);

      setUser(userData);

      setAuthState({ isAuthorized: true, loading: false });
    } catch (error) {
      console.error("%c[PrivateGuard] Authentication failed:", "color: red;", error);
      setAuthState({ isAuthorized: false, loading: false });
    }
  }, [setUser]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const { exp: tokenExpiration } = jwtDecode<{ exp: number }>(token);
      const now = Date.now() / 1000;
      const isValid = !!tokenExpiration && tokenExpiration > now;
      console.log("%c[PrivateGuard] Token expiration time:", "color: blue;", tokenExpiration, "Current time:", now);
      return isValid;
    } catch (error) {
      console.error("%c[PrivateGuard] Error decoding token:", "color: red;", error);
      return false;
    }
  };

  const handleTokenRefresh = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) {
      console.error("%c[PrivateGuard] No refresh token found.", "color: red;");
      throw new Error("No refresh token available");
    }

    try {
      const response = await apiClient.post(apiPaths.USER.REFRESH, {
        refresh: refreshToken,
      });
      if (response.status === 200 && response.data?.access) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        console.log("%c[PrivateGuard] Token refreshed successfully.", "color: green;");
      } else {
        console.error("%c[PrivateGuard] Failed to refresh token. Response:", "color: red;", response.data);
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("%c[PrivateGuard] Error during token refresh:", "color: red;", error);
      throw error;
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get(apiPaths.USER.CURRENT);
      if (response.data) {
        console.log("%c[PrivateGuard] User data received:", "color: green;", response.data);
        return response.data;
      } else {
        console.error("%c[PrivateGuard] User data not found in response.", "color: red;");
        throw new Error("User data not found");
      }
    } catch (error) {
      console.error("%c[PrivateGuard] Error fetching user data:", "color: red;", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("%c[PrivateGuard] Auth state updated:", "color: purple;", authState);
  }, [authState]);

  if (authState.loading) {
    console.log("%c[PrivateGuard] Loading user authentication...", "color: orange;");
    return <LoadingView />;
  }

  return authState.isAuthorized ? children : <Navigate to="/login" />;
}