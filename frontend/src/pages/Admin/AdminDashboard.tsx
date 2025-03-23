import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button, Paper, CircularProgress, Card, CardContent, Divider } from "@mui/material";
import { FaUsers, FaCalendarAlt, FaEnvelope, FaNewspaper } from "react-icons/fa";
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Article as ArticleIcon } from "@mui/icons-material";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import { fetchPendingRequests } from "./utils";

const AdminDashboard = () => {
  const theme = useTheme();
  // Add null check for colors
  const colours = tokens(theme?.palette?.mode) || {};
  const navigate = useNavigate();

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
        marginTop: "64px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        maxWidth: drawer ? `calc(100% - 5px)` : "100%",
        padding: "0px 0px",
        background: `${primaryColor} !important`,
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <header className="text-center mb-16">
          <Header title={`Welcome to your Dashboard, ${user?.first_name || "User"}!`} subtitle="Manage users, societies, and more." />
        </header>

        {loading ? (
          <div className="text-center">
            <Typography variant="h4" color={greyColor}>
              Loading your dashboard...
            </Typography>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StatCard
                icon={<FaUsers style={{ color: greenAccentColor }} />}
                title="Active Users"
                value={userStats?.totalUsers || 0}
              />
              <StatCard
                icon={<FaCalendarAlt style={{ color: blueAccentColor }} />}
                title="Active Events"
                value={events.length}
              />
              <StatCard
                icon={<FaEnvelope style={{ color: redAccentColor }} />}
                title="Pending Requests"
                value={notifications.length}
              />
              <StatCard
                icon={<FaNewspaper style={{ color: yellowAccentColor }} />}
                title="News Approvals"
                value={pendingPublications.length}
              />
            </section>

            {/* Societies Bar Chart */}
            <section className="mb-16">
              <Typography variant="h5" color={greyColor} gutterBottom>
                Societies Overview
              </Typography>
              <div style={{ height: "300px" }}>
                <BarChart
                  data={societiesData.map((society) => ({
                    country: society?.name || "Unknown",
                    members: society?.societyMembers?.length || 0,
                  }))}
                />
              </div>
            </section>

            {/* News Publication Requests */}
            <section className="mb-16">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color={greyColor} gutterBottom>
                  News Publication Requests
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<FaNewspaper />}
                  onClick={() => navigate("/admin/news-approval")}
                  sx={{ 
                    backgroundColor: blueAccentHover,
                    '&:hover': { backgroundColor: blueAccentHoverDark }
                  }}
                >
                  View All Requests
                </Button>
              </Box>
              
              <div className="space-y-4">
                {pendingPublications.length === 0 ? (
                  <Paper sx={{ p: 3, backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
                    <Typography color={greyColorAlt}>
                      No pending publication requests.
                    </Typography>
                  </Paper>
                ) : (
                  pendingPublications.slice(0, 3).map((request) => (
                    <Card 
                      key={request.id} 
                      sx={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        mb: 2
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {request.news_post_title || 'Untitled News Post'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Society: {request.society_name || "Unknown"}
                        </Typography>
                        <Typography variant="body2" color={greyColorAlt}>
                          Requested by: {request.requester_name || "Unknown"}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="primary"
                            onClick={() => navigate(`/admin/news-approval?request=${request.id}`)}
                          >
                            Review
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {pendingPublications.length > 3 && (
                  <Box textAlign="center" mt={2}>
                    <Button 
                      variant="text" 
                      color="primary"
                      onClick={() => navigate("/admin/news-approval")}
                    >
                      View {pendingPublications.length - 3} more requests
                    </Button>
                  </Box>
                )}
              </div>
            </section>

            {/* Notifications */}
            <section className="mb-20">
              <Typography variant="h5" color={greyColor} gutterBottom>
                Notifications
              </Typography>
              <div className="space-y-6">
                {notifications.length === 0 ? (
                  <Typography color={greyColorAlt}>
                    No new notifications.
                  </Typography>
                ) : (
                  notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      message={notification.body || ""}
                      isRead={notification.is_read || false}
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