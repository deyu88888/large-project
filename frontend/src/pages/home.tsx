import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { useEffect } from "react";

// ------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  useEffect(() => {
    console.log("user", user);
    if (user?.role==="student"){
        navigate("/student-dashboard");
    } else if (user?.role==="admin"){ 
        navigate("/admin-dashboard");
    }
    
  }, [user]);
  
    return (
        <div className="flex flex-col gap-4">
            <div>user: {user?.username}</div>
            <button className="btn bg-teal-500" onClick={logout}>
                logout
            </button>
            <button className="btn bg-teal-500" onClick={() => {
                navigate("/profile");
            }}>
                profile
            </button>
        </div>
    );
}