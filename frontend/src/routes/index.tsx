import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";

// Lazy-loaded pages
const HomePage = lazy(() => import("../pages/home"));
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));
const StudentDashboard = lazy(() => import("../pages/student-dashboard"));

// Admin pages
const AdminHomePage = lazy(() => import("../pages/Admin/AdminHome"));
const EventListPage = lazy(() => import("../pages/Admin/EventList"));
const SocietyListPage = lazy(() => import("../pages/Admin/SocietyList"));
const SocietyListRejectPage = lazy(() => import("../pages/Admin/SocietyListReject"));
const StudentListPage = lazy(() => import("../pages/Admin/StudentList"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const CreateAdminPage = lazy(() => import("../pages/Admin/CreateAdmin"));
const RequestSocietyPage = lazy(() => import("../pages/Admin/PendingSocietyRequest"));
// const RejectedEventListPage = lazy(() => import("../pages/Admin/EventListRejected"));

function Logout() {
  localStorage.clear();
  return <Navigate to="/" />;
}

// Routes Configuration
const routes = [
  {
    path: "/",
    element: (
      <PrivateGuard>
        <Suspense fallback={<LoadingView />}>
          <Outlet />
        </Suspense>
      </PrivateGuard>
    ),
    children: [
      {
        path: "home",
        element: <HomePage />,
      },
      {
        path: "admin-home",
        element: <AdminHomePage />,
      },
      {
        path: "event-list",
        element: <EventListPage />,
      },
      {
        path: "society-list",
        element: <SocietyListPage />,
      },
      {
        path: "society-list-rejected",
        element: <SocietyListRejectPage />,
      },
      {
        path: "student-list",
        element: <StudentListPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "create-admin",
        element: <CreateAdminPage />,
      },
      {
        path: "request-society",
        element: <RequestSocietyPage />,
      },
      {
        path: "student-dashboard",
        element: (
          <Suspense fallback={<LoadingView />}>
            <StudentDashboard />
          </Suspense>
        ),
      },
      {
        path: "logout",
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
          <Suspense fallback={<LoadingView />}>
            <Navigate to="/" replace />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/",
    element: (
      <PublicGuard>
        <Suspense fallback={<LoadingView />}>
          <Outlet />
        </Suspense>
      </PublicGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "event-list",
        element: <EventListPage />,
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingView />}>
        <NotFound />
      </Suspense>
    ),
  },
];

export function Routes() {
  return useRoutes(routes);
}
