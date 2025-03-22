import { useAuthStore } from "../../stores/auth-store";
import { LoadingView } from "../loading/loading-view";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (user?.role === "admin" && !loading) {
      navigate("/admin", { replace: true });
    } else if (user?.role === "student" && !loading) {
      navigate("/student", { replace: true });
    }
  }, [user, navigate, loading]);

  if (loading) {
    return <LoadingView />;
  }

  return <>{!user ? children : null}</>;
}
