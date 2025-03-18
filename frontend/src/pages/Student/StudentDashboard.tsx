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
  styled,
} from '@mui/material';
import { tokens } from '../../theme/theme';
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
import StudentCalendar from './StudentCalendar';

const CustomTabs = styled(Tabs)(({ theme, activecolor }) => ({
  '& .MuiTabs-indicator': {
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

interface Event {
  id: number;
  title: string;
  date: string;
  startTime: string; 
  duration: string; 
  description?: string;
  location?: string;
  hostedBy: number;
  societyName?: string;
  rsvp: boolean;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [awards, setAwards] = useState<AwardAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);
  
  // Combine all societies the user belongs to, including those they lead
  const allSocieties = React.useMemo(() => {
    const allSocs = [...societies];
    
    // Add president_of society if it exists and isn't already included
    if (student?.president_of && !allSocs.some(s => s.id === student.president_of)) {
      allSocs.push({
        id: student.president_of,
        name: student?.president_of_society_name || `Society ${student.president_of}`,
        is_president: true
      });
    }
    
    // Add vice_president_of_society if it exists and isn't already included
    if (student?.vice_president_of_society && !allSocs.some(s => s.id === student.vice_president_of_society)) {
      allSocs.push({
        id: student.vice_president_of_society,
        name: student?.vice_president_of_society_name || `Society ${student.vice_president_of_society}`,
        is_vice_president: true
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // First fetch current user data to get leadership roles
      const studentResponse = await apiClient.get("api/user/current");
      setStudent(studentResponse.data);
      console.log("Student data:", studentResponse.data);
      
      // Then fetch societies the user is a regular member of
      const societiesResponse = await apiClient.get("/api/student-societies");
      setSocieties(societiesResponse.data || []);
      
      // Fetch additional data about societies student leads if needed
      if (studentResponse.data?.president_of || studentResponse.data?.vice_president_of_society) {
        // You could fetch additional society details here if needed
      }
    } catch (error) {
      console.error("Error fetching user or society data:", error);
    }
    
    try {
      const eventsResponse = await apiClient.get("/api/events/"); 
      
      // Enhance the events data with more details needed for the calendar
      const enhancedEvents = eventsResponse.data.map((event: any) => ({
        ...event,
        // Add default values for any missing fields required by the calendar
        startTime: event.startTime || '12:00', // Default to noon if no start time
        duration: event.duration || '1 hour', // Default to 1 hour if no duration
        description: event.description || 'No description available',
        location: event.location || 'To be announced',
        societyName: event.societyName || `Society ${event.hostedBy}`,
      }));
      
      setEvents(enhancedEvents || []);
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
    try {
      const notificationsResponse = await apiClient.get("/api/notifications/");
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
    try {
      const studentResponse = await apiClient.get("api/user/current/");
      console.log("Student data:", studentResponse.data)
      setStudent(studentResponse.data)
    } catch (error) {
      console.error("Error fetching current student:", error);
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

  const markNotificationAsRead = async (id: number) => {
    try {
      const response = await apiClient.patch(`/api/notifications/${id}`, { is_read: true });
      if (response.status === 200) {
        setNotifications((prev) =>
          prev.map((notification) =>
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

  // Toggle calendar view
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Get upcoming events for my societies - use allSocieties instead of societies
  const getMyEventsCount = () => {
    // Get IDs of societies the user is a member of or leads
    const mySocietyIds = allSocieties.map(society => society.id);
    
    // Filter events to only include those from the user's societies
    return events.filter(event => mySocietyIds.includes(event.hostedBy)).length;
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
          gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
          gap={3}
          mb={4}
        >
          <StatCard
            icon={<FaUsers size={24} />}
            title="My Societies"
            value={allSocieties.length} /* Use allSocieties instead of societies */
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
                gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={3}
              >
                {allSocieties.length > 0 ? (
                  allSocieties.map((society) => (
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
                      {/* Only show "Leave Society" for societies where they're not president or VP */}
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
                    gridColumn={{ xs: '1', md: '1 / span 2', lg: '1 / span 3' }} 
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
                gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={3}
              >
                {/* Filter events to only show those from societies the user is a member of */}
                {events
                  .filter(event => allSocieties.some(society => society.id === event.hostedBy))
                  .map((event) => (
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
                          {/* Show hosting society */}
                          <Typography variant="body2" sx={{ color: colours.grey[300], mt: 1 }}>
                            Hosted by: {
                              allSocieties.find(society => society.id === event.hostedBy)?.name || 
                              event.societyName || 
                              `Society ${event.hostedBy}`
                            }
                          </Typography>
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
                  
                {/* Show message when no events from user's societies */}
                {events.filter(event => allSocieties.some(society => society.id === event.hostedBy)).length === 0 && (
                  <Box
                    gridColumn={{ xs: '1', md: '1 / span 2', lg: '1 / span 3' }} 
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
                {/* When there are no notifications */}
                {notifications.length === 0 ? (
                  <Typography variant="body1" align="center" sx={{ color: colours.grey[300], py: 4 }}>
                    No notifications
                  </Typography>
                ) : (
                  // When there are notifications
                  <div className="space-y-6">
                    {notifications.map((notification) => (
                      <Paper
                        key={notification.id}
                        elevation={2}
                        sx={{
                          // Background color changes based on read status
                          backgroundColor: notification.is_read
                            ? colours.primary[400]  // Light background when read
                            : colours.blueAccent[700],  // Blue background when unread
                          
                          // Border color also changes based on read status
                          border: `1px solid ${notification.is_read 
                            ? colours.grey[300]  // Light border when read
                            : colours.blueAccent[400]  // Blue border when unread
                          }`,
                          p: 2,  // Adds padding
                          mb: 2,  // Add margin between items
                        }}
                      >
                        <Box 
                          display="flex" 
                          justifyContent="space-between" 
                          alignItems="center"
                        >
                          {/* Notification message */}
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

                          {/* Mark as read/Read status */}
                          <Box sx={{ display: "flex", gap: "1rem" }}>
                            {notification.is_read ? (
                              // Show "Read" text when notification is read
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
                              // Show "Mark as Read" button when notification is unread
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
              p: 3,
              mb: 4,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <FaCalendarAlt size={24} style={{ marginRight: 8, color: colours.blueAccent[500] }} />
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
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
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
              // Render the Calendar component with ALL societies data
              <StudentCalendar 
                societies={allSocieties} 
                userEvents={events}
              />
            ) : (
              // Show a placeholder when calendar is hidden
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