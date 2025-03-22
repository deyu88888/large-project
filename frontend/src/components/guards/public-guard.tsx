import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../../constants";
import { useEffect, useState } from "react";
import { LoadingView } from "../loading/loading-view";
import { useAuthStore } from "../../stores/auth-store";

// Decode helper that works with both CJS and ESM formats
const decodeToken = async (
  token: string
): Promise<{ exp: number; user_id: number; role?: string }> => {
  const mod = await import("jwt-decode");
  const jwtDecode = mod.default || mod.jwtDecode || mod;
  if (typeof jwtDecode !== "function") {
    throw new Error("jwtDecode is not a function");
  }
  return jwtDecode(token);
};

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      console.log(
        "%c[PublicGuard] Starting authentication check...",
        "color: blue; font-weight: bold;"
      );
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        try {
          console.log("%c[PublicGuard] Found access token:", "color: green;", token);
          const decoded = await decodeToken(token);
          const tokenExpiration = decoded.exp;
          const now = Date.now() / 1000;

          console.log("%c[PublicGuard] Token expiration time:", "color: blue;", tokenExpiration);
          console.log("%c[PublicGuard] Current time:", "color: blue;", now);

          if (tokenExpiration > now) {
            console.log("%c[PublicGuard] Token is valid. User is authorized.", "color: green;");

            // Set minimal user if not already set
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
            console.warn("%c[PublicGuard] Token expired. Removing it.", "color: orange;");
            localStorage.removeItem(ACCESS_TOKEN);
          }
        } catch (error) {
          console.error("%c[PublicGuard] Failed to decode token:", "color: red;", error);
        }
      } else {
        console.log("%c[PublicGuard] No token found.", "color: orange;");
      }

      console.log("%c[PublicGuard] User is unauthorized.", "color: red;");
      setIsAuthorized(false);
    };

    checkAuth();
  }, [setUser, user]);

  useEffect(() => {
    console.log("%c[PublicGuard] Authorization state updated:", "color: purple;", isAuthorized);
  }, [isAuthorized]);

  if (isAuthorized === null) {
    return <LoadingView />;
  }

  if (isAuthorized) {
    if (!user) return <LoadingView />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "student") return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}