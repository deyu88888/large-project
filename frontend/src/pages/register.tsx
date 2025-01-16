import { apiClient, apiPaths } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../components/loading/circular-loader";

// ---------------------------------------------------------------

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: any) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await apiClient.post(apiPaths.USER.REGISTER, {
                username: username,
                password: password,
            });
            console.log(res);
            navigate("/login");
        } catch (error) {
            alert(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>Register</h1>
            <input
                className=""
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                className=""
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            {loading && <CircularLoader />}
            <button className="form-button" type="submit">
                Register
            </button>
        </form>
    );
}
