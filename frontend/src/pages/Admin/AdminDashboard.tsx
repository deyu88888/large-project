import { useState, useEffect, FC, useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Paper,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  FaUsers,
  FaCalendarAlt,
  FaEnvelope,
  FaNewspaper,
  FaSync,
} from "react-icons/fa";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import {
  Event,
  Notification,
  UserStats,
  Publication,
  StatCardProps,
  NotificationCardProps,
  PublicationSectionProps,
  NotificationsSectionProps,
  DashboardContentProps,
  StatsSectionProps,
} from "../../types/admin/dashboard";
import { color } from "framer-motion";

const StatCard: FC<StatCardProps> = ({ icon, title, value }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);

  return (
    <Box
      className="p-6 rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <Box display="flex" alignItems="center" mb="16px">
        {icon}
        <Typography variant="h6" style={{ marginLeft: "12px" }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  );
};

const NotificationCard: FC<NotificationCardProps> = ({ message, isRead }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  return (
    <Box
      className="p-5 rounded-lg shadow-md transition-all"
      style={{
        backgroundColor: isRead
          ? "rgba(0, 128, 0, 0.1)"
          : "rgba(255, 0, 0, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <Typography>{message}</Typography>
    </Box>
  );
};

const PublicationsSection: FC<PublicationSectionProps> = ({
  publications,
  onNavigate,
}) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const renderEmptyState = () => {
    return (
      <Paper sx={{ p: 3, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
        <Typography color={colours.grey[300]}>
          No pending publication requests.
        </Typography>
      </Paper>
    );
  };

  const renderPublicationCard = (request: Publication) => {
    return (
      <Card
        key={request.id}
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          mb: 2,
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {request.news_post_title || "Untitled News Post"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Society: {request.society_name || "Unknown"}
          </Typography>
          <Typography variant="body2" color={colours.grey[300]}>
            Requested by: {request.requester_name || "Unknown"}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() =>
                onNavigate(`/admin/news-approval?request=${request.id}`)
              }
            >
              Review
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderMoreButton = () => {
    if (publications.length <= 3) return null;

    return (
      <Box textAlign="center" mt={2}>
        <Button
          variant="text"
          color="primary"
          onClick={() => onNavigate("/admin/news-approval")}
        >
          View {publications.length - 3} more requests
        </Button>
      </Box>
    );
  };

  return (
    <section className="mb-16">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" color={colours.grey[300]} gutterBottom>
          News Publication Requests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FaNewspaper />}
          onClick={() => onNavigate("/admin/news-approval")}
          sx={{
            backgroundColor: colours.blueAccent[600],
            "&:hover": { backgroundColor: colours.blueAccent[700] },
          }}
        >
          View All Requests
        </Button>
      </Box>

      <div className="space-y-4">
        {publications.length === 0
          ? renderEmptyState()
          : publications.slice(0, 3).map(renderPublicationCard)}

        {renderMoreButton()}
      </div>
    </section>
  );
};

const NotificationsSection: FC<NotificationsSectionProps> = ({
  notifications,
}) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const renderEmptyState = () => {
    return (
      <Typography color={colours.grey[300]}>No new notifications.</Typography>
    );
  };

  const renderNotifications = () => {
    return notifications.map((notification) => (
      <NotificationCard
        key={notification.id}
        message={notification.body || ""}
        isRead={notification.is_read || false}
      />
    ));
  };

  return (
    <section className="mb-20">
      <Typography variant="h5" color={colours.grey[300]} gutterBottom>
        Notifications
      </Typography>
      <div className="space-y-6">
        {notifications.length === 0
          ? renderEmptyState()
          : renderNotifications()}
      </div>
    </section>
  );
};

const StatsSection: FC<StatsSectionProps> = ({
  userStats,
  eventsCount,
  notificationsCount,
  publicationsCount,
}) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <StatCard
        icon={<FaUsers style={{ color: colours.greenAccent[400] }} />}
        title="Active Users"
        value={userStats?.totalUsers || 0}
      />
      <StatCard
        icon={<FaCalendarAlt style={{ color: colours.blueAccent[500] }} />}
        title="Active Events"
        value={eventsCount}
      />
      <StatCard
        icon={<FaEnvelope style={{ color: colours.redAccent[500] }} />}
        title="Pending Requests"
        value={notificationsCount}
      />
      <StatCard
        icon={<FaNewspaper style={{ color: colours.yellowAccent[500] }} />}
        title="News Approvals"
        value={publicationsCount}
      />
    </section>
  );
};

const LoadingState: FC<{ color: string }> = ({ color }) => {
  return (
    <div className="text-center">
      <CircularProgress color="secondary" sx={{ mb: 2 }} />
      <Typography variant="h4" color={color}>
        Loading your dashboard...
      </Typography>
    </div>
  );
};

const DashboardContent: FC<DashboardContentProps> = ({
  loading,
  userStats,
  events,
  notifications,
  pendingPublications,
  colors,
  onNavigate,
}) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  
  if (loading) {
    return <LoadingState color={colours.grey[300]} />;
  }

  return (
    <div className="space-y-8">
      <StatsSection
        userStats={userStats || { totalUsers: 0 }}
        eventsCount={events.length}
        notificationsCount={notifications.length}
        publicationsCount={pendingPublications.length}
        colors={colors}
      />

      <PublicationsSection
        publications={pendingPublications}
        colors={colors}
        onNavigate={onNavigate}
      />

      <NotificationsSection notifications={notifications} colors={colors} />
    </div>
  );
};

const AdminDashboard: FC = () => {
  const theme = useTheme();
  const colours = tokens(theme?.palette?.mode) || {};
  const navigate = useNavigate();

  const { drawer } = useSettingsStore();
  const { user, setUser } = useAuthStore();
  
  
  const fetchDashboardData = async () => {
    try {
      
      const [statsResponse, eventsResponse, notificationsResponse, publicationResponse] = await Promise.all([
        apiClient.get("/api/dashboard/stats/"),
        apiClient.get("/api/events/all/"),
        apiClient.get("/api/notifications/"),
        apiClient.get("/api/news/publication-request/")
      ]);
      
      
      const pendingOnly = publicationResponse.data.filter(
        (req: any) => req.status === "Pending"
      );
      
      
      return {
        userStats: statsResponse.data || { totalUsers: 0 },
        events: eventsResponse.data || [],
        notifications: notificationsResponse.data || [],
        pendingPublications: pendingOnly || []
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return {
        userStats: { totalUsers: 0 },
        events: [],
        notifications: [],
        pendingPublications: []
      };
    }
  };

  
  const { 
    data: dashboardData, 
    loading, 
    error,
    refresh, 
    isConnected 
  } = useWebSocketChannel(
    'dashboard_stats',
    fetchDashboardData
  );

  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (error) {
      setErrorMessage(`Error loading dashboard data: ${error}`);
    } else {
      setErrorMessage(null);
    }
  }, [error]);

  
  const userStats = dashboardData?.userStats || null;
  const events = dashboardData?.events || [];
  const notifications = dashboardData?.notifications || [];
  const pendingPublications = dashboardData?.pendingPublications || [];

  
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get("/api/user/current/");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
      setUser(null);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const getContainerStyle = () => {
    return {
      marginTop: "64px",
      transition: "margin-left 0.3s ease-in-out",
      minHeight: "100vh",
      maxWidth: drawer ? `calc(100% - 5px)` : "100%",
      padding: "0px 0px",
      background: `${color} !important`,
    };
  };

  return (
    <div style={getContainerStyle()}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          className="mb-8"
        >
          <Header
            title={`Welcome to your Dashboard, ${user?.first_name ?? "User"}!`}
            subtitle="Manage users, societies, and more."
          />
        </Box>
        {errorMessage && (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: 2
            }}
          >
            <Typography color="error">{errorMessage}</Typography>
          </Paper>
        )}
        <DashboardContent
          loading={loading}
          userStats={userStats}
          events={events}
          notifications={notifications}
          pendingPublications={pendingPublications}
          user={user}
          colors={colours as any}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;