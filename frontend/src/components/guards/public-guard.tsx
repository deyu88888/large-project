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
  const decodeToken = async (token: string): Promise<DecodedToken> => {
    return jwtDecode<DecodedToken>(token);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        try {
          const decoded = await decodeToken(token);
          const now = Date.now() / 1000;
          if (decoded.exp > now) {
            // Set minimal user details if not already set
            if (!user) {
              setUser({
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
              });
            }
            setIsAuthorized(true);
            return;
          } else {
            localStorage.removeItem(ACCESS_TOKEN);
          }
        } catch (error) {
          console.error("PublicGuard: Failed to decode token:", error);
        }
      }
      setIsAuthorized(false);
    };

    checkAuth();
  }, [setUser, user]);

  // While checking auth state, show a loading indicator.
  if (isAuthorized === null) {
    return <LoadingView />;
  }

  // If authenticated, always redirect to dashboard
  if (isAuthorized) {
    if (!user) return <LoadingView />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "student") return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  // If not authenticated, render the public pages (home, login, register, etc.)
  return <>{children}</>;
}