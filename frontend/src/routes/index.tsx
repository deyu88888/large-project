import { Children, lazy, Suspense, useEffect } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/circular-loader";
import Layout from "../components/Layout";

// Lazy-loaded pages
const HomePage = lazy(() => import("../pages/home"));
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));
const StudentDashboard = lazy(() => import("../pages/student-dashboard"));
const MySocieties = lazy(() => import("../pages/my-societies"));
const ViewEvents = lazy(() => import("../pages/view-events"));
const ViewNotifications = lazy(() => import("../pages/view-notifications"));
const StartSociety = lazy(() => import("../pages/start-society"));
const JoinSocietiesPage = lazy(() => import("../pages/join-societies"));

// Admin pages
const EventListPage = lazy(() => import("../pages/Admin/EventList"));
const SocietyListPage = lazy(() => import("../pages/Admin/SocietyList"));
const SocietyListRejectPage = lazy(() => import("../pages/Admin/SocietyListReject"));
const EventListRejectedPage = lazy(() => import("../pages/Admin/EventListRejected"));
const AdminDashboardPage = lazy(() => import("../pages/Admin/AdminDashboard"));
const CalendarPage = lazy(() => import("../pages/Admin/Calendar"));


const StudentListPage = lazy(() => import("../pages/Admin/StudentList"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const CreateAdminPage = lazy(() => import("../pages/Admin/CreateAdmin"));
const RequestSocietyPage = lazy(() => import("../pages/Admin/PendingSocietyRequest"));

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
        <Layout />
      </PrivateGuard>
    ),
    children: [
      {
        path: "home",
        element: <HomePage />,
      },
      {
        path: "admin",
        element: (
          <PrivateGuard>
            <Suspense fallback={<LoadingView />}>
              <Layout role="admin" />
            </Suspense>
          </PrivateGuard>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
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
            path: "event-list-rejected",
            element: <EventListRejectedPage />,
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
            path: "calendar",
            element: <CalendarPage />,
          },
          {
            path: "request-society",
            element: <RequestSocietyPage />,
          },
        ]
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
        path: "my-societies",
        element: (
          <Suspense fallback={<LoadingView />}>
            <MySocieties />
          </Suspense>
        ),
      },
      {
        path: "view-events",
        element: (
          <Suspense fallback={<LoadingView />}>
            <ViewEvents />
          </Suspense>
        ),
      },
      {
        path: "view-notifications",
        element: (
          <Suspense fallback={<LoadingView />}>
            <ViewNotifications />
          </Suspense>
        ),
      },
      {
        path: "start-society",
        element: (
          <Suspense fallback={<LoadingView />}>
            <StartSociety />
          </Suspense>
        ),
      },
      {
        path: "join-society",
        element: (
          <Suspense fallback={<LoadingView />}>
            <JoinSocietiesPage />
          </Suspense>
        ),
      },
      {
        path: "join-society/:id",
        element: (
          <Suspense fallback={<LoadingView />}>
            <JoinSocietiesPage />
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