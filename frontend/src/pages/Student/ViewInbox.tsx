import React, { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useNavigate } from "react-router-dom";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

const ViewInbox: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInboxData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/inbox");
        const inboxData = response.data || [];
        const replyNotificationsResponse = await apiClient.get("/api/report-reply-notifications");
        const replyNotificationsData = replyNotificationsResponse.data || [];
        const allNotifications = [...inboxData, ...replyNotificationsData];
        allNotifications.sort((a, b) => {
          const dateA = a.created_at || a.send_time;
          const dateB = b.created_at || b.send_time;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        setNotifications([...inboxData, ...replyNotificationsData]);
      } catch (error: any) {
        console.error("Error fetching notifications:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchInboxData();
  }, []);

  const markNotificationAsRead = async (id: number, type: string = "notification") => {
    try {
      if (type === "report_reply") {
        const response = await apiClient.patch(`/api/report-reply-notifications/${id}`);
        if (response.status === 200) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === id && notification.type === "report_reply" 
                ? { ...notification, is_read: true } 
                : notification
            )
          );
        }
      } else {
        const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
        if (response.status === 200) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === id 
                ? { ...notification, is_read: true } 
                : notification
            )
          );
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: number, type: string = "notification") => {
    try {
      if (type === "report_reply") {
        const response = await apiClient.delete(`/api/report-reply-notifications/${id}`);
        if (response.status === 204 || response.status === 200) {
          setNotifications((prev) => 
            prev.filter((notification) => 
              !(notification.id === id && notification.type === "report_reply")
            )
          );
        }
      } else {
        const response = await apiClient.delete(`/api/inbox/${id}`);
        if (response.status === 204 || response.status === 200) {
          setNotifications((prev) => 
            prev.filter((notification) => notification.id !== id)
          );
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div
      style={{
        marginLeft: "0px",
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "20px 40px",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        <header
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            padding: "2rem 0",
          }}
        >
          <h1 style={{ color: isLight ? colours.grey[100] : colours.grey[100], fontSize: "2.25rem", fontWeight: 700 }}>
            Inbox
          </h1>
          <p style={{ color: isLight ? colours.grey[300] : colours.grey[300], fontSize: "1.125rem" }}>
          The most important notifications.
          </p>
        </header>

        {loading ? (
          <p style={{ color: isLight ? colours.grey[700] : colours.grey[300], textAlign: "center", fontSize: "1.125rem" }}>
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p style={{ color: isLight ? colours.grey[600] : colours.grey[300], textAlign: "center", fontSize: "1.125rem" }}>
            No new notifications.
          </p>
        ) : (
          <div className="space-y-6">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-5 rounded-lg shadow-md hover:shadow-lg transition-all border"
                style={{
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
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: isLight ? colours.grey[100] : colours.grey[100] }}>
                    <b>{notification.header}</b>
                    <p>{notification.body}</p>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {notification.is_read ? (
                      <span style={{ color: colours.greenAccent[500], fontSize: "0.875rem", fontWeight: 500 }}>
                        Read
                      </span>
                    ) : (
                      <button
                        onClick={() => markNotificationAsRead(notification.id, notification.type)}
                        style={{
                          color: isLight ? colours.blueAccent[400] : colours.blueAccent[300],
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id, notification.type)}
                      style={{
                        color: isLight ? colours.redAccent[400] : colours.redAccent[300],
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Delete notification"
                    >
                      <DeleteOutlinedIcon />
                    </button>
                  </div>
                </div>

                {notification.type === "report_reply" && (
                  <button
                    onClick={() => navigate(`/student/report-thread/${notification.report_id}`)}
                    style={{
                      marginTop: "1rem",
                      color: colours.blueAccent[400],
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    View Reply
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInbox;