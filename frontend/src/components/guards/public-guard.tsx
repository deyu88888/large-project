import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Make sure you use the default export
import { ACCESS_TOKEN } from "../../constants";
import { useEffect, useState } from "react";
import { LoadingView } from "../loading/loading-view";
import { useAuthStore } from "../../stores/auth-store";

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("%c[PublicGuard] Starting authentication check...", "color: blue; font-weight: bold;");
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        try {
          console.log("%c[PublicGuard] Found access token:", "color: green;", token);
          const decoded = jwtDecode<{ exp: number }>(token);
          const tokenExpiration = decoded.exp;
          const now = Date.now() / 1000;
          console.log("%c[PublicGuard] Token expiration time:", "color: blue;", tokenExpiration);
          console.log("%c[PublicGuard] Current time:", "color: blue;", now);

          if (tokenExpiration && tokenExpiration > now) {
            // Optionally: fetch and set user data here if not already available.
            console.log("%c[PublicGuard] Token is valid. User is authorized.", "color: green;");
            setIsAuthorized(true);
            return;
          } else {
            console.warn("%c[PublicGuard] Token is expired. Removing token.", "color: orange;");
            localStorage.removeItem(ACCESS_TOKEN);
          }
        } catch (error) {
          console.error("%c[PublicGuard] Failed to decode token:", "color: red;", error);
        }
      } else {
        console.log("%c[PublicGuard] No access token found.", "color: orange;");
      }
      console.log("%c[PublicGuard] User is unauthorized.", "color: red;");
      setIsAuthorized(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    console.log("%c[PublicGuard] Authorization state updated:", "color: purple;", isAuthorized);
  }, [isAuthorized]);

  if (isAuthorized === null) {
    console.log("%c[PublicGuard] Waiting for authentication check...", "color: orange;");
    return <LoadingView />;
  }

  if (isAuthorized) {
    // Wait for user data to be populated before redirecting.
    if (!user) {
      return <LoadingView />;
    }

    // Now that we know the user object exists, redirect based on role.
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "student") {
      return <Navigate to="/student" replace />;
    }
    // Fallback (if role is not defined)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
