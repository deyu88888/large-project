import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { FaUsers, FaCalendarAlt, FaEnvelope } from "react-icons/fa";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";
import { StatCardProps, NotificationCardProps } from '../../types/admin/dashboard';

/**
 * StatCard component to display dashboard stats
 */
const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => {
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

/**
 * NotificationCard component to display notifications
 */
const NotificationCard: React.FC<NotificationCardProps> = ({ message, isRead }) => {
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

/**
 * AdminDashboard component displays the admin dashboard with statistics and notifications
 */
const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const { user, setUser } = useAuthStore();

  // State management
  const [userStats, setUserStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch current user information
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get(apiPaths.USER.USERSTATS);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  }, [setUser]);

  /**
   * Fetch dashboard data
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statsResponse = await apiClient.get(apiPaths.USER.USERSTATS);
      setUserStats(statsResponse.data || {});
      const eventsResponse = await apiClient.get("/api/admin/events/");
      setEvents(eventsResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    try {
      const notificationsResponse = await apiClient.get("/api/notifications");
      setNotifications(notificationsResponse.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
    setLoading(false);
  }, []);

  /**
   * Fetch societies data
   */
  const fetchSocieties = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/admin/societies");
      // setSocietiesData(res.data);
      console.log("Societies data:", res.data); // For now, just log the data
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // fetchSocieties(); // TODO: implement this?
    fetchCurrentUser();
  }, [fetchData, fetchSocieties, fetchCurrentUser]);

  return (
    <div
      style={{
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