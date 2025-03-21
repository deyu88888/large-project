import React, { useState, useEffect, useMemo } from "react";
import { getAllEvents } from "../../api";
import { useNavigate } from "react-router-dom";
import {
  useTheme,
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  styled,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import {
  FaCalendarAlt,
  FaBell,
  FaUsers,
  FaUserPlus,
  FaCogs,
  FaRegClock,
} from "react-icons/fa";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import StudentCalendar from "./StudentCalendar";

const CustomTabs = styled(Tabs)(({ theme, activecolor }) => ({
  "& .MuiTabs-indicator": {
    backgroundColor: activecolor,
  },
}));

interface Society {
  id: number;
  name: string;
  is_president: boolean;
  is_vice_president?: boolean;
  is_event_manager?: boolean;
}

interface EventData {
  id: number;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  duration: string;
  location?: string;
  hosted_by: number;
  societyName?: string;
  rsvp: boolean;
  status: string;
}

interface TransformedEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: string;
  location: string;
  hostedBy: number;
  societyName?: string;
  rsvp: boolean;
  status: string;
}

interface Notification {
  id: number;
  header: string;
  body: string;
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
  const [events, setEvents] = useState<TransformedEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [awards, setAwards] = useState<AwardAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);

  const allSocieties = useMemo(() => {
    const allSocs = [...societies];
    if (student?.president_of && !allSocs.some(s => s.id === student.president_of)) {
      allSocs.push({
        id: student.president_of,
        name: student?.president_of_society_name || `Society ${student.president_of}`,
        is_president: true,
      });
    }
    if (
      student?.vice_president_of_society &&
      !allSocs.some(s => s.id === student.vice_president_of_society)
    ) {
      allSocs.push({
        id: student.vice_president_of_society,
        name:
          student?.vice_president_of_society_name ||
          `Society ${student.vice_president_of_society}`,
        is_vice_president: true,
      });
    }
    return allSocs;
  }, [societies, student]);

  const tabColors = [
    colours.greenAccent[500],
    colours.blueAccent[500],
    colours.redAccent[500],
  ];

  useEffect(() => {
    const callFetchData = async () => {
      await fetchData();
    };
    callFetchData();
  }, [user?.id]);

  async function fetchData() {
    setLoading(true);
    try {
      const studentResponse = await apiClient.get("api/user/current");
      setStudent(studentResponse.data);
      console.log("Student data:", studentResponse.data);
      
      const societiesResponse = await apiClient.get("/api/student-societies");
      setSocieties(societiesResponse.data || []);
      
      const allEvents: EventData[] = await getAllEvents();
      const transformed = allEvents
        .filter(ev => ev.status === "Approved")
        .map(ev => ({
          id: ev.id,
          title: ev.title,
          description: ev.description || "",
          date: ev.date,
          startTime: ev.start_time,
          duration: ev.duration,
          location: ev.location || "",
          hostedBy: ev.hosted_by,
          societyName: ev.societyName || "",
          rsvp: ev.rsvp,
          status: ev.status,
        }));
      setEvents(transformed);
      
      const notificationsResponse = await apiClient.get("/api/notifications/");
      setNotifications(notificationsResponse.data || []);
      
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
      await apiClient.delete(`/api/leave-society/${societyId}/`);
      fetchData();
    } catch (error) {
      console.error("Error leaving society:", error);
    }
  }

  async function handleRSVP(eventId: number, isAttending: boolean) {
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
  }

  async function markNotificationAsRead(id: number) {
    try {
      const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
      if (response.status === 200) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      } else {
        console.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  function handleTabChange(event: React.SyntheticEvent, newValue: number) {
    setActiveTab(newValue);
  }

  function toggleCalendar() {
    setShowCalendar(!showCalendar);
  }

  function getMyEventsCount() {
    const mySocietyIds = allSocieties.map(s => s.id);
    return events.filter(e => mySocietyIds.includes(e.hostedBy)).length;
  }

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
            {(student?.is_president === true || 
              student?.is_vice_president === true || 
              student?.is_event_manager === true) && (  
              <Button
                variant="contained"
                onClick={() => {
                  if (student?.is_president) {
                    navigate(`/president-page/${student.president_of}`);
                  } else if (student?.is_vice_president) {
                    navigate(`/president-page/${student.vice_president_of_society}`);
                  } else if (student?.is_event_manager) {
                    // Direct event managers straight to events management page
                    navigate(`/president-page/${student.event_manager_of_society}/manage-society-events`);
                  }
                }}
                sx={{
                  backgroundColor: colours.greenAccent[500],
                  color: colours.grey[100],
                }}
              >
                <FaCogs style={{ marginRight: 4 }} />
                {student?.is_event_manager ? 'Manage Society Events' : 'Manage My Society'}
              </Button>
            )}
          </Box>
        </Box>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }}
          gap={3}
          mb={4}
        >
          <StatCard
            icon={<FaUsers size={24} />}
            title="My Societies"
            value={allSocieties.length}
            color={colours.greenAccent[500]}
          />
          <StatCard
            icon={<FaCalendarAlt size={24} />}
            title="Society Events"
            value={getMyEventsCount()}
            color={colours.blueAccent[500]}
          />
          <StatCard
            icon={<FaBell size={24} />}
            title="Unread Notifications"
            value={notifications.filter(n => !n.is_read).length}
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
          <CustomTabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="inherit"
            activecolor={tabColors[activeTab]}
            variant="fullWidth"
          >
            <Tab label="Societies" />
            <Tab label="Events" />
            <Tab label="Notifications" />
          </CustomTabs>
          <Box p={3}>
            {activeTab === 0 && (
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                }}
                gap={3}
              >
                {allSocieties.length > 0 ? (
                  allSocieties.map(society => (
                    <Paper
                      key={society.id}
                      elevation={2}
                      sx={{
                        backgroundColor: colours.primary[400],
                        border: `1px solid ${colours.grey[800]}`,
                        p: 2,
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
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
                        {society.is_vice_president && (
                          <Box
                            px={1}
                            py={0.5}
                            borderRadius="4px"
                            bgcolor={colours.blueAccent[500]}
                            color={colours.primary[500]}
                          >
                            <Typography variant="caption">Vice President</Typography>
                          </Box>
                        )}
                        {society.is_event_manager && (  
                          <Box
                            px={1}
                            py={0.5}
                            borderRadius="4px"
                            bgcolor={colours.blueAccent[500]} 
                            color={colours.primary[500]}
                          >
                            <Typography variant="caption">Event Manager</Typography>
                          </Box>
                        )}
                      </Box>
                      {!(society.is_president || society.is_vice_president) && (
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
                      )}
                    </Paper>
                  ))
                ) : (
                  <Box
                    gridColumn={{ xs: "1", md: "1 / span 2", lg: "1 / span 3" }}
                    p={4}
                    textAlign="center"
                  >
                    <Typography variant="body1" sx={{ color: colours.grey[300] }}>
                      You are not a member of any societies yet
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {activeTab === 1 && (
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                }}
                gap={3}
              >
                {events
                  .filter(e => allSocieties.some(s => s.id === e.hostedBy))
                  .map(event => (
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
                              {event.date} {event.startTime && `at ${event.startTime}`}
                            </Typography>
                          </Box>
                          {event.location && (
                            <Typography variant="body2" sx={{ color: colours.grey[300], mt: 1 }}>
                              Location: {event.location}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ color: colours.grey[300], mt: 1 }}>
                            Hosted by:{" "}
                            {allSocieties.find(s => s.id === event.hostedBy)?.name ||
                              event.societyName ||
                              `Society ${event.hostedBy}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleRSVP(event.id, !event.rsvp)}
                        sx={{
                          backgroundColor: event.rsvp
                            ? colours.grey[700]
                            : colours.blueAccent[500],
                          color: colours.grey[100],
                        }}
                      >
                        {event.rsvp ? "Cancel RSVP" : "RSVP Now"}
                      </Button>
                    </Paper>
                  ))}
                {events.filter(e => allSocieties.some(s => s.id === e.hostedBy)).length === 0 && (
                  <Box
                    gridColumn={{ xs: "1", md: "1 / span 2", lg: "1 / span 3" }}
                    p={4}
                    textAlign="center"
                  >
                    <Typography variant="body1" sx={{ color: colours.grey[300] }}>
                      No events from your societies
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {activeTab === 2 && (
              <Box>
                {notifications.length === 0 ? (
                  <Typography
                    variant="body1"
                    align="center"
                    sx={{ color: colours.grey[300], py: 4 }}
                  >
                    No notifications
                  </Typography>
                ) : (
                  <div className="space-y-6">
                    {notifications.map(notification => (
                      <Paper
                        key={notification.id}
                        elevation={2}
                        sx={{
                          backgroundColor: notification.is_read
                            ? colours.primary[400]
                            : colours.blueAccent[700],
                          border: `1px solid ${
                            notification.is_read
                              ? colours.grey[300]
                              : colours.blueAccent[400]
                          }`,
                          p: 2,
                          mb: 2,
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: colours.grey[100],
                              fontSize: "1rem",
                            }}
                          >
                            <b>{notification.header}</b>
                            <p>{notification.body}</p>
                          </Typography>
                          <Box sx={{ display: "flex", gap: "1rem" }}>
                            {notification.is_read ? (
                              <Typography
                                sx={{
                                  color: colours.greenAccent[500],
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                }}
                              >
                                Read
                              </Typography>
                            ) : (
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => markNotificationAsRead(notification.id)}
                                sx={{
                                  color: colours.blueAccent[400],
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  textDecoration: "underline",
                                  padding: 0,
                                  minWidth: 0,
                                }}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </div>
                )}
              </Box>
            )}
          </Box>
        </Paper>
        {/* Start a Society Section */}
        {/* Only show this section if the user is not a president, vice president, or event manager */}
        {!(student?.is_president === true || 
          student?.is_vice_president === true || 
          student?.is_event_manager === true) && (
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "repeat(1, 1fr)" }}
            gap={3}
            mt={4}
          >
            <Paper
              elevation={3}
              sx={{
                backgroundColor: colours.primary[400],
                border: `1px solid ${colours.grey[800]}`,
                p: 2,
              }}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <FaUserPlus
                  size={24}
                  style={{ marginRight: 8, color: colours.blueAccent[500] }}
                />
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
                onClick={() => navigate("/student/start-society")}
                sx={{
                  backgroundColor: colours.blueAccent[500],
                  color: colours.grey[100],
                }}
              >
                Create New Society
              </Button>
            </Paper>
          </Box>
        )}
        <Box mt={4}>
          <Paper
            elevation={3}
            sx={{
              backgroundColor: colours.primary[400],
              border: `1px solid ${colours.grey[800]}`,
              p: 3,
              mb: 4,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <FaCalendarAlt
                  size={24}
                  style={{ marginRight: 8, color: colours.blueAccent[500] }}
                />
                <Typography variant="h6" sx={{ color: colours.grey[100] }}>
                  My Society Events Calendar
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={toggleCalendar}
                sx={{
                  color: colours.grey[100],
                  borderColor: colours.grey[700],
                }}
              >
                {showCalendar ? "Hide Calendar" : "Show Calendar"}
              </Button>
            </Box>
            {student?.is_event_manager && (
              <Button
                variant="contained"
                onClick={() => {
                  if (student?.event_manager_of_society) {
                    // Navigate directly to the events management page instead of president page
                    navigate(`/president-page/${student.event_manager_of_society}/manage-society-events`);
                  } else {
                    console.error("No society ID found for event manager");
                  }
                }}
                sx={{
                  backgroundColor: colours.redAccent[500],
                  color: colours.grey[100],
                  mb: 2
                }}
              >
                <FaCalendarAlt style={{ marginRight: 4 }} />
                Manage Society Events
              </Button>
            )}
            
            {showCalendar ? (
              <StudentCalendar societies={allSocieties} userEvents={events} />
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={4}
                bgcolor={colours.primary[500]}
                borderRadius="8px"
              >
                <Typography variant="body1" sx={{ color: colours.grey[300] }}>
                  Click "Show Calendar" to view your societies' events
                </Typography>
              </Box>
            )}
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