import React, { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useNavigate } from "react-router-dom";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  StyleProps,
  Notification,
  HeaderProps,
  LoadingStateProps,
  EmptyStateProps,
  MarkAsReadButtonProps,
  DeleteButtonProps,
  ViewReplyButtonProps,
  NotificationItemProps,
  NotificationListProps,
  PageContainerProps
} from "../../types/student/ViewInbox";

// Component Functions
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
      <h1 style={{ color: isLight ? colours.grey[100] : colours.grey[100], fontSize: "2.25rem", fontWeight: 700 }}>
        Inbox
      </h1>
      <p style={{ color: isLight ? colours.grey[300] : colours.grey[300], fontSize: "1.125rem" }}>
        The most important notifications.
      </p>
    </header>
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p style={{ color: isLight ? colours.grey[700] : colours.grey[300], textAlign: "center", fontSize: "1.125rem" }}>
      Loading notifications...
    </p>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p style={{ color: isLight ? colours.grey[600] : colours.grey[300], textAlign: "center", fontSize: "1.125rem" }}>
      No new notifications.
    </p>
  );
};

const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({ 
  notificationId, 
  notificationType = "notification", 
  onMarkAsRead, 
  styleProps 
}) => {
  const { isLight, colours } = styleProps;
  
  return (
    <button
      onClick={() => onMarkAsRead(notificationId, notificationType)}
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

const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  notificationId, 
  notificationType = "notification", 
  onDelete, 
  styleProps 
}) => {
  const { isLight, colours } = styleProps;
  
  return (
    <button
      onClick={() => onDelete(notificationId, notificationType)}
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
  );
};

const ViewReplyButton: React.FC<ViewReplyButtonProps> = ({ reportId, onNavigate, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <button
      onClick={() => onNavigate(`/student/report-thread/${reportId}`)}
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
  );
};

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onNavigate, 
  styleProps 
}) => {
  const { isLight, colours } = styleProps;
  
  const getBackgroundColor = () => {
    if (notification.is_read) {
      return isLight ? colours.primary[400] : colours.primary[400];
    }
    return isLight ? colours.blueAccent[700] : colours.blueAccent[700];
  };
  
  const getBorderColor = () => {
    if (notification.is_read) {
      return isLight ? colours.grey[300] : colours.grey[700];
    }
    return isLight ? colours.blueAccent[400] : colours.blueAccent[400];
  };
  
  return (
    <div
      className="p-5 rounded-lg shadow-md hover:shadow-lg transition-all border"
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
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
            <MarkAsReadButton 
              notificationId={notification.id}
              notificationType={notification.type}
              onMarkAsRead={onMarkAsRead}
              styleProps={styleProps}
            />
          )}
          <DeleteButton 
            notificationId={notification.id}
            notificationType={notification.type}
            onDelete={onDelete}
            styleProps={styleProps}
          />
        </div>
      </div>

      {notification.type === "report_reply" && notification.report_id && (
        <ViewReplyButton 
          reportId={notification.report_id}
          onNavigate={onNavigate}
          styleProps={styleProps}
        />
      )}
    </div>
  );
};

const NotificationList: React.FC<NotificationListProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onDelete, 
  onNavigate, 
  styleProps 
}) => {
  return (
    <div className="space-y-6">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          onNavigate={onNavigate}
          styleProps={styleProps}
        />
      ))}
    </div>
  );
};

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

// Data Fetching Functions
const fetchInboxNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get("/api/notifications/inbox/");
  return response.data || [];
};

const fetchReplyNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get("/api/reports/reply-notifications");
  return response.data || [];
};

const combineAndSortNotifications = (
  inboxNotifications: Notification[], 
  replyNotifications: Notification[]
): Notification[] => {
  const allNotifications = [...inboxNotifications, ...replyNotifications];
  return allNotifications.sort((a, b) => {
    const dateA = a.created_at || a.send_time || "";
    const dateB = b.created_at || b.send_time || "";
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
};

// Custom Hook for Notification Management
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const inboxData = await fetchInboxNotifications();
      const replyNotificationsData = await fetchReplyNotifications();
      const sortedNotifications = combineAndSortNotifications(inboxData, replyNotificationsData);
      setNotifications(sortedNotifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllNotifications();
  }, []);
  
  const markAsRead = async (id: number, type: string = "notification") => {
    try {
      if (type === "report_reply") {
        const response = await apiClient.patch(`/api/reports/reply-notifications/${id}`);
        if (response.status === 200) {
          updateNotificationReadStatus(id, type);
        }
      } else {
        const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
        if (response.status === 200) {
          updateNotificationReadStatus(id);
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const updateNotificationReadStatus = (id: number, type?: string) => {
    setNotifications((prev) =>
      prev.map((notification) => {
        if (notification.id === id) {
          if (type && notification.type !== type) {
            return notification;
          }
          return { ...notification, is_read: true };
        }
        return notification;
      })
    );
  };
  
  const deleteNotification = async (id: number, type: string = "notification") => {
    try {
      if (type === "report_reply") {
        const response = await apiClient.delete(`/api/reports/reply-notifications/${id}`);
        if (response.status === 204 || response.status === 200) {
          removeNotificationFromList(id, type);
        }
      } else {
        const response = await apiClient.delete(`/api/notifications/inbox/${id}`);
        if (response.status === 204 || response.status === 200) {
          removeNotificationFromList(id);
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };
  
  const removeNotificationFromList = (id: number, type?: string) => {
    setNotifications((prev) => 
      prev.filter((notification) => {
        if (type) {
          return !(notification.id === id && notification.type === type);
        }
        return notification.id !== id;
      })
    );
  };
  
  return {
    notifications,
    loading,
    markAsRead,
    deleteNotification
  };
};

// Main Component
const ViewInbox: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();
  const styleProps = { isLight, colours };
  
  const { notifications, loading, markAsRead, deleteNotification } = useNotifications();
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };
  
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
        onDelete={deleteNotification}
        onNavigate={handleNavigate}
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

export default ViewInbox;