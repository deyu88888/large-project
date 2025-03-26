import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button, Paper, Card, CardContent, Divider } from "@mui/material";
import { FaUsers, FaCalendarAlt, FaEnvelope, FaNewspaper } from "react-icons/fa";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
const extractColors = (colours) => {
    return {
        greenAccent: colours?.greenAccent?.[500] || "#4caf50",
        blueAccent: colours?.blueAccent?.[500] || "#2196f3",
        redAccent: colours?.redAccent?.[500] || "#f44336",
        yellowAccent: colours?.yellowAccent?.[500] || "#ffeb3b",
        grey: colours?.grey?.[100] || "#f5f5f5",
        greyAlt: colours?.grey?.[300] || "#e0e0e0",
        primary: colours?.primary?.[400] || "#121212",
        blueAccentHover: colours?.blueAccent?.[600] || "#1976d2",
        blueAccentHoverDark: colours?.blueAccent?.[700] || "#0d47a1",
    };
};
const StatCard = ({ icon, title, value }) => {
    return (_jsxs(Box, { className: "p-6 rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1", style: {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
        }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: "16px", children: [icon, _jsx(Typography, { variant: "h6", style: { marginLeft: "12px" }, children: title })] }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: value })] }));
};
const NotificationCard = ({ message, isRead }) => {
    return (_jsx(Box, { className: "p-5 rounded-lg shadow-md transition-all", style: {
            backgroundColor: isRead ? "rgba(0, 128, 0, 0.1)" : "rgba(255, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
        }, children: _jsx(Typography, { children: message }) }));
};
const PublicationsSection = ({ publications, colors, onNavigate }) => {
    const renderEmptyState = () => {
        return (_jsx(Paper, { sx: { p: 3, backgroundColor: "rgba(255, 255, 255, 0.1)" }, children: _jsx(Typography, { color: colors.greyAlt, children: "No pending publication requests." }) }));
    };
    const renderPublicationCard = (request) => {
        return (_jsx(Card, { sx: {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                mb: 2
            }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: request.news_post_title || 'Untitled News Post' }), _jsxs(Typography, { variant: "body2", sx: { mb: 1 }, children: ["Society: ", request.society_name || "Unknown"] }), _jsxs(Typography, { variant: "body2", color: colors.greyAlt, children: ["Requested by: ", request.requester_name || "Unknown"] }), _jsx(Divider, { sx: { my: 2 } }), _jsx(Box, { display: "flex", justifyContent: "flex-end", gap: 1, children: _jsx(Button, { size: "small", variant: "contained", color: "primary", onClick: () => onNavigate(`/admin/news-approval?request=${request.id}`), children: "Review" }) })] }) }, request.id));
    };
    const renderMoreButton = () => {
        if (publications.length <= 3)
            return null;
        return (_jsx(Box, { textAlign: "center", mt: 2, children: _jsxs(Button, { variant: "text", color: "primary", onClick: () => onNavigate("/admin/news-approval"), children: ["View ", publications.length - 3, " more requests"] }) }));
    };
    return (_jsxs("section", { className: "mb-16", children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h5", color: colors.grey, gutterBottom: true, children: "News Publication Requests" }), _jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(FaNewspaper, {}), onClick: () => onNavigate("/admin/news-approval"), sx: {
                            backgroundColor: colors.blueAccentHover,
                            '&:hover': { backgroundColor: colors.blueAccentHoverDark }
                        }, children: "View All Requests" })] }), _jsxs("div", { className: "space-y-4", children: [publications.length === 0
                        ? renderEmptyState()
                        : publications.slice(0, 3).map(renderPublicationCard), renderMoreButton()] })] }));
};
const NotificationsSection = ({ notifications, colors }) => {
    const renderEmptyState = () => {
        return (_jsx(Typography, { color: colors.greyAlt, children: "No new notifications." }));
    };
    const renderNotifications = () => {
        return notifications.map((notification) => (_jsx(NotificationCard, { message: notification.body || "", isRead: notification.is_read || false }, notification.id)));
    };
    return (_jsxs("section", { className: "mb-20", children: [_jsx(Typography, { variant: "h5", color: colors.grey, gutterBottom: true, children: "Notifications" }), _jsx("div", { className: "space-y-6", children: notifications.length === 0
                    ? renderEmptyState()
                    : renderNotifications() })] }));
};
const StatsSection = ({ userStats, eventsCount, notificationsCount, publicationsCount, colors }) => {
    return (_jsxs("section", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [_jsx(StatCard, { icon: _jsx(FaUsers, { style: { color: colors.greenAccent } }), title: "Active Users", value: userStats?.totalUsers || 0 }), _jsx(StatCard, { icon: _jsx(FaCalendarAlt, { style: { color: colors.blueAccent } }), title: "Active Events", value: eventsCount }), _jsx(StatCard, { icon: _jsx(FaEnvelope, { style: { color: colors.redAccent } }), title: "Pending Requests", value: notificationsCount }), _jsx(StatCard, { icon: _jsx(FaNewspaper, { style: { color: colors.yellowAccent } }), title: "News Approvals", value: publicationsCount })] }));
};
const LoadingState = ({ color }) => {
    return (_jsx("div", { className: "text-center", children: _jsx(Typography, { variant: "h4", color: color, children: "Loading your dashboard..." }) }));
};
const DashboardContent = ({ loading, userStats, events, notifications, pendingPublications, user, colors, onNavigate }) => {
    if (loading) {
        return _jsx(LoadingState, { color: colors.grey });
    }
    return (_jsxs("div", { className: "space-y-8", children: [_jsx(StatsSection, { userStats: userStats || { totalUsers: 0 }, eventsCount: events.length, notificationsCount: notifications.length, publicationsCount: pendingPublications.length, colors: colors }), _jsx(PublicationsSection, { publications: pendingPublications, colors: colors, onNavigate: onNavigate }), _jsx(NotificationsSection, { notifications: notifications, colors: colors })] }));
};
const AdminDashboard = () => {
    const theme = useTheme();
    const colours = tokens(theme?.palette?.mode) || {};
    const navigate = useNavigate();
    const colors = extractColors(colours);
    const [userStats, setUserStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [societiesData, setSocietiesData] = useState([]);
    const [pendingPublications, setPendingPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { drawer } = useSettingsStore();
    const { user, setUser } = useAuthStore();
    useEffect(() => {
        fetchData();
        fetchCurrentUser();
        fetchPendingPublications();
    }, []);
    const fetchCurrentUser = async () => {
        try {
            const response = await apiClient.get("/api/user/current/");
            setUser(response.data);
        }
        catch (error) {
            console.error("Error fetching current user:", error);
            setUser({ firstName: "User" });
        }
    };
    const fetchData = async () => {
        await fetchUserStats();
        await fetchEvents();
        await fetchNotifications();
        setLoading(false);
    };
    const fetchUserStats = async () => {
        try {
            const statsResponse = await apiClient.get("/api/dashboard/stats/");
            setUserStats(statsResponse.data || {});
        }
        catch (error) {
            console.error("Error fetching user stats:", error);
            setUserStats({});
        }
    };
    const fetchEvents = async () => {
        try {
            const eventsResponse = await apiClient.get("/api/events/all/");
            setEvents(eventsResponse.data || []);
        }
        catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        }
    };
    const fetchNotifications = async () => {
        try {
            const notificationsResponse = await apiClient.get("/api/notifications/");
            setNotifications(notificationsResponse.data || []);
        }
        catch (error) {
            console.error("Error fetching notifications:", error);
            setNotifications([]);
        }
    };
    const fetchSocieties = async () => {
        try {
            const res = await apiClient.get("/api/dashboard/all-societies");
            setSocietiesData(res.data || []);
        }
        catch (error) {
            console.error("Error fetching societies:", error);
            setSocietiesData([]);
        }
    };
    const fetchPendingPublications = async () => {
        try {
            const response = await apiClient.get("/api/news/publication-request/");
            const pendingOnly = response.data.filter((req) => req.status === "Pending");
            setPendingPublications(pendingOnly || []);
        }
        catch (error) {
            console.error("Error fetching publication requests:", error);
            setPendingPublications([]);
        }
    };
    const handleNavigate = (path) => {
        navigate(path);
    };
    const getContainerStyle = () => {
        return {
            marginTop: "64px",
            transition: "margin-left 0.3s ease-in-out",
            minHeight: "100vh",
            maxWidth: drawer ? `calc(100% - 5px)` : "100%",
            padding: "0px 0px",
            background: `${colors.primary} !important`,
        };
    };
    return (_jsx("div", { style: getContainerStyle(), children: _jsxs("div", { style: { maxWidth: "1600px", margin: "0 auto" }, children: [_jsx("header", { className: "text-center mb-16", children: _jsx(Header, { title: `Welcome to your Dashboard, ${user?.first_name || "User"}!`, subtitle: "Manage users, societies, and more." }) }), _jsx(DashboardContent, { loading: loading, userStats: userStats, events: events, notifications: notifications, pendingPublications: pendingPublications, user: user, colors: colors, onNavigate: handleNavigate })] }) }));
};
export default AdminDashboard;
