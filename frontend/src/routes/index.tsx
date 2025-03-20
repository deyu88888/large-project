import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/circular-loader";
import Layout from "../components/layout";
import PageWithTitle from "../components/PageWithTitle";
import ViewSocietyEvents from "../pages/view-society-events";
import ManageReports from "../pages/Admin/ManageReports";
import ViewReports from "../pages/President/ViewReports";

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
const GiveAwardPage = lazy(() => import("../pages/President/GiveAwardPage"));
const AssignRolePage = lazy(() => import("../pages/President/AssignSocietyRole"));
const ReportThread = lazy(() => import("../pages/Admin/ReportThread"));
const RepliesPage = lazy(() => import("../pages/President/replies"));

// Public event pages
const AllEventsPage = lazy(() => import("../pages/allEventsPage"));
const EventDetailPage = lazy(() => import("../pages/eventDetailPage"));

// Admin pages
const EventListPage = lazy(() => import("../pages/Admin/AdminEventList"));
const SocietyListPage = lazy(() => import("../pages/Admin/SocietyList"));
const SocietyListRejectPage = lazy(() => import("../pages/Admin/RejectedSocietiesList"));
const EventListRejectPage = lazy(() => import("../pages/Admin/RejectedEventsList"));
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
const ReportReply = lazy(
  () => import("../pages/Admin/ReportReply")
);
const ReportRepliedList = lazy(
  () => import("../pages/Admin/ReportRepliedList")
);
const AdminViewSocietyPage = lazy(() => import("../pages/Admin/ViewSociety"));
const RequestDescriptionPage = lazy(() => import("../pages/Admin/SocietyDesChangeRequest"));
const AdminViewStudentPage = lazy(() => import("../pages/Admin/ViewStudent"));
const AdminViewEventPage = lazy(() => import("../pages/Admin/ViewEvent"));
const ActivityLogPage = lazy(() => import("../pages/Admin/ActivityLog"));


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
            path: "reports",
            element: <ManageReports />,
          },
          {
            path: "report-list/:reportId/reply",
            element: <ReportReply />,
          },
          {
            path: "report-replied",
            element: <ReportRepliedList />,
          },
          {
            path: "/admin/report-thread/:reportId",
            element: <ReportThread />,
          },
          {
            path: "view-student/:student_id",
            element: <AdminViewStudentPage />,
          },
          {
            path: "view-society/:society_id",
            element: <AdminViewSocietyPage />,
          },
          {
            path: "view-event/:event_id",
            element: <AdminViewEventPage />,
          },
          {
            path: "activity-log",
            element: <ActivityLogPage />,
          },
          {
            path: "my-team",
            element: <AdminListPage/>
          }
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
          { path: "profile/:userId", element: <PageWithTitle title="User Profile"><ProfilePage /></PageWithTitle> },
          { path: "report-thread/:reportId", element:  <PageWithTitle title="Report Thread"><ReportThread /></PageWithTitle>},
          { path: "report-to-admin", element: <PageWithTitle title="Report to Admin"><ReportToAdmin /></PageWithTitle> },
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
          { path: "create-event", element: <PageWithTitle title="Create Event"><CreateEventPage /></PageWithTitle> },
          { path: "edit-event/:eventId", element: <PageWithTitle title="Edit Event"><EditEventDetails /></PageWithTitle> },
          { path: "give-award/:memberId", element: <PageWithTitle title="Give Award to Member"><GiveAwardPage /></PageWithTitle> },
          { path: "assign-role/:memberId", element: <PageWithTitle title="Assign Society Role"><AssignRolePage /></PageWithTitle> },
        ],
      },
      // Added society management routes
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
          { index: true, element: <PageWithTitle title="Manage Society"><PresidentPage /></PageWithTitle> },
        ],
      },
      {
        path: "manage-society-details/:societyId",
        element: (
          <PrivateGuard requiredRole="student">
            <Suspense fallback={<LoadingView />}>
              <Layout />
            </Suspense>
          </PrivateGuard>
        ),
        children: [
          { index: true, element: <PageWithTitle title="Manage Society Details"><ManageSocietyDetails /></PageWithTitle> },
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
      { path: "all-events", element: <PageWithTitle title="All Events"><AllEventsPage /></PageWithTitle>},
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