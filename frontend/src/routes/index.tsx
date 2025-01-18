import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import CircularLoader from "../components/loading/circular-loader";

// Lazy-loaded pages
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const NotFoundPage = lazy(() => import("../pages/NotFound"));

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
            <Suspense fallback={<CircularLoader />}>
                <Outlet />
            </Suspense>
        ),
        children: [
            {
                path: "login",
                element: (
                    <Suspense fallback={<CircularLoader />}>
                        <LoginPage />
                    </Suspense>
                ),
            },
            {
                path: "register",
                element: (
                    <Suspense fallback={<CircularLoader />}>
                        <RegisterPage />
                    </Suspense>
                ),
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
                <NotFoundPage />
            </Suspense>
        ),
    },
];

export function Routes() {
    return useRoutes(routes);
}
