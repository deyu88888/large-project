import React, { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../styles/theme";

const ViewNotifications: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/notifications");
      setNotifications(response.data || []);
    } catch (error: any) {
      console.error(
        "Error fetching notifications:",
        error.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
          <h1
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "2.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            All Notifications
          </h1>
          <p
            style={{
              color: isLight ? colours.grey[300] : colours.grey[300],
              fontSize: "1.125rem",
              margin: 0,
            }}
          >
            Stay informed about the latest updates and announcements.
          </p>
        </header>

        {loading ? (
          <p
            style={{
              color: isLight ? colours.grey[700] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p
            style={{
              color: isLight ? colours.grey[600] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p style={{ color: isLight ? colours.grey[100] : colours.grey[100] }}>
                    {notification.message}
                  </p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {notification.is_read ? (
                      <span
                        style={{
                          color: colours.greenAccent[500],
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        Read
                      </span>
                    ) : (
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewNotifications;
