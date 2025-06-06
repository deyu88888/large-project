import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";

import NotFound from "../pages/Home/404";
import { LoadingView } from "../components/loading/LoadingView";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/CircularLoader";
import Layout from "../components/Layout.tsx";
import PageWithTitle from "../components/PageWithTitle";
import ManageReports from "../pages/Admin/ManageReports";
import PublicLayout from "../components/home/PublicLayout";

// Lazy-loaded pages
const LoginPage = lazy(() => import("../pages/Auth/Login.tsx"));
const RegisterPage = lazy(() => import("../pages/Auth/Register.tsx"));
const SearchResultsPage = lazy(() => import("../pages/Home/SearchResultsPage"))
const ProfilePage = lazy(() => import("../pages/Home/Profile.tsx"));
const StudentDashboard = lazy(() => import("../pages/Student/StudentDashboard"));
const MySocieties = lazy(() => import("../pages/Student/MyJoinedSocieties"));
const ViewEvents = lazy(() => import("../pages/Student/MyJoinedEvents"));
const ViewNotifications = lazy(() => import("../pages/Student/ViewNotifications"));
const ViewInbox = lazy(() => import("../pages/Student/ViewInbox"));
const StartSociety = lazy(() => import("../pages/Student/StartSociety"));
const JoinSocietiesPage = lazy(() => import("../pages/Student/JoinSociety"));
const ViewSocietyPage = lazy(() => import("../pages/Home/ViewSociety"));
const PresidentPage = lazy(() => import("../pages/President/PresidentPage"));
const ManageSocietyDetails = lazy(() => import("../pages/President/ManageSocietyDetails"));
//const SocietyPreviewModal = lazy(() => import("../pages/President/SocietyPreviewModal"));
const EditEventDetails = lazy(() => import("../pages/President/EditEventDetails"));
const ManageSocietyEvents = lazy(() => import("../pages/President/ManageSocietyEvents"));
const CreateEventPage = lazy(() => import("../pages/President/CreateSocietyEvent"));
const ReportToAdmin = lazy(() => import("../pages/President/ReportToAdmin"));
const ViewSocietyMembers = lazy(() => import("../pages/President/ViewSocietyMembers"));
const PendingMembers = lazy(() => import("../pages/President/PendingMembers"));
const GiveAwardPage = lazy(() => import("../pages/President/GiveAwardPage"));
const AssignRolePage = lazy(() => import("../pages/President/AssignSocietyRole"));
const SocietyNewsManager = lazy(() => import("../pages/President/SocietyNewsManager"));
const ReportThread = lazy(() => import("../pages/Home/ReportThread"));

// Public event pages
const AllEventsPage = lazy(() => import("../pages/Home/AllEventsPage"));
const EventDetailPage = lazy(() => import("../pages/Home/EventDetailPage"));
const AllSocietiesPage = lazy(() => import("../pages/Home/AllSocieties"));
const PublicCalendarPage = lazy(() => import("../pages/Home/Calendar"));
const SupportPage = lazy(() => import("../pages/Home/Support"));

// Admin pages
const EventListPage = lazy(() => import("../pages/Admin/AdminEventList"));
const SocietyListPage = lazy(() => import("../pages/Admin/SocietyList"));
const SocietyListRejectPage = lazy(() => import("../pages/Admin/RejectedSocietiesList"));
const EventListRejectPage = lazy(() => import("../pages/Admin/RejectedEventsList"));
const AdminDashboardPage = lazy(() => import("../pages/Admin/AdminDashboard"));
const CalendarPage = lazy(() => import("../pages/Admin/AdminCalendar"));
const StudentListPage = lazy(() => import("../pages/Admin/StudentList"));
const DashboardPage = lazy(() => import("../pages/Home/Dashboard"));
const CreateAdminPage = lazy(() => import("../pages/Admin/CreateAdmin"));
const AdminListPage = lazy(() => import("../pages/Admin/AdminList"));
const RequestSocietyPage = lazy(() => import("../pages/Admin/SocietyCreationRequests"));
const RequestEventPage = lazy(() => import("../pages/Admin/PendingEventRequest"));
const AdminReportList = lazy(() => import("../pages/Admin/AdminReportList"));
const ManageSocietiesPage = lazy(() => import("../pages/Admin/AdminSocietyManagement"));
const ManageEventsPage = lazy(() => import("../pages/Admin/AdminEventManagement"));
const NewsApprovalDashboard = lazy(() => import("../pages/Admin/NewsApprovalDashboard"));
const ReportReply = lazy(() => import("../pages/Admin/ReportReply"));
const ReportRepliedList = lazy(() => import("../pages/Admin/ReportRepliedList"));
const AdminViewSocietyPage = lazy(() => import("../pages/Admin/ViewSociety"));
const PendingSocietyDetailRequestPage = lazy(() => import("../pages/Admin/PendingSocietyDetailRequest"));
const AdminViewStudentPage = lazy(() => import("../pages/Admin/ViewStudent"));
const AdminViewAdminPage = lazy(() => import("../pages/Admin/ViewAdmin"));
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
      // {
      //   index: true,
      //   element: <PageWithTitle title="Dashboard"><DashboardPage /></PageWithTitle>,
      // },
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
          // { path: "society-list", element: <PageWithTitle title="Society List"><SocietyListPage /></PageWithTitle> },
          // { path: "society-list-rejected", element: <PageWithTitle title="Rejected Societies"><SocietyListRejectPage /></PageWithTitle> },
          { path: "event-list-rejected", element: <PageWithTitle title="Rejected Events"><EventListRejectPage /></PageWithTitle> },
          { path: "student-list", element: <PageWithTitle title="Student List"><StudentListPage /></PageWithTitle> },
          // { path: "admin-list", element: <PageWithTitle title="Admin List"><AdminListPage /></PageWithTitle> },
          { path: "create-admin", element: <PageWithTitle title="Create Admin"><CreateAdminPage /></PageWithTitle> },
          { path: "calendar", element: <PageWithTitle title="Admin Calendar"><CalendarPage /></PageWithTitle> },
          { path: "request-society", element: <PageWithTitle title="Society Creation Requests"><RequestSocietyPage /></PageWithTitle> },
          { path: "request-event", element: <PageWithTitle title="Pending Event Requests"><RequestEventPage /></PageWithTitle> },
          { path: "society-detail-request", element: <PageWithTitle title="Pending Society Detail Requests"><PendingSocietyDetailRequestPage /></PageWithTitle> },
          { path: "reports", element: <PageWithTitle title="Reports"><ManageReports /></PageWithTitle> },
          { path: "report-list", element: <PageWithTitle title="Admin Reports"><AdminReportList /></PageWithTitle> },
          { path: "report-list/:reportId/reply", element: <PageWithTitle title="Reply to Report"><ReportReply /></PageWithTitle> },
          // { path: "report-replied", element: <PageWithTitle title="Replied Reports"><ReportRepliedList /></PageWithTitle> },
          { path: "report-thread/:reportId", element: <PageWithTitle title="Report Thread"><ReportThread /></PageWithTitle> },
          { path: "news-approval", element: <PageWithTitle title="News Publication Approval"><NewsApprovalDashboard /></PageWithTitle> },
          { path: "view-student/:student_id", element: <PageWithTitle title="View Student"><AdminViewStudentPage /></PageWithTitle> },
          { path: "view-society/:society_id", element: <PageWithTitle title="View Society"><AdminViewSocietyPage /></PageWithTitle> },
          // { path: "view-event/:event_id", element: <PageWithTitle title="View Event"><AdminViewEventPage /></PageWithTitle> },
          { path: "view-admin/:admin_id", element: <PageWithTitle title="Admin Details"><AdminViewAdminPage /></PageWithTitle> },
          { path: "activity-log", element: <PageWithTitle title="Activity Log"><ActivityLogPage /></PageWithTitle> },
          { path: "my-team", element: <PageWithTitle title="My Team"><AdminListPage /></PageWithTitle> },
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
          // { path: "view-news", element: <PageWithTitle title="News"><ViewNews /></PageWithTitle> },
          { path: "view-notifications", element: <PageWithTitle title="Notifications"><ViewNotifications /></PageWithTitle> },
          { path: "view-inbox", element: <PageWithTitle title="Inbox"><ViewInbox /></PageWithTitle> },
          { path: "start-society", element: <PageWithTitle title="Start a Society"><StartSociety /></PageWithTitle> },
          { path: "join-society", element: <PageWithTitle title="Join a Society"><JoinSocietiesPage /></PageWithTitle> },
          { path: "view-society/:society_id", element: <PageWithTitle title="Society Details"><ViewSocietyPage /></PageWithTitle> },
          { path: "event/:event_id", element: <PageWithTitle title="Event Details"><EventDetailPage /></PageWithTitle> },
          { path: "profile/:student_id", element: <PageWithTitle title="User Profile"><ProfilePage /></PageWithTitle> },
          { path: "report-thread/:reportId", element: <PageWithTitle title="Report Thread"><ReportThread /></PageWithTitle> },
          { path: "report-to-admin", element: <PageWithTitle title="Report to Admin"><ReportToAdmin /></PageWithTitle> },
          { path: "student-search", element: <PageWithTitle title="Student Search"><SearchResultsPage /></PageWithTitle> },
          { path: "all-events", element: <PageWithTitle title="Student All Events"><AllEventsPage /></PageWithTitle> }
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
          { path: "manage-society-details/", element: <PageWithTitle title="Manage Society Details"><ManageSocietyDetails /></PageWithTitle> },
          { path: "manage-society-events/:filter?", element: <PageWithTitle title="Society Events"><ManageSocietyEvents /></PageWithTitle> },
          { path: "pending-members", element: <PageWithTitle title="Pending Members"><PendingMembers /></PageWithTitle> },
          { path: "view-society-members", element: <PageWithTitle title="Society Members"><ViewSocietyMembers /></PageWithTitle> },
          { path: "create-event", element: <PageWithTitle title="Create Event"><CreateEventPage /></PageWithTitle> },
          { path: "edit-event/:eventId", element: <PageWithTitle title="Edit Event"><EditEventDetails /></PageWithTitle> },
          { path: "give-award-page/:memberId", element: <PageWithTitle title="Give Award to Member"><GiveAwardPage /></PageWithTitle> },
          { path: "assign-role/:memberId", element: <PageWithTitle title="Assign Society Role"><AssignRolePage /></PageWithTitle> },
          { path: "manage-society-news", element: <PageWithTitle title="Manage Society News"><SocietyNewsManager /></PageWithTitle> },
          { path: "report-to-admin", element: <PageWithTitle title="Report to Admin"><ReportToAdmin /></PageWithTitle> },
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
          <PublicLayout>
            <Outlet />
          </PublicLayout>
        </Suspense>
      </PublicGuard>
    ),
    children: [
      { index: true, element: <PageWithTitle title="Home"><DashboardPage /></PageWithTitle> },
      { path: "login", element: <PageWithTitle title="Login"><LoginPage /></PageWithTitle> },
      { path: "register", element: <PageWithTitle title="Register"><RegisterPage /></PageWithTitle> },
      // { path: "event-list", element: <PageWithTitle title="All Events"><EventListPage /></PageWithTitle> }, // check use of this
      { path: "all-events", element: <PageWithTitle title="All Events"><AllEventsPage /></PageWithTitle> },
      { path: "all-societies", element: <PageWithTitle title="All Societies"><AllSocietiesPage /></PageWithTitle> },
      { path: "event/:event_id", element: <PageWithTitle title="Event Details"><EventDetailPage /></PageWithTitle> },
      { path: "view-society/:society_id", element: <PageWithTitle title="Society Details"><ViewSocietyPage /></PageWithTitle> },
      { path: "search", element: <PageWithTitle title="Search"><SearchResultsPage /></PageWithTitle> },
      { path: "calendar", element: <PageWithTitle title="Calendar"><PublicCalendarPage /></PageWithTitle> },
      { path: "support", element: <PageWithTitle title="Support"><SupportPage /></PageWithTitle> },
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