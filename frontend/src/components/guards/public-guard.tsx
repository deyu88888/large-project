import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../constants";
import { useEffect, useState } from "react";
import { LoadingView } from "../loading/loading-view";

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);

      if (token) {
        try {
          const decoded = jwtDecode(token);
          const tokenExpiration = decoded.exp;
          const now = Date.now() / 1000;

          if (tokenExpiration && tokenExpiration > now) {
            setIsAuthorized(true);
            return;
          }
        } catch (error) {
          console.log("Invalid token", error);
        }
      }

      setIsAuthorized(false);
    };

    checkAuth();
  }, []);

  if (isAuthorized === null) {
    return <LoadingView />;
  }

  return isAuthorized ? <Navigate to="/" replace /> : <>{children}</>;
}
