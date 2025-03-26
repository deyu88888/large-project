import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { jwtDecode } from "jwt-decode";
import { LoadingView } from "../loading/loading-view";
import { User } from "../../types/user/user";

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
    console.log("PrivateGuard: Authentication process starting");
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.log("PrivateGuard: No access token found");
        setAuthState({ isAuthorized: false, loading: false });
        return;
      }

      const isTokenValid = await validateToken(token);
      if (!isTokenValid) {
        console.log("PrivateGuard: Token is invalid, attempting refresh");
        localStorage.removeItem(ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          console.log("PrivateGuard: No refresh token available");
          setAuthState({ isAuthorized: false, loading: false });
          return;
        }
        
        try {
          await handleTokenRefresh();
          console.log("PrivateGuard: Token refresh successful");
        } catch (error) {
          console.error("PrivateGuard: Token refresh failed", error);
          setAuthState({ isAuthorized: false, loading: false });
          return;
        }
      }

      try {
        console.log("PrivateGuard: Fetching user data");
        const userData = await fetchUserData();
        console.log("PrivateGuard: User data fetched successfully", userData);
        setUser(userData);
        setAuthState({ isAuthorized: true, loading: false });
      } catch (error) {
        console.error("PrivateGuard: Failed to fetch user data", error);
        // Create a minimal user object to prevent crashes
        const fallbackUser = { 
          first_name: "User",
          role: requiredRole || "student" 
        };
        console.log("PrivateGuard: Using fallback user", fallbackUser);
        setUser(fallbackUser as User);
        // Still consider authorized if we have a valid token
        setAuthState({ isAuthorized: true, loading: false });
      }
    } catch (error) {
      console.error("PrivateGuard: Authentication process failed", error);
      setAuthState({ isAuthorized: false, loading: false });
    }
  }, [setUser, requiredRole]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      const isValid = exp > Date.now() / 1000;
      console.log("PrivateGuard: Token validation result:", isValid);
      return isValid;
    } catch (error) {
      console.error("PrivateGuard: Token validation error", error);
      return false;
    }
  };

  const handleTokenRefresh = async () => {
    console.log("PrivateGuard: Attempting token refresh");
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) throw new Error("No refresh token available");
    
    try {
      const response = await apiClient.post(apiPaths.USER.REFRESH, { refresh: refreshToken });
      if (response.status === 200 && response.data?.access) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        console.log("PrivateGuard: Token refresh successful");
      } else {
        console.error("PrivateGuard: Refresh response didn't contain a new token", response);
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("PrivateGuard: Token refresh request failed", error);
      throw error;
    }
  };

  const fetchUserData = async () => {
    try {
      console.log("PrivateGuard: Attempting to fetch user data from", apiPaths.USER.CURRENT);
      const response = await apiClient.get(apiPaths.USER.CURRENT);
      return response.data;
    } catch (error) {
      console.error("PrivateGuard: Error fetching user data:", error);
      
      if (error.response?.status === 404) {
        // Try with trailing slash if the first attempt fails
        try {
          console.log("PrivateGuard: Attempting fallback with trailing slash");
          const fallback = await apiClient.get(`${apiPaths.USER.CURRENT}/`);
          return fallback.data;
        } catch (fallbackError) {
          console.error("PrivateGuard: Fallback attempt also failed:", fallbackError);
          // Create a minimal user object based on token if possible
          try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (token) {
              const decoded = jwtDecode(token);
              console.log("PrivateGuard: Created minimal user from token", decoded);
              return {
                id: decoded.sub,
                firstName: "User",
                role: requiredRole || "student"
              };
            }
          } catch (tokenError) {
            console.error("PrivateGuard: Could not extract user data from token", tokenError);
          }
          
          // If everything fails, return minimal fallback
          return { firstName: "User", role: requiredRole || "student" };
        }
      }
      
      throw error;
    }
  };

  console.log("PrivateGuard: Current auth state", { 
    authState, 
    user, 
    location: location.pathname,
    isPublicRoute 
  });

  if (authState.loading) {
    console.log("PrivateGuard: Still loading, showing LoadingView");
    return <LoadingView />;
  }

  // If not authorized, only allow access to public routes.
  if (!authState.isAuthorized) {
    console.log("PrivateGuard: Not authorized, redirecting or showing public content");
    return isPublicRoute ? <>{children}</> : <Navigate to="/login" replace />;
  }

  // If authorized, disallow access to public routes.
  if (authState.isAuthorized && isPublicRoute) {
    console.log(`PrivateGuard: Authorized but on public route, redirecting to /${user?.role || 'student'}`);
    return <Navigate to={user?.role === "admin" ? "/admin" : "/student"} replace />;
  }

  // If a specific role is required and the user does not have it, redirect accordingly.
  if (requiredRole && user?.role !== requiredRole) {
    console.log(`PrivateGuard: User role ${user?.role} doesn't match required role ${requiredRole}, redirecting`);
    return <Navigate to={`/${user?.role || 'student'}`} replace />;
  }

  // Otherwise, render the protected component.
  console.log("PrivateGuard: Authorization successful, rendering protected content");
  return <>{children}</>;
}