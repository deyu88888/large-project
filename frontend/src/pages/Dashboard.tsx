import React, { useEffect, useState, useRef, useCallback } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties";
import { getAllEvents } from "../api";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar"; // Our advanced Sidebar (with dark mode toggle)
import { HiMenu, HiX } from "react-icons/hi";

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
const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, children }) => {
  const tabLabels = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => (child as React.ReactElement).props.label);

  return (
    <div>
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
          >
            {label}
          </button>
        ))}
      </div>
      <div className="py-4">
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
const TabPanel: React.FC<TabPanelProps> = ({ children }) => <>{children}</>;

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

  // Sidebar control - Now manages width instead of open/closed state
  const [sidebarWidth, setSidebarWidth] = useState<'collapsed' | 'expanded'>('collapsed');

  // -- Dark Mode --
  const [darkMode, setDarkMode] = useState(() => {
    // Optional: read from localStorage or system preference
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // Or default to system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark;
  });

  // Apply or remove .dark class on <html> or <body>
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // -- Refs for Scrollable Sections --
  const introRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const popularSocietiesRef = useRef<HTMLDivElement>(null);
  const upcomingEventsRef = useRef<HTMLDivElement>(null);
  const eventCalendarRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);

  // -- WebSocket --
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 5000;

 // -- Toggle Sidebar --
const handleToggleSidebar = () => {
    setSidebarWidth((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsed'));
  };

  // -- Navigation Items Array --
  const navigationItems = [
    {
      label: "Dashboard",
      icon: <span className="text-xl">🏠</span>,
      ref: introRef,
    },
    {
      label: "Statistics",
      icon: <span className="text-xl">📊</span>,
      ref: statsRef,
    },
    {
      label: "Popular Societies",
      icon: <span className="text-xl">🏆</span>,
      ref: popularSocietiesRef,
    },
    {
      label: "Upcoming Events",
      icon: <span className="text-xl">📅</span>,
      ref: upcomingEventsRef,
    },
    {
      label: "Event Calendar",
      icon: <span className="text-xl">🗓️</span>,
      ref: eventCalendarRef,
    },
    {
      label: "Updates",
      icon: <span className="text-xl">🔔</span>,
      ref: updatesRef,
    },
  ];

  // -- Smooth Scroll --
  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      const headerOffset = document.querySelector("header")?.offsetHeight || 0;
      const elementPos =
        ref.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPos = elementPos - headerOffset;
      window.scrollTo({
        top: offsetPos,
        behavior: "smooth",
      });
    }
  };

    // ---- Fetch Events ----
    useEffect(() => {
        let isMounted = true;
        const fetchEvents = async () => {
            try {
                const rawEvents: RawEvent[] = await getAllEvents();
                console.log("🎉 Raw Events from API:", rawEvents);

                const formattedEvents: CalendarEvent[] = rawEvents
                    .map((event): CalendarEvent | null => {
                        const startDateTime = parseEventDateTime(event.date, event.startTime);
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

                formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
                console.log("✅ Formatted Events:", formattedEvents);

                if (isMounted) {
                    setUpcomingEvents(formattedEvents);
                    setEventCalendar(formattedEvents);
                }
            } catch (err) {
                console.error("❌ Error fetching events:", err);
                if (isMounted) {
                    setError("Failed to fetch events.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchEvents();

        return () => {
            isMounted = false;
        };
    }, []);

  // ---- WebSocket Handlers & Connection ----
  const messageHandler = useCallback((data: WebSocketMessage) => {
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
  }, []);

  useEffect(() => {
    console.log("[Dashboard] Initializing WebSocket...");
    let reconnectAttempts = 0;
    const wsURL =
      process.env.NODE_ENV === "production"
        ? "wss://your-production-domain.com/ws/dashboard/"
        : "ws://127.0.0.1:8000/ws/dashboard/";

    const connectWebSocket = () => {
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.warn("[Dashboard] WebSocket already open. Skipping.");
        return;
      }

      console.log("[Dashboard] Connecting to WebSocket...");
      const socket = new WebSocket(wsURL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[Dashboard] WebSocket Connected!");
        setError(null);
        reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          messageHandler(data);
        } catch (parseErr) {
          console.error("Error parsing WebSocket message:", parseErr, event.data);
          setError("Error parsing WebSocket message.");
        }
      };

      socket.onerror = (err) => {
        console.error("[Dashboard] WebSocket Error:", err);
        setError("WebSocket connection failed.");
      };

      socket.onclose = (evt) => {
        socketRef.current = null;
        console.warn(`[Dashboard] WebSocket Closed: code ${evt.code}`);
        if (
          evt.code !== 1000 &&
          evt.code !== 1005 &&
          reconnectAttempts < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttempts++;
          reconnectIntervalRef.current = setTimeout(
            connectWebSocket,
            RECONNECT_INTERVAL
          );
        } else {
          console.warn("[Dashboard] WebSocket closed permanently.");
        }
      };
    };
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
  }, [messageHandler]);

  // -- Helpers for parsing Dates & Durations --
  const parseEventDateTime = (dateStr: string, timeStr: string): Date | null => {
    try {
      return new Date(`${dateStr}T${timeStr}`);
    } catch {
      return null;
    }
  };

  const calculateEventEnd = (start: Date | null, durationStr?: string): Date | null => {
    if (!start || !durationStr) return null;
    if (!durationStr.includes(":")) return null;
    const [hours, minutes, seconds] = durationStr.split(":").map(Number);
    const durationMs = (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
    return new Date(start.getTime() + durationMs);
  };

  if (loading) {
    return <LoadingView />;
  }

  return (
    // Wrap the entire layout in a container that respects the dark mode and uses CSS Grid
    <div
      className={`min-h-screen flex ${
        darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      } transition-colors duration-500 grid grid-cols-[auto_1fr]`}
      style={{
        gridTemplateColumns: sidebarWidth === 'collapsed' ? 'auto 1fr' : '288px 1fr',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={true} // Sidebar is always present in the layout
        onClose={handleToggleSidebar}  //  Use toggle handler for expand/collapse
        navigationItems={navigationItems}
        scrollToSection={scrollToSection}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        sidebarWidth={sidebarWidth} // Pass the width state
        // showFloatingToggle={false} No longer needed
      />

      {/* Main Content */}
      <div className="flex-grow pt-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-md fixed top-0  z-10 w-full"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Toggle Button */}
              <button
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800
                           dark:hover:text-white focus:outline-none"
                onClick={handleToggleSidebar}
                aria-label="Toggle Menu"
              >
                {sidebarWidth === 'collapsed' ? (
                  <HiMenu className="h-6 w-6" />
                ) : (
                  <HiX className="h-6 w-6" />
                )}
              </button>
              <span role="img" aria-label="sparkles" className="text-3xl">
                ✨
              </span>
              <h1 className="text-xl font-extrabold tracking-wide text-gray-800 dark:text-gray-100">
                Student Society Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-full border border-gray-300
                           dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ caretColor: "black" }}
              />
              <Link
                to="/register"
                className="px-4 py-2 bg-purple-600 text-white
                           rounded-full shadow hover:bg-purple-700 transition"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 bg-purple-600 text-white
                           rounded-full shadow hover:bg-purple-700 transition"
              >
                Login
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Main Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
          {/* Introduction */}
          <SectionCard title={introduction?.title || "Welcome!"}>
            <div ref={introRef}>
              {introduction?.content?.length ? (
                introduction.content.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-gray-700 dark:text-gray-200 text-base leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-base">
                  No introduction available.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Statistics */}
          <div
            ref={statsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard
              title="Total Societies"
              value={stats.totalSocieties}
              color="from-purple-600 to-purple-400"
            />
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              color="from-green-600 to-green-400"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              color="from-yellow-600 to-yellow-400"
            />
            <StatCard
              title="Active Members"
              value={stats.activeMembers}
              color="from-blue-600 to-blue-400"
            />
          </div>

          {/* Popular Societies */}
          <motion.section
            ref={popularSocietiesRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6
                       border-l-8 border-transparent hover:border-gradient-to-r
                       hover:from-purple-500 hover:to-indigo-500
                       transition-all duration-300"
          >
            <PopularSocieties />
          </motion.section>

          {/* Upcoming Events */}
          <SectionCard title="Upcoming Events">
            <div ref={upcomingEventsRef}>
              {upcomingEvents.length > 0 ? (
                <UpcomingEvents events={upcomingEvents} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center animate-pulse">
                  No upcoming events.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Event Calendar */}
          <SectionCard title="Event Calendar">
            <div ref={eventCalendarRef}>
              {eventCalendar.length > 0 ? (
                <EventCalendar events={eventCalendar} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center animate-pulse">
                  No events scheduled yet.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Updates */}
          <SectionCard title="Updates">
            <div ref={updatesRef}>
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab}>
                <TabPanel label="Recent Activities">
                  {recentActivities.length ? (
                    <ul className="space-y-2 pl-4 list-disc">
                      {recentActivities.map((activity, idx) => (
                        <li
                          key={idx}
                          className="text-gray-700 dark:text-gray-200 text-base"
                        >
                          {activity.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-base">
                      No recent activities.
                    </p>
                  )}
                </TabPanel>
                <TabPanel label="Notifications">
                  {notifications.length ? (
                    <ul className="space-y-2 pl-4 list-disc">
                      {notifications.map((notification, idx) => (
                        <li
                          key={idx}
                          className="text-gray-700 dark:text-gray-200 text-base"
                        >
                          {notification.message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-base">
                      No notifications.
                    </p>
                  )}
                </TabPanel>
              </Tabs>
            </div>
          </SectionCard>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-red-100 dark:bg-red-900 border-l-8 border-red-600
                         text-red-800 dark:text-red-200 p-6 rounded-2xl shadow-md"
            >
              <strong>Error:</strong> {error}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;