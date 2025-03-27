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
  Snackbar,
  Alert,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import {
  FaCalendarAlt,
  FaBell,
  FaUsers,
  FaUserPlus,
  FaCogs,
  FaRegClock,
  FaNewspaper,
  FaTrophy,
} from "react-icons/fa";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import StudentCalendar from "./StudentCalendar";
import SocietyNewsFeed from "./SocietyNewsFeed";
import { Society } from "../../types/student/society";
import { EventData, TransformedEvent } from "../../types/student/event";
import { Notification } from "../../types/student/notification";
import { AwardAssignment } from "../../types/student/award";
import AwardCard from "../../components/AwardCard";

// Styled Components
const CustomTabs = styled(Tabs)<{ activecolor: string }>(({ activecolor }) => ({
  "& .MuiTabs-indicator": {
    backgroundColor: activecolor,
  },
}));

// Interfaces
interface StudentDashboardProps {}

interface StyleProps {
  colours: ReturnType<typeof tokens>;
}

interface Student {
  id?: number;
  is_president?: boolean;
  is_vice_president?: boolean;
  is_event_manager?: boolean;
  president_of?: number;
  president_of_society_name?: string;
  vice_president_of_society?: number;
  vice_president_of_society_name?: string;
  event_manager_of_society?: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "error" | "warning" | "info" | "success";
}

interface DashboardData {
  societies: Society[];
  events: TransformedEvent[];
  notifications: Notification[];
  awards: AwardAssignment[];
  student: Student | null;
}

interface HeaderProps {
  student: Student | null;
  navigate: ReturnType<typeof useNavigate>;
  styleProps: StyleProps;
}

interface StatCardsProps {
  societies: Society[];
  events: TransformedEvent[];
  notifications: Notification[];
  awards: AwardAssignment[];
  styleProps: StyleProps;
  getMyEventsCount: () => number;
}

interface SocietyTabProps {
  societies: Society[];
  handleLeaveSociety: (societyId: number) => Promise<void>;
  styleProps: StyleProps;
}

interface EventTabProps {
  events: TransformedEvent[];
  societies: Society[];
  userId?: number;
  handleRSVP: (eventId: number, isAttending: boolean) => Promise<void>;
  styleProps: StyleProps;
}

interface NotificationTabProps {
  notifications: Notification[];
  markNotificationAsRead: (id: number) => Promise<void>;
  styleProps: StyleProps;
}

interface AwardTabProps {
  awards: AwardAssignment[];
  styleProps: StyleProps;
}

interface StartSocietySectionProps {
  navigate: ReturnType<typeof useNavigate>;
  student: Student | null;
  styleProps: StyleProps;
}

interface CalendarSectionProps {
  showCalendar: boolean;
  toggleCalendar: () => void;
  student: Student | null;
  navigate: ReturnType<typeof useNavigate>;
  societies: Society[];
  events: TransformedEvent[];
  styleProps: StyleProps;
}

// Utility Functions
const getSocietyName = (event: TransformedEvent, societies: Society[]): string => {
  return societies.find((s) => s.id === event.hosted_by)?.name || 
         event.society_name || 
         `Society ${event.hosted_by}`;
};

const isUserAttendingEvent = (event: TransformedEvent, userId?: number): boolean => {
  if (!userId || !event.current_attendees) return false;
  return event.current_attendees.some(attendee => attendee.id === userId);
};

const filterEventsBySocieties = (events: TransformedEvent[], societies: Society[]): TransformedEvent[] => {
  const societyIds = societies.map(s => s.id);
  return events.filter(e => societyIds.includes(e.hosted_by));
};

const filterEventsUserNotAttending = (events: TransformedEvent[], userId?: number): TransformedEvent[] => {
  return events.filter(e => !isUserAttendingEvent(e, userId));
};

// Component Functions
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

const DashboardHeader: React.FC<HeaderProps> = ({ student, navigate, styleProps }) => {
  const { colours } = styleProps;
  const shouldShowManageButton = student?.is_president === true || 
                               student?.is_vice_president === true ||
                               student?.is_event_manager === true;
  
  const getManageButtonDestination = (): string => {
    if (student?.is_president) {
      return `/president-page/${student.president_of}`;
    } else if (student?.is_vice_president) {
      return `/president-page/${student.vice_president_of_society}`;
    } else if (student?.is_event_manager) {
      return `/president-page/${student.event_manager_of_society}/manage-society-events`;
    }
    return "";
  };
  
  const getButtonText = (): string => {
    return student?.is_event_manager ? "Manage Society Events" : "Manage My Society";
  };
  
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Typography variant="h4" sx={{ color: colours.grey[100] }}>
        Dashboard
      </Typography>
      <Box display="flex" gap={2}>
        {shouldShowManageButton && (
          <Button
            variant="contained"
            onClick={() => navigate(getManageButtonDestination())}
            sx={{
              backgroundColor: colours.greenAccent[500],
              color: colours.grey[100],
            }}
          >
            <FaCogs style={{ marginRight: 4 }} />
            {getButtonText()}
          </Button>
        )}
      </Box>
    </Box>
  );
};

const StatCards: React.FC<StatCardsProps> = ({ 
  societies, 
  events, 
  notifications, 
  awards, 
  styleProps,
  getMyEventsCount
}) => {
  const { colours } = styleProps;
  
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;
  
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr)" }}
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
        title="Society Events"
        value={getMyEventsCount()}
        color={colours.blueAccent[500]}
      />
      <StatCard
        icon={<FaBell size={24} />}
        title="Unread Notifications"
        value={unreadNotificationsCount}
        color={colours.redAccent[500]}
      />
      <StatCard
        icon={<FaTrophy size={24} />}
        title="My Awards"
        value={awards.length}
        color={colours.purpleAccent?.[500]}
      />
    </Box>
  );
};

const SocietyTab: React.FC<SocietyTabProps> = ({ societies, handleLeaveSociety, styleProps }) => {
  const { colours } = styleProps;
  
  if (societies.length === 0) {
    return (
      <Box
        gridColumn={{ xs: "1", md: "1 / span 2", lg: "1 / span 3" }}
        p={4}
        textAlign="center"
      >
        <Typography variant="body1" sx={{ color: colours.grey[300] }}>
          You are not a member of any societies yet
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: "1fr",
        md: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
      }}
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" sx={{ color: colours.grey[100] }}>
              {society.name}
            </Typography>
            {renderSocietyRoleBadge(society, colours)}
          </Box>
          {renderLeaveButton(society, handleLeaveSociety, colours)}
        </Paper>
      ))}
    </Box>
  );
};

const renderSocietyRoleBadge = (society: Society, colours: ReturnType<typeof tokens>) => {
  if (society.is_president) {
    return (
      <Box
        px={1}
        py={0.5}
        borderRadius="4px"
        bgcolor={colours.greenAccent[500]}
        color={colours.primary[500]}
      >
        <Typography variant="caption">President</Typography>
      </Box>
    );
  }
  
  if (society.is_vice_president) {
    return (
      <Box
        px={1}
        py={0.5}
        borderRadius="4px"
        bgcolor={colours.blueAccent[500]}
        color={colours.primary[500]}
      >
        <Typography variant="caption">Vice President</Typography>
      </Box>
    );
  }
  
  if (society.is_event_manager) {
    return (
      <Box
        px={1}
        py={0.5}
        borderRadius="4px"
        bgcolor={colours.blueAccent[500]}
        color={colours.primary[500]}
      >
        <Typography variant="caption">Event Manager</Typography>
      </Box>
    );
  }
  
  return null;
};

const renderLeaveButton = (
  society: Society, 
  handleLeaveSociety: (societyId: number) => Promise<void>,
  colours: ReturnType<typeof tokens>
) => {
  if (society.is_president || society.is_vice_president) {
    return null;
  }
  
  return (
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
  );
};

const EventDate: React.FC<{ date: string; startTime?: string }> = ({ date, startTime }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  
  return (
    <Box display="flex" alignItems="center" mt={1}>
      <FaRegClock
        style={{ marginRight: 8, color: colours.grey[300] }}
      />
      <Typography variant="body2" sx={{ color: colours.grey[300] }}>
        {date} {startTime && `at ${startTime}`}
      </Typography>
    </Box>
  );
};

const EventLocation: React.FC<{ location?: string }> = ({ location }) => {
  if (!location) return null;
  
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  
  return (
    <Typography
      variant="body2"
      sx={{ color: colours.grey[300], mt: 1 }}
    >
      Location: {location}
    </Typography>
  );
};

const EventHost: React.FC<{ hostName: string }> = ({ hostName }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  
  return (
    <Typography
      variant="body2"
      sx={{ color: colours.grey[300], mt: 1 }}
    >
      Hosted by: {hostName}
    </Typography>
  );
};

const EventCard: React.FC<{
  event: TransformedEvent;
  hostName: string;
  onRSVP: () => void;
  styleProps: StyleProps;
}> = ({ event, hostName, onRSVP, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Paper
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
        <Box>
          <Typography variant="h6" sx={{ color: colours.grey[100] }}>
            {event.title}
          </Typography>
          <EventDate date={event.date} startTime={event.start_time} />
          <EventLocation location={event.location} />
          <EventHost hostName={hostName} />
        </Box>
      </Box>
      <Button
        fullWidth
        variant="contained"
        onClick={onRSVP}
        sx={{
          backgroundColor: colours.blueAccent[500],
          color: colours.grey[100],
        }}
      >
        RSVP Now
      </Button>
    </Paper>
  );
};

const EventsTab: React.FC<EventTabProps> = ({ 
  events, 
  societies, 
  userId,
  handleRSVP, 
  styleProps 
}) => {
  const { colours } = styleProps;
  
  const filteredEvents = filterEventsBySocieties(events, societies);
  const eventsUserNotAttending = filterEventsUserNotAttending(filteredEvents, userId);
  
  if (eventsUserNotAttending.length === 0) {
    return (
      <Box
        gridColumn={{ xs: "1", md: "1 / span 2", lg: "1 / span 3" }}
        p={4}
        textAlign="center"
      >
        <Typography variant="body1" sx={{ color: colours.grey[300] }}>
          No events from your societies
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: "1fr",
        md: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
      }}
      gap={3}
    >
      {eventsUserNotAttending.map((event) => {
        const hostName = getSocietyName(event, societies);
        return (
          <EventCard
            key={event.id}
            event={event}
            hostName={hostName}
            onRSVP={() => handleRSVP(event.id, true)}
            styleProps={styleProps}
          />
        );
      })}
    </Box>
  );
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: () => void;
  styleProps: StyleProps;
}> = ({ notification, onMarkAsRead, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Paper
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
              onClick={onMarkAsRead}
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
  );
};

const NotificationsTab: React.FC<NotificationTabProps> = ({ 
  notifications, 
  markNotificationAsRead, 
  styleProps 
}) => {
  const { colours } = styleProps;
  
  if (notifications.length === 0) {
    return (
      <Typography
        variant="body1"
        align="center"
        sx={{ color: colours.grey[300], py: 4 }}
      >
        No notifications
      </Typography>
    );
  }
  
  return (
    <div className="space-y-6">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={() => markNotificationAsRead(notification.id)}
          styleProps={styleProps}
        />
      ))}
    </div>
  );
};

const AwardsTab: React.FC<AwardTabProps> = ({ awards, styleProps }) => {
  const { colours } = styleProps;
  
  if (awards.length === 0) {
    return (
      <Typography
        variant="body1"
        align="center"
        sx={{ color: colours.grey[300], py: 4 }}
      >
        You haven't earned any awards yet
      </Typography>
    );
  }
  
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: "1fr",
        md: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
      }}
      gap={3}
    >
      {awards.map((award) => (
        <AwardCard key={award.id} award={award} />
      ))}
    </Box>
  );
};

const StartSocietySection: React.FC<StartSocietySectionProps> = ({ 
  navigate, 
  student, 
  styleProps 
}) => {
  const { colours } = styleProps;
  const isLeadershipRole = student?.is_president === true ||
                          student?.is_vice_president === true ||
                          student?.is_event_manager === true;
  
  if (isLeadershipRole) {
    return null;
  }
  
  return (
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
  );
};

const EventManagerButton: React.FC<{
  student: Student | null;
  navigate: ReturnType<typeof useNavigate>;
  styleProps: StyleProps;
}> = ({ student, navigate, styleProps }) => {
  const { colours } = styleProps;
  
  if (!student?.is_event_manager) {
    return null;
  }
  
  const handleClick = () => {
    if (student?.event_manager_of_society) {
      navigate(
        `/president-page/${student.event_manager_of_society}/manage-society-events`
      );
    } else {
      console.error("No society ID found for event manager");
    }
  };
  
  return (
    <Button
      variant="contained"
      onClick={handleClick}
      sx={{
        backgroundColor: colours.redAccent[500],
        color: colours.grey[100],
        mb: 2,
      }}
    >
      <FaCalendarAlt style={{ marginRight: 4 }} />
      Manage Society Events
    </Button>
  );
};

const CalendarSection: React.FC<CalendarSectionProps> = ({ 
  showCalendar, 
  toggleCalendar, 
  student, 
  navigate,
  societies,
  events,
  styleProps
}) => {
  const { colours } = styleProps;
  
  return (
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
        
        <EventManagerButton 
          student={student} 
          navigate={navigate} 
          styleProps={styleProps} 
        />

        {showCalendar ? (
          <StudentCalendar societies={societies} userEvents={events} />
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
  );
};

const TabsContainer: React.FC<{
  activeTab: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabColors: string[];
  children: React.ReactNode;
}> = ({ activeTab, handleTabChange, tabColors, children }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: theme => tokens(theme.palette.mode).primary[400],
        border: theme => `1px solid ${tokens(theme.palette.mode).grey[800]}`,
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
        <Tab label="Awards" icon={<FaTrophy />} iconPosition="start" />
        <Tab label="Society News" icon={<FaNewspaper />} iconPosition="start" />
      </CustomTabs>
      <Box p={3}>
        {children}
      </Box>
    </Paper>
  );
};

// Custom Hooks
const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    societies: [],
    events: [],
    notifications: [],
    awards: [],
    student: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuthStore();
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const studentResponse = await apiClient.get("api/user/current");
      const student = studentResponse.data;
      
      const societiesResponse = await apiClient.get("/api/society/joined");
      const societies = societiesResponse.data || [];
      
      const allEvents: EventData[] = await getAllEvents();
      const transformedEvents = transformEvents(allEvents);
      
      const notificationsResponse = await apiClient.get("/api/notifications/");
      const notifications = notificationsResponse.data || [];
      
      const awardsResponse = await apiClient.get("/api/awards/students/");
      const awards = awardsResponse.data || [];
      
      setDashboardData({
        societies,
        events: transformedEvents,
        notifications,
        awards,
        student,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);
  
  return { dashboardData, loading, fetchData };
};

const useSnackbar = () => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "error",
  });
  
  const showSnackbar = (message: string, severity: SnackbarState["severity"]) => {
    setSnackbarState({
      open: true,
      message,
      severity,
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  };
  
  return { snackbarState, showSnackbar, handleSnackbarClose };
};

const transformEvents = (events: EventData[]): TransformedEvent[] => {
  return events
    .filter((ev) => ev.status === "Approved")
    .map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description || "",
      date: ev.date,
      start_time: ev.start_time,
      duration: ev.duration,
      location: ev.location || "",
      hosted_by: ev.hosted_by,
      society_name: ev.society_name || "",
      current_attendees: ev.current_attendees,
      status: ev.status,
    }));
};

// Main Component
const StudentDashboard: React.FC<StudentDashboardProps> = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const styleProps = { colours };
  const { user } = useAuthStore();
  
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const { dashboardData, loading, fetchData } = useDashboardData();
  const { snackbarState, showSnackbar, handleSnackbarClose } = useSnackbar();
  
  // Derived state
  const tabColors = [
    colours.greenAccent?.[500],
    colours.blueAccent?.[500],
    colours.redAccent?.[500],
    colours.purpleAccent?.[500],
    colours.orangeAccent?.[500],
  ];
  
  const allSocieties = useMemo(() => {
    if (!dashboardData.student) return dashboardData.societies;
    
    const allSocs = [...dashboardData.societies];
    const student = dashboardData.student;
    
    if (
      student?.president_of &&
      !allSocs.some((s) => s.id === student.president_of)
    ) {
      allSocs.push({
        id: student.president_of,
        name:
          student?.president_of_society_name || `Society ${student.president_of}`,
        is_president: true,
      });
    }
    
    if (
      student?.vice_president_of_society &&
      !allSocs.some((s) => s.id === student.vice_president_of_society)
    ) {
      allSocs.push({
        id: student.vice_president_of_society,
        name: student?.vice_president_of_society_name || `Society ${student.vice_president_of_society}`,
        is_president: false,
        is_vice_president: true,
      });
    }
    
    return allSocs;
  }, [dashboardData.societies, dashboardData.student]);
  
  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const toggleCalendar = () => {
    setShowCalendar(prev => !prev);
  };
  
  const getMyEventsCount = () => {
    const mySocietyIds = allSocieties.map((s) => s.id);
    return dashboardData.events.filter((e) => mySocietyIds.includes(e.hosted_by)).length;
  };
  
  const handleLeaveSociety = async (societyId: number) => {
    try {
      await apiClient.delete(`/api/society/leave/${societyId}/`);
      showSnackbar("Successfully left the society", "success");
      fetchData();
    } catch (error: any) {
      console.error("Error leaving society:", error);
      const errorMessage = error.response?.data?.error || 
                         "An error occurred while trying to leave the society.";
      showSnackbar(errorMessage, "error");
    }
  };
  
  const handleRSVP = async (eventId: number, isAttending: boolean) => {
    try {
      if (isAttending) {
        await apiClient.post("/api/events/rsvp/", { event_id: eventId });
        showSnackbar("Successfully RSVP'd to the event", "success");
      } else {
        await apiClient.delete("/api/events/rsvp/", {
          data: { event_id: eventId },
        });
        showSnackbar("Successfully cancelled your RSVP", "success");
      }
      fetchData();
    } catch (error: any) {
      console.error("Error updating RSVP:", error);
      const errorMessage = error.response?.data?.error ||
                         "An error occurred while updating your RSVP.";
      showSnackbar(errorMessage, "error");
    }
  };
  
  const markNotificationAsRead = async (id: number) => {
    try {
      const response = await apiClient.patch(`/api/notifications/${id}`, {
        is_read: true,
      });
      
      if (response.status === 200) {
        setDashboardData(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            n.id === id ? { ...n, is_read: true } : n
          )
        }));
        showSnackbar("Notification marked as read", "success");
      } else {
        showSnackbar("Failed to mark notification as read", "error");
      }
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      const errorMessage = error.response?.data?.error ||
                         "An error occurred while marking the notification as read.";
      showSnackbar(errorMessage, "error");
    }
  };
  
  // Render loading state
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
  
  // Render tabs content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <SocietyTab 
            societies={allSocieties} 
            handleLeaveSociety={handleLeaveSociety} 
            styleProps={styleProps} 
          />
        );
      case 1:
        return (
          <EventsTab 
            events={dashboardData.events} 
            societies={allSocieties}
            userId={user?.id}
            handleRSVP={handleRSVP} 
            styleProps={styleProps} 
          />
        );
      case 2:
        return (
          <NotificationsTab 
            notifications={dashboardData.notifications} 
            markNotificationAsRead={markNotificationAsRead} 
            styleProps={styleProps} 
          />
        );
      case 3:
        return (
          <AwardsTab 
            awards={dashboardData.awards} 
            styleProps={styleProps} 
          />
        );
      case 4:
        return (
          <Box>
            <SocietyNewsFeed />
          </Box>
        );
      default:
        return null;
    }
  };
  
  return (
    <Box minHeight="100vh" bgcolor={colours.primary[500]} py={8}>
      <Box maxWidth="1920px" mx="auto" px={4}>
        <DashboardHeader 
          student={dashboardData.student} 
          navigate={navigate} 
          styleProps={styleProps} 
        />
        
        <StatCards 
          societies={allSocieties}
          events={dashboardData.events}
          notifications={dashboardData.notifications}
          awards={dashboardData.awards}
          styleProps={styleProps}
          getMyEventsCount={getMyEventsCount}
        />
        
        <TabsContainer
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          tabColors={tabColors}
        >
          {renderTabContent()}
        </TabsContainer>
        
        <StartSocietySection
          navigate={navigate}
          student={dashboardData.student}
          styleProps={styleProps}
        />
        
        <CalendarSection
          showCalendar={showCalendar}
          toggleCalendar={toggleCalendar}
          student={dashboardData.student}
          navigate={navigate}
          societies={allSocieties}
          events={dashboardData.events}
          styleProps={styleProps}
        />
      </Box>
      
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarState.severity} sx={{ width: "100%" }}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDashboard;