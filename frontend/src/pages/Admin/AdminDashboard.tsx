import React, { useState, useEffect } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { FaChartPie, FaUsers, FaCalendarAlt, FaBell, FaEnvelope } from "react-icons/fa";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import BarChart from "../../components/graphs/BarChart";
import { tokens } from "../../theme/theme";
import { useSidebar } from "../../components/layout/SidebarContext";
import { apiClient } from "../../api";
import StatBox from "../../components/graphs/StatBox";

const AdminDashboard = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const { sidebarWidth } = useSidebar();

  const [userStats, setUserStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [societiesData, setSocietiesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchSocieties();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsResponse = await apiClient.get("/api/admin/user-stats/");
      setUserStats(statsResponse.data || {});
      const eventsResponse = await apiClient.get("/api/admin/events/");
      setEvents(eventsResponse.data || []);
      const notificationsResponse = await apiClient.get("/api/notifications");
      setNotifications(notificationsResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await apiClient.get("/api/admin/societies");
      setSocietiesData(res.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  const chartData = societiesData.map((society: { name: string; societyMembers: any[] }) => ({
    country: society.name,
    members: society.societyMembers.length,
  }));

  return (
    <Box m="5px" style={{ marginLeft: `125px` }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Header title="ADMIN DASHBOARD" subtitle="Manage users, societies, and more." />
        <Button
          sx={{
            backgroundColor: colours.blueAccent[700],
            color: colours.grey[100],
            padding: "10px 20px",
            fontWeight: "bold",
          }}
        >
          <DownloadOutlinedIcon sx={{ mr: "10px" }} />
          Download Reports
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gridAutoRows="140px" gap="20px">
        <Box gridColumn="span 3" backgroundColor={colours.primary[400]} display="flex" p="20px" height="100%" alignItems="center">
          <Box display="flex" flexDirection="column" alignItems="center" mr="20px">
            <FaUsers style={{ color: colours.greenAccent[500], fontSize: "26px" }} />
            <Typography variant="h6" color={colours.grey[100]} mt="10px">Active Users</Typography>
            <Typography variant="body2" color={colours.grey[400]} mt="5px">Monthly Revenue</Typography>
          </Box>
          <StatBox value={userStats?.totalUsers || 0} progress={0.8} increase="+18%" subtitle="" />
        </Box>

        <Box gridColumn="span 3" backgroundColor={colours.primary[400]} display="flex" p="20px" height="100%" alignItems="center">
          <Box display="flex" flexDirection="column" alignItems="center" mr="20px">
            <FaCalendarAlt style={{ color: colours.blueAccent[500], fontSize: "26px" }} />
            <Typography variant="h6" color={colours.grey[100]} mt="10px">Active Events</Typography>
            <Typography variant="body2" color={colours.grey[400]} mt="5px">Monthly Revenue</Typography>
          </Box>
          <StatBox value={events.length} progress={0.75} increase="+18%" subtitle="" />
        </Box>

        <Box gridColumn="span 3" backgroundColor={colours.primary[400]} display="flex" p="20px" height="100%" alignItems="center">
          <Box display="flex" flexDirection="column" alignItems="center" mr="20px">
            <FaEnvelope style={{ color: colours.redAccent[500], fontSize: "26px" }} />
            <Typography variant="h6" color={colours.grey[100]} mt="10px">Pending requests</Typography>
            <Typography variant="body2" color={colours.grey[400]} mt="5px">Monthly Revenue</Typography>
          </Box>
          <StatBox progress={0.6} increase="+35%" subtitle="" />
        </Box>

        <Box gridColumn="span 3" backgroundColor={colours.primary[400]} display="flex" p="20px" height="100%" alignItems="center">
          <Box display="flex" flexDirection="column" alignItems="center" mr="20px">
            <FaChartPie style={{ color: colours.blueAccent[500], fontSize: "26px" }} />
            <Typography variant="h6" color={colours.grey[100]} mt="10px">Active Societies</Typography>
            <Typography variant="body2" color={colours.grey[400]} mt="5px">Monthly Revenue</Typography>
          </Box>
          <StatBox value={societiesData.length} progress={0.75} increase="+18%" subtitle="" />
        </Box>

        <Box gridColumn="span 8" gridRow="span 2" backgroundColor={colours.primary[400]} p="20px" height="400px" display="flex" flexDirection="column">
          <Typography variant="h5" fontWeight="600" color={colours.grey[100]} mb="10px">Society Members Chart</Typography>
          <BarChart data={chartData} />
        </Box>

        <Box gridColumn="span 4" gridRow="span 2" backgroundColor={colours.primary[400]} p="20px" overflow="auto">
          <Typography variant="h5" fontWeight="600" color={colours.grey[100]} mb="10px">
            <FaBell style={{ color: colours.redAccent[500], fontSize: "26px", paddingBottom: "2px" }} /> Recent Notifications
          </Typography>
          {notifications.map((notification) => (
            <Box key={notification.id} display="flex" justifyContent="space-between" alignItems="center" borderBottom={`2px solid ${colours.primary[500]}`} p="10px 0">
              <Typography color={colours.grey[100]}>{notification.message}</Typography>
              <Typography color={colours.greenAccent[500]}>{notification.date}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;