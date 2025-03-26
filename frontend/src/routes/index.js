import { jsx as _jsx } from "react/jsx-runtime";
import { lazy, Suspense } from "react";
import { Outlet, Navigate, useRoutes } from "react-router-dom";
import NotFound from "../pages/404";
import { LoadingView } from "../components/loading/loading-view";
import { PublicGuard } from "../components/guards/public-guard";
import { PrivateGuard } from "../components/guards/private-guard";
import CircularLoader from "../components/loading/circular-loader";
import Layout from "../components/layout";
import PageWithTitle from "../components/PageWithTitle";
import ManageReports from "../pages/Admin/ManageReports";
import PublicLayout from "../components/home/PublicLayout";
// Lazy-loaded pages
const LoginPage = lazy(() => import("../pages/login"));
const RegisterPage = lazy(() => import("../pages/register"));
const SearchResultsPage = lazy(() => import("../pages/SearchResultsPage"));
const ProfilePage = lazy(() => import("../pages/profile"));
const StudentDashboard = lazy(() => import("../pages/Student/StudentDashboard"));
const MySocieties = lazy(() => import("../pages/Student/MyJoinedSocieties"));
const ViewEvents = lazy(() => import("../pages/Student/MyJoinedEvents"));
const ViewNews = lazy(() => import("../pages/Student/ViewNews"));
const ViewNotifications = lazy(() => import("../pages/Student/ViewNotifications"));
const ViewInbox = lazy(() => import("../pages/Student/ViewInbox"));
const StartSociety = lazy(() => import("../pages/Student/StartSociety"));
const JoinSocietiesPage = lazy(() => import("../pages/Student/JoinSociety"));
const ViewSocietyPage = lazy(() => import("../pages/ViewSociety"));
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
const ReportThread = lazy(() => import("../pages/ReportThread"));
// Public event pages
const AllEventsPage = lazy(() => import("../pages/AllEventsPage"));
const EventDetailPage = lazy(() => import("../pages/EventDetailPage"));
const AllSocietiesPage = lazy(() => import("../pages/AllSocieties"));
const PublicCalendarPage = lazy(() => import("../pages/Calendar"));
const SupportPage = lazy(() => import("../pages/Support"));
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
        element: (_jsx(PrivateGuard, { children: _jsx(Suspense, { fallback: _jsx(LoadingView, {}), children: _jsx(Outlet, {}) }) })),
        children: [
            // {
            //   index: true,
            //   element: <PageWithTitle title="Dashboard"><DashboardPage /></PageWithTitle>,
            // },
            {
                path: "admin",
                element: (_jsx(PrivateGuard, { requiredRole: "admin", children: _jsx(Suspense, { fallback: _jsx(LoadingView, {}), children: _jsx(Layout, {}) }) })),
                children: [
                    { index: true, element: _jsx(PageWithTitle, { title: "Admin Dashboard", children: _jsx(AdminDashboardPage, {}) }) },
                    { path: "profile", element: _jsx(PageWithTitle, { title: "Admin Profile", children: _jsx(ProfilePage, {}) }) },
                    { path: "event-list", element: _jsx(PageWithTitle, { title: "Admin Event List", children: _jsx(EventListPage, {}) }) },
                    { path: "society", element: _jsx(PageWithTitle, { title: "Manage Societies", children: _jsx(ManageSocietiesPage, {}) }) },
                    { path: "event", element: _jsx(PageWithTitle, { title: "Manage Events", children: _jsx(ManageEventsPage, {}) }) },
                    { path: "society-list", element: _jsx(PageWithTitle, { title: "Society List", children: _jsx(SocietyListPage, {}) }) },
                    { path: "society-list-rejected", element: _jsx(PageWithTitle, { title: "Rejected Societies", children: _jsx(SocietyListRejectPage, {}) }) },
                    { path: "event-list-rejected", element: _jsx(PageWithTitle, { title: "Rejected Events", children: _jsx(EventListRejectPage, {}) }) },
                    { path: "student-list", element: _jsx(PageWithTitle, { title: "Student List", children: _jsx(StudentListPage, {}) }) },
                    { path: "admin-list", element: _jsx(PageWithTitle, { title: "Admin List", children: _jsx(AdminListPage, {}) }) },
                    { path: "create-admin", element: _jsx(PageWithTitle, { title: "Create Admin", children: _jsx(CreateAdminPage, {}) }) },
                    { path: "calendar", element: _jsx(PageWithTitle, { title: "Admin Calendar", children: _jsx(CalendarPage, {}) }) },
                    { path: "request-society", element: _jsx(PageWithTitle, { title: "Society Creation Requests", children: _jsx(RequestSocietyPage, {}) }) },
                    { path: "request-event", element: _jsx(PageWithTitle, { title: "Pending Event Requests", children: _jsx(RequestEventPage, {}) }) },
                    { path: "society-detail-request", element: _jsx(PageWithTitle, { title: "Pending Society Detail Requests", children: _jsx(PendingSocietyDetailRequestPage, {}) }) },
                    { path: "reports", element: _jsx(PageWithTitle, { title: "Reports", children: _jsx(ManageReports, {}) }) },
                    { path: "report-list", element: _jsx(PageWithTitle, { title: "Admin Reports", children: _jsx(AdminReportList, {}) }) },
                    { path: "report-list/:reportId/reply", element: _jsx(PageWithTitle, { title: "Reply to Report", children: _jsx(ReportReply, {}) }) },
                    { path: "report-replied", element: _jsx(PageWithTitle, { title: "Replied Reports", children: _jsx(ReportRepliedList, {}) }) },
                    { path: "report-thread/:reportId", element: _jsx(PageWithTitle, { title: "Report Thread", children: _jsx(ReportThread, {}) }) },
                    { path: "news-approval", element: _jsx(PageWithTitle, { title: "News Publication Approval", children: _jsx(NewsApprovalDashboard, {}) }) },
                    { path: "view-student/:student_id", element: _jsx(PageWithTitle, { title: "View Student", children: _jsx(AdminViewStudentPage, {}) }) },
                    { path: "view-society/:society_id", element: _jsx(PageWithTitle, { title: "View Society", children: _jsx(AdminViewSocietyPage, {}) }) },
                    // { path: "view-event/:event_id", element: <PageWithTitle title="View Event"><AdminViewEventPage /></PageWithTitle> },
                    { path: "view-admin/:admin_id", element: _jsx(PageWithTitle, { title: "Admin Details", children: _jsx(AdminViewAdminPage, {}) }) },
                    { path: "activity-log", element: _jsx(PageWithTitle, { title: "Activity Log", children: _jsx(ActivityLogPage, {}) }) },
                    { path: "my-team", element: _jsx(PageWithTitle, { title: "My Team", children: _jsx(AdminListPage, {}) }) },
                ],
            },
            {
                path: "student",
                element: (_jsx(PrivateGuard, { requiredRole: "student", children: _jsx(Suspense, { fallback: _jsx(LoadingView, {}), children: _jsx(Layout, {}) }) })),
                children: [
                    { index: true, element: _jsx(PageWithTitle, { title: "Student Dashboard", children: _jsx(StudentDashboard, {}) }) },
                    { path: "profile", element: _jsx(PageWithTitle, { title: "My Profile", children: _jsx(ProfilePage, {}) }) },
                    { path: "my-societies", element: _jsx(PageWithTitle, { title: "My Societies", children: _jsx(MySocieties, {}) }) },
                    { path: "view-events", element: _jsx(PageWithTitle, { title: "Upcoming Events", children: _jsx(ViewEvents, {}) }) },
                    { path: "view-news", element: _jsx(PageWithTitle, { title: "News", children: _jsx(ViewNews, {}) }) },
                    { path: "view-notifications", element: _jsx(PageWithTitle, { title: "Notifications", children: _jsx(ViewNotifications, {}) }) },
                    { path: "view-inbox", element: _jsx(PageWithTitle, { title: "Inbox", children: _jsx(ViewInbox, {}) }) },
                    { path: "start-society", element: _jsx(PageWithTitle, { title: "Start a Society", children: _jsx(StartSociety, {}) }) },
                    { path: "join-society", element: _jsx(PageWithTitle, { title: "Join a Society", children: _jsx(JoinSocietiesPage, {}) }) },
                    { path: "view-society/:society_id", element: _jsx(PageWithTitle, { title: "Society Details", children: _jsx(ViewSocietyPage, {}) }) },
                    { path: "event/:event_id", element: _jsx(PageWithTitle, { title: "Event Details", children: _jsx(EventDetailPage, {}) }) },
                    { path: "profile/:student_id", element: _jsx(PageWithTitle, { title: "User Profile", children: _jsx(ProfilePage, {}) }) },
                    { path: "report-thread/:reportId", element: _jsx(PageWithTitle, { title: "Report Thread", children: _jsx(ReportThread, {}) }) },
                    { path: "report-to-admin", element: _jsx(PageWithTitle, { title: "Report to Admin", children: _jsx(ReportToAdmin, {}) }) },
                    { path: "student-search", element: _jsx(PageWithTitle, { title: "Student Search", children: _jsx(SearchResultsPage, {}) }) },
                    { path: "all-events", element: _jsx(PageWithTitle, { title: "Student All Events", children: _jsx(AllEventsPage, {}) }) }
                ],
            },
            {
                path: "president-page/:societyId",
                element: (_jsx(PrivateGuard, { requiredRole: "student", children: _jsx(Suspense, { fallback: _jsx(LoadingView, {}), children: _jsx(Layout, {}) }) })),
                children: [
                    { index: true, element: _jsx(PageWithTitle, { title: "Society Management", children: _jsx(PresidentPage, {}) }) },
                    { path: "manage-society-details/", element: _jsx(PageWithTitle, { title: "Manage Society Details", children: _jsx(ManageSocietyDetails, {}) }) },
                    { path: "manage-society-events/:filter?", element: _jsx(PageWithTitle, { title: "Society Events", children: _jsx(ManageSocietyEvents, {}) }) },
                    { path: "pending-members", element: _jsx(PageWithTitle, { title: "Pending Members", children: _jsx(PendingMembers, {}) }) },
                    { path: "view-society-members", element: _jsx(PageWithTitle, { title: "Society Members", children: _jsx(ViewSocietyMembers, {}) }) },
                    { path: "create-event", element: _jsx(PageWithTitle, { title: "Create Event", children: _jsx(CreateEventPage, {}) }) },
                    { path: "edit-event/:eventId", element: _jsx(PageWithTitle, { title: "Edit Event", children: _jsx(EditEventDetails, {}) }) },
                    { path: "give-award-page/:memberId", element: _jsx(PageWithTitle, { title: "Give Award to Member", children: _jsx(GiveAwardPage, {}) }) },
                    { path: "assign-role/:memberId", element: _jsx(PageWithTitle, { title: "Assign Society Role", children: _jsx(AssignRolePage, {}) }) },
                    { path: "manage-society-news", element: _jsx(PageWithTitle, { title: "Manage Society News", children: _jsx(SocietyNewsManager, {}) }) },
                    { path: "report-to-admin", element: _jsx(PageWithTitle, { title: "Report to Admin", children: _jsx(ReportToAdmin, {}) }) },
                ],
            },
            {
                path: "logout",
                children: [
                    { index: true, element: _jsx(PageWithTitle, { title: "Logging Out", children: _jsx(DashboardPage, {}) }) },
                    {
                        path: "logout",
                        element: (_jsx(Suspense, { fallback: _jsx(CircularLoader, {}), children: _jsx(Navigate, { to: "/login", replace: true }) })),
                    },
                ],
            },
        ],
    },
    {
        path: "/",
        element: (_jsx(PublicGuard, { children: _jsx(Suspense, { fallback: _jsx(LoadingView, {}), children: _jsx(PublicLayout, { children: _jsx(Outlet, {}) }) }) })),
        children: [
            { index: true, element: _jsx(PageWithTitle, { title: "Home", children: _jsx(DashboardPage, {}) }) },
            { path: "login", element: _jsx(PageWithTitle, { title: "Login", children: _jsx(LoginPage, {}) }) },
            { path: "register", element: _jsx(PageWithTitle, { title: "Register", children: _jsx(RegisterPage, {}) }) },
            { path: "event-list", element: _jsx(PageWithTitle, { title: "All Events", children: _jsx(EventListPage, {}) }) }, // check use of this
            { path: "all-events", element: _jsx(PageWithTitle, { title: "All Events", children: _jsx(AllEventsPage, {}) }) },
            { path: "all-societies", element: _jsx(PageWithTitle, { title: "All Societies", children: _jsx(AllSocietiesPage, {}) }) },
            { path: "event/:event_id", element: _jsx(PageWithTitle, { title: "Event Details", children: _jsx(EventDetailPage, {}) }) },
            { path: "view-society/:society_id", element: _jsx(PageWithTitle, { title: "Society Details", children: _jsx(ViewSocietyPage, {}) }) },
            { path: "search", element: _jsx(PageWithTitle, { title: "Search", children: _jsx(SearchResultsPage, {}) }) },
            { path: "calendar", element: _jsx(PageWithTitle, { title: "Calendar", children: _jsx(PublicCalendarPage, {}) }) },
            { path: "support", element: _jsx(PageWithTitle, { title: "Support", children: _jsx(SupportPage, {}) }) },
        ],
    },
    {
        path: "*",
        element: (_jsx(Suspense, { fallback: _jsx(LoadingView, {}), children: _jsx(NotFound, {}) })),
    },
];
export function Routes() {
    return useRoutes(routes);
}
