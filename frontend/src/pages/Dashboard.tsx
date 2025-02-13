// Dashboard.tsx
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  ReactNode
} from "react";
import { Box, Typography, useTheme, Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// --- MUI Theme Tokens ---
import { tokens } from "../theme/theme";

// --- API Calls ---
import { getAllEvents } from "../api";

// --- Components ---
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import PopularSocieties from "../components/PopularSocieties";
import { LoadingView } from "../components/loading/loading-view";

// --- Type Definitions ---
interface StatData {
  totalSocieties: number;
  totalEvents: number;
  pendingApprovals: number;
  activeMembers: number;
}

interface Activity {
  description: string;
}

interface Notification {
  message: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

interface Introduction {
  title: string;
  content: string[];
}

// WebSocket message types
type WebSocketMessage =
  | { type: "dashboard.update"; data: StatData }
  | { type: "update_activities"; activities: Activity[] }
  | { type: "update_notifications"; notifications: Notification[] }
  | {
      type: "update_events";
      events: { id: number; title: string; start: string; end: string }[];
    }
  | { type: "update_introduction"; introduction: Introduction };

/** 
 * Reusable container for each content block.
 * Includes an optional `bgColor` prop to override the default background color.
 */
interface SectionCardProps {
  title: string;
  icon: string;
  children: ReactNode;
  bgColor?: (theme: any) => string; // theme-based color override if desired
}

const SectionCard: React.FC<SectionCardProps> = memo(
  ({ title, icon, children, bgColor }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={(theme) => ({
            backgroundColor: bgColor
              ? bgColor(theme)
              : theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: 2,
            p: 2,
            mb: 4,
            borderLeft: "8px solid transparent",
            "&:hover": {
              borderLeftColor: theme.palette.primary.main
            }
          })}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              fontWeight: "bold"
            }}
          >
            <span role="img" aria-hidden="true" style={{ fontSize: "1.5rem" }}>
              {icon}
            </span>
            {title}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {children}
          </Box>
        </Box>
      </motion.div>
    );
  }
);
SectionCard.displayName = "SectionCard";

/** Reusable statistics card for your dashboard. */
const StatCard: React.FC<{
  title: string;
  value: number;
  color: string; // e.g. "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
}> = memo(({ title, value, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Box
      sx={{
        background: color,
        color: "#fff",
        borderRadius: 2,
        p: 2,
        boxShadow: 3,
        textAlign: "center",
        transition: "transform 0.3s",
        "&:hover": {
          transform: "scale(1.05)"
        }
      }}
    >
      <Typography variant="body2" sx={{ textTransform: "uppercase" }}>
        {title}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: "bold" }}>
        {value}
      </Typography>
    </Box>
  </motion.div>
));
StatCard.displayName = "StatCard";

const Dashboard: React.FC = () => {
  // MUI Theme + Colors
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State Management
  const [stats, setStats] = useState<StatData>({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [introduction, setIntroduction] = useState<Introduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // WebSocket references
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;
  let reconnectAttempts = 0;

  // Fetch All Events for Both Calendar & Upcoming Events
  useEffect(() => {
    getAllEvents()
      .then((data) => {
        interface RawEvent {
          id: number;
          title: string;
          date: string;
          startTime: string;
          duration?: string;
        }

        const formattedEvents: CalendarEvent[] = (data as RawEvent[])
          .map((event: RawEvent) => {
            try {
              const startDateTime = new Date(`${event.date}T${event.start_time}`); // ✅ Fixed field name
              let endDateTime: Date | null = null;

              // If duration exists, calculate the end time
              if (event.duration && typeof event.duration === "string" && event.duration.includes(":")) {
                const [hours, minutes, seconds] = event.duration.split(":").map(Number);
                const durationMs = (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
                endDateTime = new Date(startDateTime.getTime() + durationMs);
              }

              return {
                id: event.id,
                title: event.title,
                start: startDateTime,
                end: endDateTime
              };
            } catch (err) {
              console.error(`Error processing event:`, event, err);
              return null;
            }
          })
          .filter((evt): evt is CalendarEvent => evt !== null);


        formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

        setUpcomingEvents(formattedEvents);
        setEventCalendar(formattedEvents);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setError("Failed to fetch events.");
      });
  }, []);

  // WebSocket message handler
  const messageHandler = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case "dashboard.update":
        setStats((prev) =>
          prev.totalSocieties !== data.data.totalSocieties ? data.data : prev
        );
        break;
      case "update_activities":
        setRecentActivities((prev) =>
          prev.length !== data.activities.length ? data.activities : prev
        );
        break;
      case "update_notifications":
        setNotifications((prev) =>
          prev.length !== data.notifications.length ? data.notifications : prev
        );
        break;
      case "update_events": {
        const formatted = data.events.map((ev) => ({
          id: ev.id,
          title: ev.title,
          start: new Date(ev.start),
          end: new Date(ev.end)
        }));
        setEventCalendar(formatted);
        setUpcomingEvents(formatted);
        break;
      }
      case "update_introduction":
        setIntroduction((prev) =>
          prev?.title !== data.introduction.title ? data.introduction : prev
        );
        break;
      default:
        console.warn("Unknown WebSocket message type:", data);
    }
  }, []);

  // WebSocket connection handling
  useEffect(() => {
    const wsURL =
      process.env.NODE_ENV === "production"
        ? "wss://your-production-domain.com/ws/dashboard/"
        : "ws://127.0.0.1:8000/ws/dashboard/";

    const connectWebSocket = () => {
      if (socketRef.current) {
        console.warn("WebSocket already connected. Skipping reconnection.");
        return;
      }

      const socket = new WebSocket(wsURL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket Connected!");
        setError(null);
        reconnectAttempts = 0;
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsedData: WebSocketMessage = JSON.parse(event.data);
          messageHandler(parsedData);
        } catch (parseError) {
          console.error("Error parsing WebSocket message:", parseError);
          setError("Error parsing WebSocket message.");
        }
      };

      socket.onerror = (evt) => {
        console.error("WebSocket Error:", evt);
        setError("WebSocket connection failed.");
      };

      socket.onclose = (evt) => {
        console.warn("WebSocket Closed:", evt.code);
        socketRef.current = null;
        if (
          evt.code !== 1000 &&
          evt.code !== 1005 &&
          reconnectAttempts < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttempts++;
          console.log(
            `Attempting WebSocket Reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
          );
          if (!reconnectIntervalRef.current) {
            reconnectIntervalRef.current = setTimeout(connectWebSocket, 5000);
          }
        } else {
          console.warn("Max WebSocket reconnect attempts reached. Stopping.");
        }
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [messageHandler]);

  // Once we have stats and introduction, assume loaded
  useEffect(() => {
    if (stats.totalSocieties >= 0 && introduction !== null) {
      setLoading(false);
    }
  }, [stats, introduction]);

  if (loading) {
    return <LoadingView />;
  }

  // -- Default Introduction Fallback --
  const defaultIntroTitle = "Welcome to the Universal Student Society Platform!";
  const defaultIntroContent = [
    "This platform is designed to help student societies manage their members, share news, organize events, and much more. Whether you're a small club or a large society, we provide the tools you need to connect with your members and thrive.",
    "Key features include: membership management, event calendars, news feeds, notifications, and customizable society pages. Get started by registering your society or logging in!"
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        p: { xs: 2, md: 4 }
      }}
    >
      {/* HEADER:
          - Dark Mode => Primary Main w/ Contrast Text
          - Light Mode => White (#fff) w/ Black (#000)
      */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.primary.main
                : "#fff",
            color:
              theme.palette.mode === "dark"
                ? theme.palette.primary.contrastText
                : "#000",
            borderRadius: 2,
            p: 2,
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: 3
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Student Society Dashboard
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mt: { xs: 2, md: 0 }
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                bgcolor: "#fff",
                borderRadius: 1,
                width: { xs: "100%", md: 200 }
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to="/register"
            >
              Register
            </Button>
            <Button
              variant="contained"
              color="success"
              component={Link}
              to="/login"
            >
              Login
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* INTRODUCTION SECTION - now also uses white in light mode & primary main in dark */}
      <SectionCard
        title={introduction?.title || defaultIntroTitle}
        icon="🌐"
        bgColor={(theme) =>
          theme.palette.mode === "dark" ? theme.palette.primary.main : "#fff"
        }
      >
        {introduction?.content?.length ? (
          introduction.content.map((paragraph, index) => (
            <Typography
              key={index}
              variant="body1"
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.contrastText
                    : "#000"
              }}
            >
              {paragraph}
            </Typography>
          ))
        ) : (
          defaultIntroContent.map((paragraph, index) => (
            <Typography
              key={index}
              variant="body1"
              sx={{
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.contrastText
                    : "#000"
              }}
            >
              {paragraph}
            </Typography>
          ))
        )}
      </SectionCard>

      {/* STATS GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 4
        }}
      >
        <StatCard
          title="Total Societies"
          value={stats.totalSocieties}
          color="linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
        />
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          color="linear-gradient(45deg, #66BB6A 30%, #B2FF59 90%)"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          color="linear-gradient(45deg, #FFCA28 30%, #FFE082 90%)"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          color="linear-gradient(45deg, #AB47BC 30%, #CE93D8 90%)"
        />
      </Box>

      {/* POPULAR SOCIETIES */}
      <Box mb={4}>
        <PopularSocieties />
      </Box>

      {/* UPCOMING EVENTS */}
      <SectionCard title="Upcoming Events" icon="📅">
        {upcomingEvents.length > 0 ? (
          <UpcomingEvents events={upcomingEvents} />
        ) : (
          <Typography variant="body1" sx={{ color: colors.grey[500] }}>
            No upcoming events.
          </Typography>
        )}
      </SectionCard>

      {/* ERROR MESSAGE */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              backgroundColor: "#fdecea",
              borderLeft: "8px solid #f44336",
              color: "#b71c1c",
              p: 2,
              borderRadius: 2,
              mb: 4
            }}
          >
            <Typography variant="body1">
              <strong>Error:</strong> {error}
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* RECENT ACTIVITIES */}
      <SectionCard title="Recent Activities" icon="🔥">
        {recentActivities.length ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {recentActivities.map((activity, idx) => (
              <Typography
                key={idx}
                variant="body1"
                sx={{ color: colors.grey[800] }}
              >
                • {activity.description}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" sx={{ color: colors.grey[600] }}>
            No recent activities found.
          </Typography>
        )}
      </SectionCard>

      {/* EVENT CALENDAR */}
      <SectionCard title="Event Calendar" icon="📅">
        {eventCalendar.length > 0 ? (
          <EventCalendar events={eventCalendar} />
        ) : (
          <Typography variant="body1" sx={{ color: colors.grey[500] }}>
            No events scheduled yet.
          </Typography>
        )}
      </SectionCard>

      {/* NOTIFICATIONS */}
      <SectionCard title="Notifications" icon="🔔">
        {notifications.length ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {notifications.map((notification, idx) => (
              <Typography
                key={idx}
                variant="body1"
                sx={{ color: colors.grey[800] }}
              >
                • {notification.message}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" sx={{ color: colors.grey[600] }}>
            No notifications found.
          </Typography>
        )}
      </SectionCard>
    </Box>
  );
};

export default Dashboard;
