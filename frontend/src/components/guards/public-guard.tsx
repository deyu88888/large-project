import { Navigate } from "react-router-dom";
import CircularLoader from "../loading/circular-loader";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../../constants";
import { useEffect, useState } from "react";

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
        return <CircularLoader />;
    }

    return isAuthorized ? <Navigate to="/" replace /> : <>{children}</>;
}
