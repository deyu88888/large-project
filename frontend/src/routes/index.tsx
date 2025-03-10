import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/circular-loader";
import Layout from "../components/layout";
import ViewSocietyEvents from "../pages/view-society-events";
import PendingMembers from "../pages/President/pending-members";
import GiveAwardPage from "../pages/President/give-award-page";
import AssignSocietyRole from "../pages/President/assign-society-role";

// Lazy-loaded pages
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));
const StudentDashboard = lazy(() => import("../pages/Student/student-dashboard"));
const MySocieties = lazy(() => import("../pages/Student/my-societies"));
const ViewEvents = lazy(() => import("../pages/Student/view-events"));
const ViewNotifications = lazy(() => import("../pages/Student/view-notifications"));
const StartSociety = lazy(() => import("../pages/Student/start-society"));
const JoinSocietiesPage = lazy(() => import("../pages/Student/join-societies"));
const ViewSocietyPage = lazy(() => import("../pages/view-society"));
const PresidentPage = lazy(() => import("../pages/President/president-page"));
const ManageSocietyDetails = lazy(() => import("../pages/President/manage-society-details"));
const ManageSocietyEvents = lazy(() => import("../pages/President/manage-society-events"));
const CreateEventPage = lazy(() => import("../pages/create-society-event"));
const ReportToAdmin = lazy(() => import("../pages/President/report-to-admin"));
const ViewSocietyMembers = lazy(() => import("../pages/President/view-society-members"));
const RequestDescriptionPage = lazy(() => import("../pages/Admin/PendingDescriptionRequest"));

//Public event page
const AllEventsPage = lazy(() => import("../pages/allEventsPage"))
const EventDetailPage = lazy(() => import("../pages/eventDetailPage"))

// Admin pages
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
const AdminReportList = lazy(
  () => import("../pages/Admin/AdminReportList")
);
const ManageSocietiesPage = lazy(
  () => import("../pages/Admin/ManageSocieties")
);
const ManageEventsPage = lazy(
  () => import("../pages/Admin/ManageEvents")
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
        path: "admin",
        element: (
          <PrivateGuard requiredRole="admin">
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
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "event-list",
            element: <EventListPage />,
          },
          {
            path: "society",
            element: <ManageSocietiesPage />,
          },
          {
            path: "event",
            element: <ManageEventsPage />,
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
          {
            path: "request-description",
            element: <RequestDescriptionPage />,
          },
          {
            path: "report-list",
            element: <AdminReportList />,
          },
        ],
      },
      {
        path: "student",
        element: (
          <PrivateGuard requiredRole="student">
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
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "profile/:student_id",
            element: <ProfilePage />,
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
          {
            path: "view-society/:society_id",
            element: <ViewSocietyPage />,
          },
        ],
      },
      {
        // President Mode routes (separate from regular student routes)
        // Even though a president is a student, these routes are used when they
        // click "Manage My Society" and enter president mode.
        path: "/president-page",
  element: (
    <PrivateGuard requiredRole="student">
      <Suspense fallback={<LoadingView />}>
        <Layout />
      </Suspense>
    </PrivateGuard>
  ),
  children: [
    {
      // This dynamic segment ensures that the society ID is always captured as a number
      path: ":society_id",
      element: <Outlet />, // Passes the dynamic param to children
      children: [
        // President dashboard landing page
        { index: true, element: <PresidentPage /> },
        {
          path: "manage-society-details",
          element: (
            <Suspense fallback={<LoadingView />}>
              <ManageSocietyDetails />
            </Suspense>
          ),
        },
        {
          path: "manage-society-events",
          element: (
            <Suspense fallback={<LoadingView />}>
              <ManageSocietyEvents />
            </Suspense>
          ),
        },
        {
          path: "create-society-event",
          element: (
            <Suspense fallback={<LoadingView />}>
              <CreateEventPage />
            </Suspense>
          ),
        },
        {
          path: "society/:event_type",
          element: (
            <Suspense fallback={<LoadingView />}>
              <ViewSocietyEvents />
            </Suspense>
          ),
        },
        {
          path: "pending-members",
          element: (
            <Suspense fallback={<LoadingView />}>
              <PendingMembers />
            </Suspense>
          ),
        },
        {
          path: "report-to-admin",
          element: (
            <Suspense fallback={<LoadingView />}>
              <ReportToAdmin />
            </Suspense>
          ),
        },
        {
          path: "view-society-members",
          element: (
            <Suspense fallback={<LoadingView />}>
              <ViewSocietyMembers />
            </Suspense>
          ),
        },
        {
          path: "give-award-page/:student_id",
          element: (
            <Suspense fallback={<LoadingView />}>
              <GiveAwardPage />
            </Suspense>
          ),
        },
        {
          path: "assign-society-role/:student_id",
          element: (
            <Suspense fallback={<LoadingView />}>
              <AssignSocietyRole />
            </Suspense>
          ),
        },
      ],
    },
  ],
      },
      {
        path: "logout",
        children: [
          {
            index: true,
            element: <DashboardPage />,
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
    path: "/",
    element: (
      <Suspense fallback={<LoadingView />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        path: "all-events",
        element: <AllEventsPage />,
      },
      {
        path: "event/:eventId",
        element: <EventDetailPage />
      }
    ]
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