import { Navigate, useLocation } from "react-router-dom";
import { ACCESS_TOKEN } from "../../constants";
import { useEffect, useState } from "react";
import { LoadingView } from "../loading/loading-view";
import { useAuthStore } from "../../stores/auth-store";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  user_id: number;
  role?: string;
}

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { user, setUser } = useAuthStore();
  const location = useLocation();

  // Helper to decode the token
  const decodeToken = (token: string): DecodedToken => {
    // Removed async since jwtDecode is synchronous
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("PublicGuard: Token decode error:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("PublicGuard: Checking authentication state");
    
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      console.log("PublicGuard: Token exists:", !!token);
      
      if (token) {
        try {
          const decoded = decodeToken(token);
          const now = Date.now() / 1000;
          const isValid = decoded.exp > now;
          
          console.log("PublicGuard: Token validation:", {
            expiration: new Date(decoded.exp * 1000).toLocaleString(),
            now: new Date(now * 1000).toLocaleString(),
            isValid
          });
          
          if (isValid) {
            // Set minimal user details if not already set
            if (!user) {
              const minimalUser = {
                id: decoded.user_id,
                username: "",
                first_name: "",
                last_name: "",
                email: "",
                is_active: true,
                role: decoded.role || "student",
                is_president: false,
                is_vice_president: false,
                is_super_admin: false,
              };
              
              console.log("PublicGuard: Setting minimal user from token:", minimalUser);
              setUser(minimalUser);
            } else {
              console.log("PublicGuard: User already exists in store:", user);
            }
            
            setIsAuthorized(true);
            return;
          } else {
            console.log("PublicGuard: Token expired, removing from storage");
            localStorage.removeItem(ACCESS_TOKEN);
          }
        } catch (error) {
          console.error("PublicGuard: Failed to decode token:", error);
          localStorage.removeItem(ACCESS_TOKEN);
        }
      }
      
      console.log("PublicGuard: Not authorized");
      setIsAuthorized(false);
    };
    
    checkAuth();
  }, [setUser, user]);

  console.log("PublicGuard: Current state", {
    isAuthorized,
    user,
    pathname: location.pathname
  });

  // While checking auth state, show a loading indicator.
  if (isAuthorized === null) {
    console.log("PublicGuard: Still determining auth state, showing loading view");
    return <LoadingView />;
  }

  // If authenticated, always redirect to dashboard
  if (isAuthorized) {
    if (!user) {
      console.log("PublicGuard: Authorized but no user data, showing loading view");
      return <LoadingView />;
    }
    
    if (user.role === "admin") {
      console.log("PublicGuard: Redirecting admin user to /admin");
      return <Navigate to="/admin" replace />;
    }
    
    if (user.role === "student") {
      console.log("PublicGuard: Redirecting student user to /student");
      return <Navigate to="/student" replace />;
    }
    
    console.log("PublicGuard: User has unknown role, redirecting to root");
    return <Navigate to="/" replace />;
  }
  
  // If not authenticated, render the public pages (home, login, register, etc.)
  console.log("PublicGuard: Not authorized, rendering public content");
  return <>{children}</>;
}