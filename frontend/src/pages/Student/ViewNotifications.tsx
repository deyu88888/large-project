import React, { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import {
  Notification,
  StyleProps,
  PageContainerProps,
  HeaderProps,
  LoadingStateProps,
  EmptyStateProps,
  MarkAsReadButtonProps,
  ReadStatusProps,
  NotificationItemProps,
  NotificationListProps
} from "../../types/student/ViewNotifications";

// Component Functions
const PageContainer: React.FC<PageContainerProps> = ({ children, styleProps }) => {
  const { isLight, colours } = styleProps;
  
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
        {children}
      </div>
    </div>
  );
};

const PageHeader: React.FC<HeaderProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
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
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p
      style={{
        color: isLight ? colours.grey[700] : colours.grey[300],
        textAlign: "center",
        fontSize: "1.125rem",
      }}
    >
      Loading notifications...
    </p>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p
      style={{
        color: isLight ? colours.grey[600] : colours.grey[300],
        textAlign: "center",
        fontSize: "1.125rem",
      }}
    >
      No new notifications.
    </p>
  );
};

const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({ onMarkAsRead, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <button
      onClick={onMarkAsRead}
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
  );
};

const ReadStatus: React.FC<ReadStatusProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <span
      style={{
        color: colours.greenAccent[500],
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      Read
    </span>
  );
};

const getNotificationBackgroundColor = (
  isRead: boolean, 
  isLight: boolean, 
  colours: ReturnType<typeof tokens>
): string => {
  if (isRead) {
    return colours.primary[400];
  }
  return colours.blueAccent[700];
};

const getNotificationBorderColor = (
  isRead: boolean, 
  isLight: boolean, 
  colours: ReturnType<typeof tokens>
): string => {
  if (isRead) {
    return isLight ? colours.grey[300] : colours.grey[700];
  }
  return isLight ? colours.blueAccent[400] : colours.blueAccent[400];
};

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  styleProps 
}) => {
  const { isLight, colours } = styleProps;
  
  const backgroundColor = getNotificationBackgroundColor(
    notification.is_read, 
    isLight, 
    colours
  );
  
  const borderColor = getNotificationBorderColor(
    notification.is_read, 
    isLight, 
    colours
  );
  
  return (
    <div
      className="p-5 rounded-lg shadow-md hover:shadow-lg transition-all border"
      style={{
        backgroundColor,
        borderColor,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ color: isLight ? colours.grey[100] : colours.grey[100] }}>
          <b>{notification.header}</b>
          <p>{notification.body}</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {notification.is_read ? (
            <ReadStatus styleProps={styleProps} />
          ) : (
            <MarkAsReadButton 
              onMarkAsRead={() => onMarkAsRead(notification.id)} 
              styleProps={styleProps} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationList: React.FC<NotificationListProps> = ({ 
  notifications, 
  onMarkAsRead, 
  styleProps 
}) => {
  return (
    <div className="space-y-6">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          styleProps={styleProps}
        />
      ))}
    </div>
  );
};

// API Functions
const fetchNotificationsFromAPI = async (): Promise<Notification[]> => {
  const response = await apiClient.get("/api/notifications");
  return response.data || [];
};

const markNotificationAsReadAPI = async (id: number): Promise<boolean> => {
  const response = await apiClient.patch(`/api/notifications/${id}/`, { is_read: true });
  return response.status === 200;
};

// Custom Hooks
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotificationsFromAPI();
      setNotifications(data);
    } catch (error: any) {
      console.error("Error fetching notifications:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const markAsRead = async (id: number) => {
    try {
      const success = await markNotificationAsReadAPI(id);
      if (success) {
        updateNotificationReadStatus(id);
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const updateNotificationReadStatus = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      )
    );
  };
  
  return {
    notifications,
    loading,
    markAsRead
  };
};

// Main Component
const ViewNotifications: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const styleProps = { isLight, colours };
  
  const { notifications, loading, markAsRead } = useNotifications();
  
  const renderContent = () => {
    if (loading) {
      return <LoadingState styleProps={styleProps} />;
    }
    
    if (notifications.length === 0) {
      return <EmptyState styleProps={styleProps} />;
    }
    
    return (
      <NotificationList
        notifications={notifications}
        onMarkAsRead={markAsRead}
        styleProps={styleProps}
      />
    );
  };
  
  return (
    <PageContainer styleProps={styleProps}>
      <PageHeader styleProps={styleProps} />
      {renderContent()}
    </PageContainer>
  );
};

export default ViewNotifications;