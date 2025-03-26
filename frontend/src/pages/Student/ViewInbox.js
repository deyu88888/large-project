import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useNavigate } from "react-router-dom";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
const ViewInbox = () => {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchInboxData = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get("/api/notifications/inbox/");
                const inboxData = response.data || [];
                const replyNotificationsResponse = await apiClient.get("/api/reports/reply-notifications");
                const replyNotificationsData = replyNotificationsResponse.data || [];
                const allNotifications = [...inboxData, ...replyNotificationsData];
                allNotifications.sort((a, b) => {
                    const dateA = a.created_at || a.send_time;
                    const dateB = b.created_at || b.send_time;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });
                setNotifications([...inboxData, ...replyNotificationsData]);
            }
            catch (error) {
                console.error("Error fetching notifications:", error.response?.data || error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchInboxData();
    }, []);
    const markNotificationAsRead = async (id, type = "notification") => {
        try {
            if (type === "report_reply") {
                const response = await apiClient.patch(`/api/reports/reply-notifications/${id}`);
                if (response.status === 200) {
                    setNotifications((prev) => prev.map((notification) => notification.id === id && notification.type === "report_reply"
                        ? { ...notification, is_read: true }
                        : notification));
                }
            }
            else {
                const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
                if (response.status === 200) {
                    setNotifications((prev) => prev.map((notification) => notification.id === id
                        ? { ...notification, is_read: true }
                        : notification));
                }
            }
        }
        catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };
    const deleteNotification = async (id, type = "notification") => {
        try {
            if (type === "report_reply") {
                const response = await apiClient.delete(`/api/reports/reply-notifications/${id}`);
                if (response.status === 204 || response.status === 200) {
                    setNotifications((prev) => prev.filter((notification) => !(notification.id === id && notification.type === "report_reply")));
                }
            }
            else {
                const response = await apiClient.delete(`/api/notifications/inbox/${id}`);
                if (response.status === 204 || response.status === 200) {
                    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
                }
            }
        }
        catch (error) {
            console.error("Error deleting notification:", error);
        }
    };
    return (_jsx("div", { style: {
            marginLeft: "0px",
            marginTop: "0px",
            transition: "margin-left 0.3s ease-in-out",
            minHeight: "100vh",
            padding: "20px 40px",
            backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
        }, children: _jsxs("div", { style: { maxWidth: "1920px", margin: "0 auto" }, children: [_jsxs("header", { style: {
                        textAlign: "center",
                        marginBottom: "2.5rem",
                        padding: "2rem 0",
                    }, children: [_jsx("h1", { style: { color: isLight ? colours.grey[100] : colours.grey[100], fontSize: "2.25rem", fontWeight: 700 }, children: "Inbox" }), _jsx("p", { style: { color: isLight ? colours.grey[300] : colours.grey[300], fontSize: "1.125rem" }, children: "The most important notifications." })] }), loading ? (_jsx("p", { style: { color: isLight ? colours.grey[700] : colours.grey[300], textAlign: "center", fontSize: "1.125rem" }, children: "Loading notifications..." })) : notifications.length === 0 ? (_jsx("p", { style: { color: isLight ? colours.grey[600] : colours.grey[300], textAlign: "center", fontSize: "1.125rem" }, children: "No new notifications." })) : (_jsx("div", { className: "space-y-6", children: notifications.map((notification) => (_jsxs("div", { className: "p-5 rounded-lg shadow-md hover:shadow-lg transition-all border", style: {
                            backgroundColor: notification.is_read
                                ? isLight
                                    ? colours.primary[400]
                                    : colours.primary[400]
                                : isLight
                                    ? colours.blueAccent[700]
                                    : colours.blueAccent[700],
                            borderColor: notification.is_read
                                ? isLight
                                    ? colours.grey[300]
                                    : colours.grey[700]
                                : isLight
                                    ? colours.blueAccent[400]
                                    : colours.blueAccent[400],
                        }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { style: { color: isLight ? colours.grey[100] : colours.grey[100] }, children: [_jsx("b", { children: notification.header }), _jsx("p", { children: notification.body })] }), _jsxs("div", { style: { display: "flex", gap: "1rem", alignItems: "center" }, children: [notification.is_read ? (_jsx("span", { style: { color: colours.greenAccent[500], fontSize: "0.875rem", fontWeight: 500 }, children: "Read" })) : (_jsx("button", { onClick: () => markNotificationAsRead(notification.id, notification.type), style: {
                                                    color: isLight ? colours.blueAccent[400] : colours.blueAccent[300],
                                                    fontSize: "0.875rem",
                                                    fontWeight: 500,
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    textDecoration: "underline",
                                                }, children: "Mark as Read" })), _jsx("button", { onClick: () => deleteNotification(notification.id, notification.type), style: {
                                                    color: isLight ? colours.redAccent[400] : colours.redAccent[300],
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                }, title: "Delete notification", children: _jsx(DeleteOutlinedIcon, {}) })] })] }), notification.type === "report_reply" && (_jsx("button", { onClick: () => navigate(`/student/report-thread/${notification.report_id}`), style: {
                                    marginTop: "1rem",
                                    color: colours.blueAccent[400],
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                }, children: "View Reply" }))] }, notification.id))) }))] }) }));
};
export default ViewInbox;
