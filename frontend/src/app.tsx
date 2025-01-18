import { BrowserRouter } from "react-router-dom";
import { Routes } from "./routes";
import React, { useEffect } from "react";
import { useAuthStore } from "./stores/auth-store"; 
import axios from "axios";
import Spinner from "./components/loading/Spinner";

export const apiClient = axios.create({
    baseURL: "http://localhost:8000", 
    headers: {
        "Content-Type": "application/json",
    },
});


export function App() {
    const { setUser, setLoading, loading } = useAuthStore();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get("/api/user/me"); // End point for global callout
                setUser(response.data); // Store user in the global state
            } catch (error) {
                console.error("Failed to fetch user:", error);
                setUser(null); // Clear user on error or if unauthenticated
            } finally {
                setLoading(false); // Set loading to false regardless of success or error
            }
        };

        fetchUser();
    }, [setUser, setLoading]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }
    return (
        <BrowserRouter>
            <Routes />
        </BrowserRouter>
    );
}
