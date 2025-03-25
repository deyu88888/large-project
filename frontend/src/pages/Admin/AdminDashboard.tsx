import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { FaUsers, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";
import { apiPaths } from "../../api/apiPaths";

const AdminDashboard = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);

  const [userStats, setUserStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [societiesData, setSocietiesData] = useState<any[]>([]);
  const [pendingPublications, setPendingPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiCallsAttempted, setApiCallsAttempted] = useState(false);

  const { drawer } = useSettingsStore();
  const { user, setUser } = useAuthStore();

  // Only attempt API calls once to prevent infinite loops
  useEffect(() => {
    if (!apiCallsAttempted) {
      console.log("AdminDashboard: Making initial API calls");
      fetchCurrentUser();
      fetchData();
      fetchSocieties();
      fetchPendingPublications();
      setApiCallsAttempted(true);
    }
  }, [apiCallsAttempted]);

  const fetchCurrentUser = async () => {
    try {
      console.log("AdminDashboard: Fetching current user");
      const response = await apiClient.get(apiPaths.USER.CURRENT);
      console.log("AdminDashboard: Current user fetch successful");
      setUser(response.data);
    } catch (error) {
      console.error("AdminDashboard: Error fetching current user:", error);
      // Initialize with a default value to prevent errors
      setUser({ firstName: "User", first_name: "User" });
    }
  };

  const fetchData = async () => {
    console.log("AdminDashboard: Fetching dashboard data");
    
    try {
      // Try to get dashboard stats
      const statsResponse = await apiClient.get("/api/dashboard/stats/");
      setUserStats(statsResponse.data || {});
      console.log("AdminDashboard: Stats data fetched successfully");
    } catch (error) {
      console.error("AdminDashboard: Error fetching stats data:", error);
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        totalSocieties: 0,
        totalEvents: 0
      });
    }
    
    try {
      // Try to get events
      const eventsResponse = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
      setEvents(eventsResponse.data || []);
      console.log("AdminDashboard: Events data fetched successfully");
    } catch (error) {
      console.error("AdminDashboard: Error fetching events:", error);
      setEvents([]);
    }
    
    try {
      // Try to get notifications
      const notificationsResponse = await apiClient.get("/api/notifications/");
      setNotifications(notificationsResponse.data || []);
      console.log("AdminDashboard: Notifications fetched successfully");
    } catch (error) {
      console.error("AdminDashboard: Error fetching notifications:", error);
      setNotifications([]);
    }
    
    // Finish loading regardless of API success/failure
    setLoading(false);
  };

  const fetchSocieties = async () => {
    try {
      console.log("AdminDashboard: Fetching societies");
      const res = await apiClient.get(apiPaths.USER.SOCIETY);
      setSocietiesData(res.data || []);
      console.log("AdminDashboard: Societies fetched successfully");
    } catch (error) {
      console.error("AdminDashboard: Error fetching societies:", error);
      setSocietiesData([]);
    }
  };

  const fetchPendingPublications = async () => {
    try {
      console.log("AdminDashboard: Fetching pending publications");
      const response = await apiClient.get("/api/news/publication-request/");
      const pendingOnly = response.data.filter((req: any) => req.status === "Pending");
      setPendingPublications(pendingOnly || []);
      console.log("AdminDashboard: Pending publications fetched successfully");
    } catch (error) {
      console.error("AdminDashboard: Error fetching publication requests:", error);
      setPendingPublications([]);
    }
  };

  interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
  }

  const StatCard = ({ icon, title, value }: StatCardProps) => {
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

  interface NotificationCardProps {
    message: string;
    isRead: boolean;
  }

  const NotificationCard = ({ message, isRead }: NotificationCardProps) => {
    return (
      <Box
        className="p-5 rounded-lg shadow-md transition-all"
        style={{
          backgroundColor: isRead ? "rgba(0, 128, 0, 0.1)" : "rgba(255, 0, 0, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Typography>{message}</Typography>
      </Box>
    );
  };

  // Simple fallback BarChart component in case the actual one isn't available
  const BarChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) {
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100%" 
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <Typography color={greyColorAlt}>No society data available</Typography>
        </Box>
      );
    }

    return (
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="flex-end" 
        height="100%" 
        padding="20px"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      >
        {data.map((item, index) => (
          <Box 
            key={index} 
            display="flex" 
            flexDirection="column" 
            alignItems="center"
            width={`${100 / (data.length * 2)}%`}
            marginX={1}
          >
            <Box 
              width="100%" 
              height={`${(item.members / Math.max(...data.map(d => d.members))) * 200}px`}
              style={{ backgroundColor: blueAccentColor, borderRadius: "4px 4px 0 0" }} 
            />
            <Typography variant="body2" style={{ marginTop: "8px", textAlign: "center", fontSize: "10px" }}>
              {item.country}
            </Typography>
            <Typography variant="body2" style={{ fontSize: "8px" }}>
              {item.members}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Ensure we have fallback colors
  const greenAccentColor = colours?.greenAccent?.[500] || "#4caf50";
  const blueAccentColor = colours?.blueAccent?.[500] || "#2196f3";
  const redAccentColor = colours?.redAccent?.[500] || "#f44336";
  const yellowAccentColor = colours?.yellowAccent?.[500] || "#ffeb3b";
  const greyColor = colours?.grey?.[100] || "#f5f5f5";
  const greyColorAlt = colours?.grey?.[300] || "#e0e0e0";
  const primaryColor = colours?.primary?.[400] || "#121212";
  const blueAccentHover = colours?.blueAccent?.[600] || "#1976d2";
  const blueAccentHoverDark = colours?.blueAccent?.[700] || "#0d47a1";

  return (
    <div
      style={{
        // marginLeft: `${sidebarWidth}px`,
        marginTop: "64px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        maxWidth: drawer ? `calc(100% - 5px)` : "100%",
        padding: "0px 0px",
        background: `${colours.primary[400]} !important`,
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <header className="text-center mb-16">
          <Header title={`Welcome to your Dashboard, ${user?.first_name || "User"}!`} subtitle="Manage users, societies, and more." />
        </header>

        {loading ? (
          <div className="text-center">
            <Typography variant="h4" color={colours.grey[100]}>
              Loading your dashboard...
            </Typography>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard
                icon={<FaUsers style={{ color: colours.greenAccent[500] }} />}
                title="Active Users"
                value={userStats?.totalUsers || 0}
              />
              <StatCard
                icon={<FaCalendarAlt style={{ color: colours.blueAccent[500] }} />}
                title="Active Events"
                value={events.length}
              />
              <StatCard
                icon={<FaEnvelope style={{ color: colours.redAccent[500] }} />}
                title="Pending Requests"
                value={notifications.length}
              />
            </section>

            {/* Notifications */}
            <section className="mb-20">
              <Typography variant="h5" color={colours.grey[100]} gutterBottom>
                Notifications
              </Typography>
              <div className="space-y-6">
                {notifications.length === 0 ? (
                  <Typography color={colours.grey[300]}>
                    No new notifications.
                  </Typography>
                ) : (
                  notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      message={notification.body}
                      isRead={notification.is_read}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;