import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useTheme,
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { tokens } from '../../theme/theme';
import {
  FaCalendarAlt,
  FaBell,
  FaUsers,
  FaUserPlus,
  FaCogs,
  FaRegClock,
  FaTrophy,
} from "react-icons/fa";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";

interface Society {
  id: number;
  name: string;
  is_president: boolean;
}

interface Event {
  id: number;
  title: string;
  date: string;
  rsvp: boolean;
}

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}

interface AwardAssignment {
  id: number;
  award: {
    title: string;
    description: string;
    rank: string;
  };
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);

  const [societies, setSocieties] = useState<Society[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [awards, setAwards] = useState<AwardAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const societiesResponse = await apiClient.get("/api/student-societies");   
      setSocieties(societiesResponse.data || []);
    } catch (error) {
      console.error("Error fetching society data:", error);
    }
    try {
      const eventsResponse = await apiClient.get("/api/events/"); 
      setEvents(eventsResponse.data || []);
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
    try {
      const notificationsResponse = await apiClient.get("/api/notifications"); 
      setNotifications(notificationsResponse.data || []);
    } catch (error) {
      console.error("Error fetching notification data:", error);
    }
    try {
      const awardsResponse = await apiClient.get(`/api/award-students/${user?.id}`); 
      setAwards([awardsResponse.data]);
    } catch (error) {
      console.error("Error fetching award assignments:", error);
    }
    setLoading(false);
  };

  const joinSociety = async (societyId: number) => {
    try {
      await apiClient.post(`/api/join-society/${societyId}`);
      fetchData();
    } catch (error) {
      console.error("Error joining society:", error);
    }
  };

  const handleLeaveSociety = async (societyId: number) => {
    try {
      await apiClient.delete(`/api/leave-society/${societyId}`);
      fetchData();
    } catch (error) {
      console.error("Error leaving society:", error);
    }
  };

  const handleRSVP = async (eventId: number, isAttending: boolean) => {
    try {
      if (isAttending) {
        await apiClient.post("/api/events/rsvp", { event_id: eventId });
      } else {
        await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
      }
      fetchData();
    } catch (error) {
      console.error("Error updating RSVP:", error);
    }
  };

  const cancelRSVP = async (eventId: number) => {
    try {
      await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
      fetchData();
    } catch (error) {
      console.error("Error canceling RSVP:", error);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
      if (response.status === 200) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id ? { ...notification, is_read: true } : notification
          )
        );
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor={colours.primary[400]}
      >
        <CircularProgress size={48} style={{ color: colours.grey[100] }} />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bgcolor={colours.primary[500]} py={8}>
      <Box maxWidth="1920px" mx="auto" px={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" sx={{ color: colours.grey[100] }}>
            Dashboard
          </Typography>
          <Box display="flex" gap={2}>
            {user?.is_president === true && (
              <Button
                variant="contained"
                onClick={() => navigate(`/president-page/${user?.president_of}`)}
                sx={{
                  backgroundColor: colours.greenAccent[500],
                  color: colours.grey[100],
                }}
              >
                <FaCogs style={{ marginRight: 4 }} />
                Manage My Societies
              </Button>
            )}
          </Box>
        </Box>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
          gap={3}
          mb={4}
        >
          <StatCard
            icon={<FaUsers size={24} />}
            title="My Societies"
            value={societies.length}
            color={colours.greenAccent[500]}
          />
          <StatCard
            icon={<FaCalendarAlt size={24} />}
            title="Upcoming Events"
            value={events.length}
            color={colours.blueAccent[500]}
          />
          <StatCard
            icon={<FaBell size={24} />}
            title="Unread Notifications"
            value={notifications.filter((n) => !n.is_read).length}
            color={colours.redAccent[500]}
          />
        </Box>
        <Paper
          elevation={3}
          sx={{
            backgroundColor: colours.primary[400],
            border: `1px solid ${colours.grey[800]}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            variant="fullWidth"
          >
            <Tab label="Societies" />
            <Tab label="Events" />
            <Tab label="Notifications" />
          </Tabs>
          <Box p={3}>
            {activeTab === 0 && (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={3}
              >
                {societies.map((society) => (
                  <Paper
                    key={society.id}
                    elevation={2}
                    sx={{
                      backgroundColor: colours.primary[400],
                      border: `1px solid ${colours.grey[800]}`,
                      p: 2,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ color: colours.grey[100] }}>
                        {society.name}
                      </Typography>
                      {society.is_president && (
                        <Box
                          px={1}
                          py={0.5}
                          borderRadius="4px"
                          bgcolor={colours.greenAccent[500]}
                          color={colours.primary[500]}
                        >
                          <Typography variant="caption">President</Typography>
                        </Box>
                      )}
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleLeaveSociety(society.id)}
                      sx={{
                        backgroundColor: colours.redAccent[500],
                        color: colours.grey[100],
                      }}
                    >
                      Leave Society
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
            {activeTab === 1 && (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={3}
              >
                {events.map((event) => (
                  <Paper
                    key={event.id}
                    elevation={2}
                    sx={{
                      backgroundColor: colours.primary[400],
                      border: `1px solid ${colours.grey[800]}`,
                      p: 2,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ color: colours.grey[100] }}>
                          {event.title}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          <FaRegClock style={{ marginRight: 8, color: colours.grey[300] }} />
                          <Typography variant="body2" sx={{ color: colours.grey[300] }}>
                            {event.date}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleRSVP(event.id, !event.rsvp)}
                      sx={{
                        backgroundColor: event.rsvp ? colours.grey[700] : colours.blueAccent[500],
                        color: colours.grey[100],
                      }}
                    >
                      {event.rsvp ? 'Cancel RSVP' : 'RSVP Now'}
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
            {activeTab === 2 && (
              <Box>
                {notifications.length === 0 ? (
                  <Typography variant="body1" align="center" sx={{ color: colours.grey[300], py: 4 }}>
                    No notifications
                  </Typography>
                ) : (
                  notifications.map((notification) => (
                    <Paper
                      key={notification.id}
                      elevation={2}
                      sx={{
                        backgroundColor: notification.is_read ? colours.primary[400] : colours.primary[500],
                        border: `1px solid ${colours.grey[800]}`,
                        p: 2,
                        mb: 2,
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1" sx={{ color: colours.grey[100] }}>
                          {notification.message}
                        </Typography>
                        {!notification.is_read && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => markNotificationAsRead(notification.id)}
                            sx={{
                              backgroundColor: colours.grey[800],
                              color: colours.grey[100],
                            }}
                          >
                            Mark as read
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  ))
                )}
              </Box>
            )}
          </Box>
        </Paper>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(1, 1fr)' }} gap={3} mt={4}>
          <Paper
            elevation={3}
            sx={{
              backgroundColor: colours.primary[400],
              border: `1px solid ${colours.grey[800]}`,
              p: 2,
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <FaUserPlus size={24} style={{ marginRight: 8, color: colours.blueAccent[500] }} />
              <Typography variant="h6" sx={{ color: colours.grey[100] }}>
                Start a Society
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: colours.grey[300], mb: 2 }}>
              Have an idea for a new society? Share your passion and bring others together!
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/student/start-society')}
              sx={{
                backgroundColor: colours.blueAccent[500],
                color: colours.grey[100],
              }}
            >
              Create New Society
            </Button>
          </Paper>
        </Box>
        <Box mt={4}>
          <Paper
            elevation={3}
            sx={{
              backgroundColor: colours.primary[400],
              border: `1px solid ${colours.grey[800]}`,
              p: 2,
              mb: 4,
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <FaCalendarAlt size={24} style={{ marginRight: 8, color: colours.blueAccent[500] }} />
              <Typography variant="h6" sx={{ color: colours.grey[100] }}>
                Calendar
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="center" p={4} bgcolor={colours.primary[500]}>
              <Typography variant="body1" sx={{ color: colours.grey[300] }}>
                Calendar Integration Placeholder
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: colours.primary[400],
        border: `1px solid ${colours.grey[800]}`,
        p: 2,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" sx={{ color: colours.grey[300] }}>
          {title}
        </Typography>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ color: colours.grey[100] }}>
        {value}
      </Typography>
    </Paper>
  );
};

export default StudentDashboard;
