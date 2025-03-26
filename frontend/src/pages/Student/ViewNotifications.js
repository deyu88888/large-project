import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
const ViewNotifications = () => {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get("/api/notifications");
                setNotifications(response.data || []);
            }
            catch (error) {
                console.error("Error fetching notifications:", error.response?.data || error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);
    const markNotificationAsRead = async (id) => {
        try {
            const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
            if (response.status === 200) {
                setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, is_read: true } : notification));
            }
            else {
                console.error("Failed to mark notification as read");
            }
        }
        catch (error) {
            console.error("Error marking notification as read:", error);
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
                    }, children: [_jsx("h1", { style: {
                                color: isLight ? colours.grey[100] : colours.grey[100],
                                fontSize: "2.25rem",
                                fontWeight: 700,
                                marginBottom: "0.5rem",
                            }, children: "All Notifications" }), _jsx("p", { style: {
                                color: isLight ? colours.grey[300] : colours.grey[300],
                                fontSize: "1.125rem",
                                margin: 0,
                            }, children: "Stay informed about the latest updates and announcements." })] }), loading ? (_jsx("p", { style: {
                        color: isLight ? colours.grey[700] : colours.grey[300],
                        textAlign: "center",
                        fontSize: "1.125rem",
                    }, children: "Loading notifications..." })) : notifications.length === 0 ? (_jsx("p", { style: {
                        color: isLight ? colours.grey[600] : colours.grey[300],
                        textAlign: "center",
                        fontSize: "1.125rem",
                    }, children: "No new notifications." })) : (_jsx("div", { className: "space-y-6", children: notifications.map((notification) => (_jsx("div", { className: "p-5 rounded-lg shadow-md hover:shadow-lg transition-all border", style: {
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
                        }, children: _jsxs("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }, children: [_jsxs("div", { style: { color: isLight ? colours.grey[100] : colours.grey[100] }, children: [_jsx("b", { children: notification.header }), _jsx("p", { children: notification.body })] }), _jsx("div", { style: { display: "flex", gap: "1rem" }, children: notification.is_read ? (_jsx("span", { style: {
                                            color: colours.greenAccent[500],
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                        }, children: "Read" })) : (_jsx("button", { onClick: () => markNotificationAsRead(notification.id), style: {
                                            color: isLight ? colours.blueAccent[400] : colours.blueAccent[300],
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                        }, children: "Mark as Read" })) })] }) }, notification.id))) }))] }) }));
};
export default ViewNotifications;
