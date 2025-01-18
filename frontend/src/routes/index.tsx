import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import CircularLoader from "../components/loading/circular-loader";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";

// Lazy-loaded pages
const HomePage = lazy(() => import("../pages/home"));
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />;
}

// Routes Configuration
const routes = [
    {
        path: "/",
        element: (
            <PrivateGuard>
                <Suspense fallback={<CircularLoader />}>
                    <Outlet />
                </Suspense>
            </PrivateGuard>
        ),
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "logout",
                element: (
                    <Suspense fallback={<CircularLoader />}>
                        <Navigate to="/login" replace />
                    </Suspense>
                ),
            },
            {
                path: "profile",
                element: <ProfilePage />,
            },
        ],
    },
    {
        path: "/",
        element: (
            <PublicGuard>
                <Suspense fallback={<CircularLoader />}>
                    <Outlet />
                </Suspense>
            </PublicGuard>
        ),
        children: [
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            },
            {
                path: "logout",
                element: <Logout />,
            },
        ],
    },
    {
        path: "*",
        element: (
            <Suspense fallback={<CircularLoader />}>
                <NotFound />
            </Suspense>
        ),
    },
];

export function Routes() {
    return useRoutes(routes);
}
