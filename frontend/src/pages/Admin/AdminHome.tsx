import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";

import { Link } from "react-router-dom";

// ------------------------------------------------

export default function AdminHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className="flex flex-col gap-4 container p-4">
      <div>user: {user?.username}</div>

      <Link className="btn bg-slate-400 mx-auto px-4 py-2" to={"/profile"}>
        profile
      </Link>


      <Link className="btn bg-slate-400 mx-auto px-4 py-2" to={"/event-list"}>
        Event List
      </Link>


      <Link className="btn bg-slate-400 mx-auto px-4 py-2" to={"/society-list"}>
        Society List
      </Link>


      <button className="btn bg-slate-400 mx-auto px-4 py-2" onClick={logout}>
        logout
      </button>
    </div>
  );
}
