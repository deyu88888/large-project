import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { Link } from "react-router";

// ------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };
    const { user, setUser } = useAuthStore();

  //   useEffect(() => {
  //     async function current() {
  //         const response = await apiClient.get(apiPaths.USER.CURRENT);
  //         console.log(response.data);
  //         setUser(response.data);
  //     }
  //     current()
  // }, []);
  // return (
  //   <div className="flex flex-col gap-4 container p-4">
  //     <div>user: {user?.username}</div>



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
