import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import CircularLoader from "../components/loading/circular-loader";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";

// Lazy-loaded pages
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />;
}

// Routes Configuration
const routes = [
    // Public Home Dashboard
    {
        path: "/",
        element: (
            <Suspense fallback={<CircularLoader />}>
                <Outlet />
            </Suspense>
        ),
        children: [
            {
                index: true,
                element: (
                    <Suspense fallback={<CircularLoader />}>
                        <DashboardPage />
                    </Suspense>
                ),
            },
        ],
    },
    // Public Routes for Login and Registration
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
        ],
    },
    // Logout Route
    {
        path: "logout",
        element: <Logout />,
    },
    // Catch-All for 404
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
