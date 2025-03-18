import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/circular-loader";
import Layout from "../components/layout";
import PageWithTitle from "../components/PageWithTitle";

// Lazy-loaded pages
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const ProfilePage = lazy(() => import("../pages/profile"));
const StudentDashboard = lazy(() => import("../pages/Student/StudentDashboard"));
const MySocieties = lazy(() => import("../pages/Student/MyJoinedSocieties"));
const ViewEvents = lazy(() => import("../pages/ViewEvents"));
const ViewNews = lazy(() => import("../pages/Student/ViewNews"));
const ViewNotifications = lazy(() => import("../pages/Student/ViewNotifications"));
const ViewInbox = lazy(() => import("../pages/Student/ViewInbox"));
const StartSociety = lazy(() => import("../pages/Student/StartSociety"));
const JoinSocietiesPage = lazy(() => import("../pages/Student/JoinSociety"));
const ViewSocietyPage = lazy(() => import("../pages/view-society"));
const PresidentPage = lazy(() => import("../pages/President/PresidentPage"));
const ManageSocietyDetails = lazy(() => import("../pages/President/ManageSocietyDetails"));
const SocietyPreviewModal = lazy(() => import("../pages/President/SocietyPreviewModal"));
const EditEventDetails = lazy(() => import("../pages/President/EditEventDetails"));
const ManageSocietyEvents = lazy(() => import("../pages/President/ManageSocietyEvents"));
const CreateEventPage = lazy(() => import("../pages/President/CreateSocietyEvent"));
const ReportToAdmin = lazy(() => import("../pages/President/ReportToAdmin"));
const ViewSocietyMembers = lazy(() => import("../pages/President/ViewSocietyMembers"));
const PendingMembers = lazy(() => import("../pages/President/PendingMembers"));

// Public event pages
const AllEventsPage = lazy(() => import("../pages/allEventsPage"));
const EventDetailPage = lazy(() => import("../pages/eventDetailPage"));

// Admin pages
const EventListPage = lazy(() => import("../pages/Admin/AdminEventList"));
const SocietyListPage = lazy(() => import("../pages/Admin/SocietyList"));
const AdminDashboardPage = lazy(() => import("../pages/Admin/AdminDashboard"));
const CalendarPage = lazy(() => import("../pages/Admin/AdminCalendar"));
const StudentListPage = lazy(() => import("../pages/Admin/StudentList"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const CreateAdminPage = lazy(() => import("../pages/Admin/CreateAdmin"));
const AdminListPage = lazy(() => import("../pages/Admin/AdminList"));
const RequestSocietyPage = lazy(() => import("../pages/Admin/SocietyCreationRequests"));
const RequestEventPage = lazy(() => import("../pages/Admin/PendingEventRequest"));
const AdminReportList = lazy(() => import("../pages/Admin/AdminReportList"));
const ManageSocietiesPage = lazy(() => import("../pages/Admin/AdminSocietyManagement"));
const ManageEventsPage = lazy(() => import("../pages/Admin/AdminEventManagement"));

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
        element: <PageWithTitle title="Dashboard"><DashboardPage /></PageWithTitle>,
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
          { index: true, element: <PageWithTitle title="Admin Dashboard"><AdminDashboardPage /></PageWithTitle> },
          { path: "profile", element: <PageWithTitle title="Admin Profile"><ProfilePage /></PageWithTitle> },
          { path: "event-list", element: <PageWithTitle title="Admin Event List"><EventListPage /></PageWithTitle> },
          { path: "society", element: <PageWithTitle title="Manage Societies"><ManageSocietiesPage /></PageWithTitle> },
          { path: "event", element: <PageWithTitle title="Manage Events"><ManageEventsPage /></PageWithTitle> },
          { path: "society-list", element: <PageWithTitle title="Society List"><SocietyListPage /></PageWithTitle> },
          { path: "student-list", element: <PageWithTitle title="Student List"><StudentListPage /></PageWithTitle> },
          { path: "admin-list", element: <PageWithTitle title="Admin List"><AdminListPage /></PageWithTitle> },
          { path: "create-admin", element: <PageWithTitle title="Create Admin"><CreateAdminPage /></PageWithTitle> },
          { path: "calendar", element: <PageWithTitle title="Admin Calendar"><CalendarPage /></PageWithTitle> },
          { path: "request-society", element: <PageWithTitle title="Society Creation Requests"><RequestSocietyPage /></PageWithTitle> },
          { path: "request-event", element: <PageWithTitle title="Pending Event Requests"><RequestEventPage /></PageWithTitle> },
          { path: "report-list", element: <PageWithTitle title="Admin Reports"><AdminReportList /></PageWithTitle> },
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
          { index: true, element: <PageWithTitle title="Student Dashboard"><StudentDashboard /></PageWithTitle> },
          { path: "profile", element: <PageWithTitle title="My Profile"><ProfilePage /></PageWithTitle> },
          { path: "my-societies", element: <PageWithTitle title="My Societies"><MySocieties /></PageWithTitle> },
          { path: "view-events", element: <PageWithTitle title="Upcoming Events"><ViewEvents /></PageWithTitle> },
          { path: "view-news", element: <PageWithTitle title="News"><ViewNews /></PageWithTitle> },
          { path: "view-notifications", element: <PageWithTitle title="Notifications"><ViewNotifications /></PageWithTitle> },
          { path: "view-inbox", element: <ViewInbox /> },
          { path: "start-society", element: <PageWithTitle title="Start a Society"><StartSociety /></PageWithTitle> },
          { path: "join-society", element: <PageWithTitle title="Join a Society"><JoinSocietiesPage /></PageWithTitle> },
          { path: "view-society/:society_id", element: <PageWithTitle title="Society Details"><ViewSocietyPage /></PageWithTitle> },
        ],
      },
      {
        path: "president-page/:societyId",
        element: (
          <PrivateGuard requiredRole="student">
            <Suspense fallback={<LoadingView />}>
              <Layout />
            </Suspense>
          </PrivateGuard>
        ),
        children: [
          { index: true, element: <PageWithTitle title="Society Management"><PresidentPage /></PageWithTitle> },
          { path: "manage-society-details", element: <PageWithTitle title="Society Details"><ManageSocietyDetails /></PageWithTitle> },
          { path: "manage-society-events/:filter?", element: <PageWithTitle title="Society Events"><ManageSocietyEvents /></PageWithTitle> },
          { path: "pending-members", element: <PageWithTitle title="Pending Members"><PendingMembers /></PageWithTitle> },
          { path: "view-society-members", element: <PageWithTitle title="Society Members"><ViewSocietyMembers /></PageWithTitle> },
          { path: "report-to-admin", element: <PageWithTitle title="Report to Admin"><ReportToAdmin /></PageWithTitle> },
          { path: "create-event", element: <PageWithTitle title="Create Event"><CreateEventPage /></PageWithTitle> },
          { path: "edit-event/:eventId", element: <PageWithTitle title="Edit Event"><EditEventDetails /></PageWithTitle> },
        ],
      },
      {
        path: "logout",
        children: [
          { index: true, element: <PageWithTitle title="Logging Out"><DashboardPage /></PageWithTitle> },
          {
            path: "logout",
            element: (
              <Suspense fallback={<CircularLoader />}>
                <Navigate to="/login" replace />
              </Suspense>
            ),
          },
        ],
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
      { index: true, element: <PageWithTitle title="Home"><DashboardPage /></PageWithTitle> },
      { path: "login", element: <PageWithTitle title="Login"><LoginPage /></PageWithTitle> },
      { path: "register", element: <PageWithTitle title="Register"><RegisterPage /></PageWithTitle> },
      { path: "event-list", element: <PageWithTitle title="All Events"><EventListPage /></PageWithTitle> },
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
      { path: "all-events", element: <PageWithTitle title="All Events"><AllEventsPage /></PageWithTitle> },
      { path: "event/:eventId", element: <PageWithTitle title="Event Details"><EventDetailPage /></PageWithTitle> },
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