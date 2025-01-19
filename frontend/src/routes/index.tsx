import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import CircularLoader from "../components/loading/circular-loader";
import NotFound from "../pages/404";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";

// Lazy-loaded pages
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));

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
  // Private Routes for Logged-in Users
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
        path: "profile",
        element: (
          <Suspense fallback={<CircularLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "logout",
        element: <Logout />,
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