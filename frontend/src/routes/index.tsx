import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";
import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/circular-loader";
import Layout from "../components/layout";

const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));
const StudentDashboard = lazy(() => import("../pages/student-dashboard"));
const MySocieties = lazy(() => import("../pages/my-societies"));
const ViewEvents = lazy(() => import("../pages/view-events"));
const ViewNotifications = lazy(() => import("../pages/view-notifications"));
const StartSociety = lazy(() => import("../pages/start-society"));
const JoinSocietiesPage = lazy(() => import("../pages/join-societies"));

const EventListPage = lazy(() => import("../pages/Admin/EventList"));
const SocietyListPage = lazy(() => import("../pages/Admin/SocietyList"));
const SocietyListRejectPage = lazy(
  () => import("../pages/Admin/SocietyListReject")
);
const EventListRejectPage = lazy(
  () => import("../pages/Admin/EventListReject")
);
const AdminDashboardPage = lazy(() => import("../pages/Admin/AdminDashboard"));
const CalendarPage = lazy(() => import("../pages/Admin/Calendar"));

const StudentListPage = lazy(() => import("../pages/Admin/StudentList"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const CreateAdminPage = lazy(() => import("../pages/Admin/CreateAdmin"));
const RequestSocietyPage = lazy(
  () => import("../pages/Admin/PendingSocietyRequest")
);
const RequestEventPage = lazy(
  () => import("../pages/Admin/PendingEventRequest")
);

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
    path: "/dashboard",
    element: (
      <PrivateGuard>
        <Suspense fallback={<LoadingView />}>
          <DashboardPage />
        </Suspense>
      </PrivateGuard>
    ),
  },
  {
    path: "/admin",
    element: (
      <PrivateGuard>
        <Suspense fallback={<LoadingView />}>
          <Layout />
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
        element: <EventListRejectPage />,
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
      {
        path: "request-event",
        element: <RequestEventPage />,
      },
    ],
  },
  {
    path: "/student",
    element: (
      <PrivateGuard>
        <Suspense fallback={<LoadingView />}>
          <Layout />
        </Suspense>
      </PrivateGuard>
    ),
    children: [
      {
        index: true,
        element: <StudentDashboard />,
      },
      {
        path: "my-societies",
        element: <MySocieties />,
      },
      {
        path: "view-events",
        element: <ViewEvents />,
      },
      {
        path: "view-notifications",
        element: <ViewNotifications />,
      },
      {
        path: "start-society",
        element: <StartSociety />,
      },
      {
        path: "join-society",
        element: <JoinSocietiesPage />,
      },
      {
        path: "join-society/:id",
        element: <JoinSocietiesPage />,
      },
    ],
  },
  {
    path: "/logout",
    element: <Navigate to="/" replace />,
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
