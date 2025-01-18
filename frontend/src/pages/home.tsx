import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";

export default function HomePage() {
  const navigate = useNavigate();

  const { user } = useAuthStore();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  const goDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col gap-4">
      <div>{JSON.stringify(user)}</div>

      <button className="btn" onClick={goDashboard}>
        Dashboard
      </button>

      <button className="btn bg-teal-500" onClick={logout}>
        logout
      </button>
    </div>
  );
}
