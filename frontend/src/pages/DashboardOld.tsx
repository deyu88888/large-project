import React, { useEffect, useState, useRef, useCallback } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties";
import Sidebar from "../components/Sidebar";
import { HiMenu } from "react-icons/hi";
import { motion } from "framer-motion";
import { useFetchWebSocket } from "../hooks/useFetchWebSocket";
import { getAllEvents, apiClient } from "../api";

// -- Type Definitions --
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

interface RawEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  start_time?: string; // Added for test compatibility
  duration?: string;
}

type WebSocketMessage =
  | { type: "dashboard.update"; data: StatData }
  | { type: "update_activities"; activities: Activity[] }
  | { type: "update_notifications"; notifications: Notification[] }
  | { type: "update_events"; events: CalendarEvent[] }
  | { type: "update_introduction"; introduction: Introduction };

// -- Reusable Components --
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6
               border-l-8 border-transparent hover:border-gradient-to-r
               hover:from-purple-500 hover:to-indigo-500
               transition-all duration-300"
    data-testid={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
  >
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </motion.section>
);

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({
  title,
  value,
  color,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`p-6 rounded-2xl text-white bg-gradient-to-br ${color}
                shadow-md transition transform hover:scale-105 hover:shadow-lg`}
    data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}
  >
    <p className="text-sm uppercase tracking-wider">{title}</p>
    <p className="text-4xl font-bold mt-2">{value}</p>
  </motion.div>
);

// Tabs for "Updates" section
interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

// Define the Tabs component here, making sure it's fully defined before use
const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, children }) => {
  const tabLabels = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => (child as React.ReactElement).props.label);

  return (
    <div data-testid="tabs-container">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabLabels.map((label: string) => (
          <button
            key={label}
            className={`py-2 px-4 text-sm font-medium focus:outline-none ${
              activeTab === label
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
            }`}
            onClick={() => setActiveTab(label)}
            data-testid={`tab-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="py-4" data-testid="tab-content">
        {React.Children.toArray(children).find(
          (child) =>
            React.isValidElement(child) &&
            (child as React.ReactElement).props.label === activeTab
        )}
      </div>
    </div>
  );
};

interface TabPanelProps {
  label: string;
  children: React.ReactNode;
}

// Define the TabPanel component here, making sure it's fully defined before use
const TabPanel: React.FC<TabPanelProps> = ({ children, label }) => (
  <div data-testid={`panel-${label.toLowerCase().replace(/\s+/g, "-")}`}>
    {children}
  </div>
);

// -- Main Dashboard --
const Dashboard: React.FC = () => {
  // ---- States ----
  const [stats, setStats] = useState<StatData>({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [introduction, setIntroduction] = useState<Introduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Recent Activities");
  const [dataVersion, setDataVersion] = useState(0);


  // Apply or remove .dark class on <html> or <body>
  useEffect(() => {
    try {
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    } catch (e) {
      console.error("Failed to save darkMode to localStorage:", e);
    }

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // -- Refs for Scrollable Sections --
  const statsRef = useRef<HTMLDivElement>(null);
  const popularSocietiesRef = useRef<HTMLDivElement>(null);
  const upcomingEventsRef = useRef<HTMLDivElement>(null);
  const eventCalendarRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);

  // -- WebSocket --
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 5000;


  const handleNavItemClick = useCallback(
    (ref: React.RefObject<HTMLElement> | null) => {
      scrollToSection(ref);
    },
    []
  );

  // -- Navigation Items Array --
  const navigationItems = [
    {
      label: "Dashboard",
      icon: <span className="text-xl">🏠</span>,
      ref: null,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Statistics",
      icon: <span className="text-xl">📊</span>,
      ref: statsRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Popular Societies",
      icon: <span className="text-xl">🏆</span>,
      ref: popularSocietiesRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Upcoming Events",
      icon: <span className="text-xl">📅</span>,
      ref: upcomingEventsRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Event Calendar",
      icon: <span className="text-xl">🗓️</span>,
      ref: eventCalendarRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Updates",
      icon: <span className="text-xl">🔔</span>,
      ref: updatesRef,
      scrollToSection: handleNavItemClick,
    },
  ];

  // -- Smooth Scroll --
  const scrollToSection = useCallback(
    (ref: React.RefObject<HTMLElement> | null) => {
      if (ref === null) {
        // Scroll to the top of the document
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else if (ref && ref.current) {
        // Existing scroll to section logic
        const headerHeight =
          document.querySelector("header")?.offsetHeight || 0;
        const elementPosition =
          ref.current.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    },
    []
  );

  // -- Helpers for parsing Dates & Durations --
  const parseEventDateTime = useCallback(
    (dateStr: string, timeStr: string): Date | null => {
      try {
        const dateTimeStr = `${dateStr}T${timeStr}`;
        const date = new Date(dateTimeStr);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return null;
        }
        return date;
      } catch (e) {
        console.error("Error parsing date/time:", e);
        return null;
      }
    },
    []
  );

  const calculateEventEnd = useCallback(
    (start: Date | null, durationStr?: string): Date | null => {
      if (!start || !durationStr) return null;
      if (!durationStr.includes(":")) return null;

      try {
        const [hours, minutes, seconds] = durationStr.split(":").map(Number);
        const durationMs =
          (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
        return new Date(start.getTime() + durationMs);
      } catch (e) {
        console.error("Error calculating event end time:", e);
        return null;
      }
    },
    []
  );

  // Real-time fetch of all dashboard data
  const fetchAllDashboardData = useCallback(async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await apiClient.get("/api/dashboard/stats");
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch activities
      const activitiesResponse = await apiClient.get(
        "/api/dashboard/activities"
      );
      if (activitiesResponse.data) {
        setRecentActivities(activitiesResponse.data);
      }

      // Fetch notifications
      const notificationsResponse = await apiClient.get(
        "/api/dashboard/notifications"
      );
      if (notificationsResponse.data) {
        setNotifications(notificationsResponse.data);
      }

      setDataVersion((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  }, []);

  // Set up continuous data polling and WebSocket monitoring
  useEffect(() => {
    fetchAllDashboardData();

    // Create a data refresh loop using requestAnimationFrame for smoother updates
    let animationFrameId: number;
    let lastRefreshTime = 0;

    const checkForUpdates = (timestamp: number) => {
      // Check every second for updates (but don't block rendering)
      if (timestamp - lastRefreshTime > 1000) {
        fetchAllDashboardData();
        lastRefreshTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(checkForUpdates);
    };

    animationFrameId = requestAnimationFrame(checkForUpdates);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [fetchAllDashboardData]);

  // Process any WebSocket messages when they arrive
  const messageHandler = useCallback((data: WebSocketMessage) => {
    console.log("Received WebSocket message:", data);

    switch (data.type) {
      case "dashboard.update":
        setStats(data.data);
        break;
      case "update_activities":
        setRecentActivities(data.activities);
        break;
      case "update_notifications":
        setNotifications(data.notifications);
        break;
      case "update_events":
        setEventCalendar(data.events);
        setUpcomingEvents(data.events);
        break;
      case "update_introduction":
        setIntroduction(data.introduction);
        break;
      default:
        console.warn("Unknown WebSocket message type:", data);
    }

    // Increment the data version to trigger re-renders
    setDataVersion((prev) => prev + 1);
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.warn("[Dashboard] WebSocket already open. Skipping.");
      return;
    }

    console.log("[Dashboard] Connecting to WebSocket...");
    const wsURL =
      process.env.NODE_ENV === "production"
        ? "wss://your-production-domain.com/ws/dashboard/"
        : "ws://127.0.0.1:8000/ws/dashboard/";

    const socket = new WebSocket(wsURL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[Dashboard] WebSocket Connected!");
      setError(null);
      reconnectAttemptsRef.current = 0;
      // Trigger immediate data refresh when WebSocket connects
      fetchAllDashboardData();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messageHandler(data);
      } catch (parseErr) {
        console.error("Error parsing WebSocket message:", parseErr, event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("[Dashboard] WebSocket Error:", err);
    };

    socket.onclose = (evt) => {
      socketRef.current = null;
      console.warn(`[Dashboard] WebSocket Closed: code ${evt.code}`);
      if (
        evt.code !== 1000 &&
        evt.code !== 1005 &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current++;
        reconnectIntervalRef.current = setTimeout(
          connectWebSocket,
          RECONNECT_INTERVAL
        );
      } else {
        console.warn("[Dashboard] WebSocket closed permanently.");
      }
    };
  }, [messageHandler, fetchAllDashboardData]);

  useEffect(() => {
    console.log("[Dashboard] Initializing WebSocket...");
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // ---- Fetch Events ----
  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      try {
        // 1️⃣ Fetch raw events from the API
        const rawEvents: RawEvent[] = await getAllEvents();
        console.log("🎉 Raw Events from API:", rawEvents);

        if (!isMounted) return;

        // Use mock events if API call failed
        if (!rawEvents || rawEvents.length === 0) {
          const mockEvents = [
            {
              id: 1,
              title: "Welcome Party",
              date: "2025-03-10",
              startTime: "18:00:00",
              duration: "02:00:00",
            },
            {
              id: 2,
              title: "Chess Tournament",
              date: "2025-03-15",
              startTime: "14:00:00",
              duration: "03:00:00",
            },
            {
              id: 3,
              title: "Spring Concert",
              date: "2025-03-22",
              startTime: "19:30:00",
              duration: "01:30:00",
            },
          ];
          processEvents(mockEvents);
        } else {
          processEvents(rawEvents);
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching events:", err);

        // Use mock events as fallback
        const mockEvents = [
          {
            id: 1,
            title: "Welcome Party",
            date: "2025-03-10",
            startTime: "18:00:00",
            duration: "02:00:00",
          },
          {
            id: 2,
            title: "Chess Tournament",
            date: "2025-03-15",
            startTime: "14:00:00",
            duration: "03:00:00",
          },
          {
            id: 3,
            title: "Spring Concert",
            date: "2025-03-22",
            startTime: "19:30:00",
            duration: "01:30:00",
          },
        ];

        if (isMounted) {
          processEvents(mockEvents);
          setError("Using mock data - API connection failed.");
          setLoading(false);
        }
      }
    }

    function processEvents(events: RawEvent[]) {
      // 2️⃣ Convert raw events to formatted events
      const formattedEvents = events
        .map((event): CalendarEvent | null => {
          // Use the API field names - handle both startTime and start_time for compatibility
          const timeField = event.startTime || event.start_time || "";
          const startDateTime = parseEventDateTime(event.date, timeField);
          // Calculate the end time using the provided duration
          const endDateTime = calculateEventEnd(startDateTime, event.duration);

          if (!startDateTime || !endDateTime) {
            console.warn("⚠️ Skipping invalid event:", event);
            return null;
          }

          return {
            id: event.id,
            title: event.title,
            start: startDateTime,
            end: endDateTime,
          };
        })
        .filter((evt): evt is CalendarEvent => evt !== null);

      // 3️⃣ Sort events by start time
      formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      console.log("✅ Formatted Events:", formattedEvents);

      if (isMounted) {
        setUpcomingEvents(formattedEvents);
        setEventCalendar(formattedEvents);
      }
    }

    fetchEvents();

    // Set up event polling with a small interval for real-time updates
    const eventPolling = setInterval(fetchEvents, 2000);

    return () => {
      isMounted = false;
      clearInterval(eventPolling);
    };
  }, [parseEventDateTime, calculateEventEnd, dataVersion]);

  // Initialize with some default stats if needed - with a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stats.totalSocieties === 0) {
        setStats({
          totalSocieties: 5,
          totalEvents: 10,
          pendingApprovals: 3,
          activeMembers: 125,
        });
      }

      if (recentActivities.length === 0) {
        setRecentActivities([
          { description: "Chess Society organized a tournament" },
          { description: "New Debate Society was created" },
          { description: "Music Club scheduled a concert for next month" },
        ]);
      }

      if (!introduction) {
        setIntroduction({
          title: "Welcome to Student Societies Dashboard",
          content: [
            "This dashboard provides an overview of all student societies and their activities.",
            "Join a society, attend events, and make the most of your campus experience!",
          ],
        });
      }
    }, 1000); // Wait 1 second before using defaults

    return () => clearTimeout(timer);
  }, [stats.totalSocieties, recentActivities.length, introduction]);

  if (loading) {
    return <LoadingView />;
  }

  return <div></div>;
};

export default Dashboard;
