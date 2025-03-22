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
    console.log("[PrivateGuard] Starting authentication for path:", location.pathname);
    
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      console.log("[PrivateGuard] Token exists:", !!token);
      
      // For the home page (dashboard), allow access even without a token
      if (location.pathname === "/" && !token) {
        console.log("[PrivateGuard] Public dashboard access detected");
        setAuthState({ isAuthorized: false, loading: false });
        return;
      }
      
      if (!token) {
        console.log("[PrivateGuard] No token available, will redirect");
        throw new Error("No access token available");
      }
      
      // Validate token
      const isTokenValid = await validateToken(token);
      console.log("[PrivateGuard] Token valid:", isTokenValid);
      
      if (!isTokenValid) {
        try {
          await handleTokenRefresh();
        } catch (error) {
          console.error("[PrivateGuard] Failed to refresh token:", error);
          // For dashboard, continue even with invalid token
          if (location.pathname === "/") {
            setAuthState({ isAuthorized: false, loading: false });
            return;
          }
          throw error;
        }
      }
      
      // For dashboard, we can skip user data since the endpoint is missing
      if (location.pathname === "/") {
        console.log("[PrivateGuard] Skip user data fetch for dashboard");
        setAuthState({ isAuthorized: true, loading: false });
        return;
      }
      
      // For other routes, attempt to get user data, but handle 404 gracefully
      try {
        const userData = await fetchUserData();
        console.log("[PrivateGuard] User data fetched:", userData);
        setUser(userData);
        setAuthState({ isAuthorized: true, loading: false });
      } catch (error) {
        console.error("[PrivateGuard] Error fetching user data:", error);
        
        // If we get a 404, create a basic user object from the token
        if (error.response && error.response.status === 404) {
          try {
            // Extract user ID from token
            const { user_id } = jwtDecode<{ user_id: number }>(token);
            console.log("[PrivateGuard] Creating minimal user data from token, user_id:", user_id);
            
            // Create minimal user object
            const minimalUser = {
              id: user_id,
              // Default to student role if we can't determine
              role: "student"
            };
            
            setUser(minimalUser);
            setAuthState({ isAuthorized: true, loading: false });
            return;
          } catch (tokenError) {
            console.error("[PrivateGuard] Failed to create user from token:", tokenError);
          }
        }
        
        throw error;
      }
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
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (authState.loading) {
        console.log("[PrivateGuard] Authentication timed out, allowing access to dashboard");
        setAuthState({ isAuthorized: false, loading: false });
      }
    }, 5000);
    
    authenticate();
    
    return () => {
      clearTimeout(timeoutId);
    };
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
    try {
      const response = await apiClient.get(apiPaths.USER.CURRENT);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Fallback to trailing slash if somehow needed
        try {
          const response = await apiClient.get(`${apiPaths.USER.CURRENT}/`);
          return response.data;
        } catch (innerError) {
          console.error("[PrivateGuard] Both endpoints failed:", innerError);
          throw error;
        }
      }
      throw error;
    }
  };
  
  if (authState.loading) {
    return <LoadingView />;
  }
  
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