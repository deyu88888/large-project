import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { useEffect } from "react";
import { apiClient, apiPaths } from "../api";

export default function HomePage() {
    const navigate = useNavigate();

    const { user } = useAuthStore();

    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };


useEffect(()=> {
    async function current() {
        const response = await apiClient.get(apiPaths.USER.CURRENT)
    }
    current()
},[])

    return (
        <div className="flex flex-col gap-4">
            <div>user: {user?.username}</div>
            <button className="btn bg-teal-500" onClick={logout}>
                logout
            </button>
        </div>
    );
}
