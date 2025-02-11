import React, { useEffect, useState, useRef, useCallback } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties";
import { getAllEvents } from "../api";
import { motion } from "framer-motion";

console.log("=== React app is running! ===");

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

// ==================== REUSABLE COMPONENTS ====================

// SectionCard: Reusable container for dashboard sections.
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border-l-8 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all duration-300"
  >
    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </motion.section>
);

// StatCard: Reusable card for displaying statistics.
const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`p-6 rounded-2xl text-white bg-gradient-to-br ${color} shadow-md transition transform hover:scale-105 hover:shadow-lg`}
  >
    <p className="text-sm uppercase tracking-wider">{title}</p>
    <p className="text-4xl font-bold mt-2">{value}</p>
  </motion.div>
);

// Tabs Component:  Reusable tabs for the "Updates" section.
interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    children: React.ReactNode;
}
const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, children }) => {
    // Extract tab labels from children (assuming children are TabPanel components)
    const tabLabels = React.Children.toArray(children)
        .filter(child => React.isValidElement(child) && child.type === TabPanel)
        .map(child => (child as React.ReactElement).props.label);


    return (
        <div>
            <div className="flex border-b border-gray-200">
                {tabLabels.map((label) => (
                    <button
                        key={label}
                        className={`py-2 px-4 text-sm font-medium focus:outline-none ${
                            activeTab === label
                                ? "text-purple-600 border-b-2 border-purple-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActiveTab(label)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {/* Render the active tab's content. */}
            <div className="py-4">
                {React.Children.toArray(children).find(
                    child => React.isValidElement(child) && (child as React.ReactElement).props.label === activeTab
                )}
            </div>
        </div>
    );
};
//Tab Panel component
interface TabPanelProps {
    label: string;
    children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
    return <>{children}</>;
};

// ==================== MAIN DASHBOARD COMPONENT (Setup) ====================

const Dashboard: React.FC = () => {
  // State
  const [stats, setStats] = useState<StatData>({ totalSocieties: 0, totalEvents: 0, pendingApprovals: 0, activeMembers: 0 });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [introduction, setIntroduction] = useState<Introduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Recent Activities"); // State for active tab

  // WebSocket
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 5000;

  // --- Fetch All Events ---
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const rawEvents: RawEvent[] = await getAllEvents();
        console.log("🎉 Raw Events from API:", rawEvents);

        const formattedEvents: CalendarEvent[] = rawEvents
          .map((event): CalendarEvent | null => {
            const startDateTime = parseEventDateTime(event.date, event.startTime);
            const endDateTime = calculateEventEnd(startDateTime, event.duration);

            if (!startDateTime || !endDateTime) {
              console.warn(`⚠️ Skipping event with invalid date/time:`, event);
              return null;
            }
            return {
              id: event.id,
              title: event.title,
              start: startDateTime,
              end: endDateTime,
            };
          })
          .filter((event): event is CalendarEvent => event !== null);

        formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
        console.log("✅ Formatted Events (Sorted):", formattedEvents);
        setUpcomingEvents(formattedEvents);
        setEventCalendar(formattedEvents);
      } catch (error) {
        console.error("❌ Error fetching events:", error);
        setError("Failed to fetch events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // --- Date/Time Helpers ---
  const parseEventDateTime = (dateStr: string, timeStr: string): Date | null => {
    try {
      return new Date(`${dateStr}T${timeStr}`);
    } catch {
      return null;
    }
  };

  const calculateEventEnd = (start: Date | null, durationStr?: string): Date | null => {
    if (!start || !durationStr) return null;
    if (!durationStr.includes(':')) {
          return null;
      }
    const [hours, minutes, seconds] = durationStr.split(":").map(Number);
    const durationMs = (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
    return new Date(start.getTime() + durationMs);
  };

  // --- WebSocket Message Handler ---
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

  // --- WebSocket Connection Handling ---
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
        } catch (parseError) {
          console.error("Error parsing WebSocket message:", parseError, event.data);
          setError("Error parsing WebSocket message.");
        }
      };

      socket.onerror = (error) => {
        console.error("[Dashboard] WebSocket Error:", error);
        setError("WebSocket connection failed.");
      };

      socket.onclose = (event) => {
        socketRef.current = null;
        console.warn(`[Dashboard] WebSocket Closed: code ${event.code}`);

        if (event.code !== 1000 && event.code !== 1005 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`[Dashboard] Attempting WebSocket Reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          reconnectIntervalRef.current = setTimeout(connectWebSocket, RECONNECT_INTERVAL);
        } else {
          console.warn("[Dashboard] WebSocket closed permanently. No reconnection.");
        }
      };
    };

    connectWebSocket();

    return () => {
      console.log("[Dashboard] Cleaning up WebSocket...");
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
  // (Part 1 would be above this comment)

  if (loading) {
    return <LoadingView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Fixed Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md fixed top-0 left-0 right-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="sparkles" className="text-3xl">
              ✨
            </span>
            <h1 className="text-xl font-extrabold tracking-wide text-gray-800">
              Student Society Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500" // Updated focus ring color
              style={{ caretColor: "black" }}
            />
            <Link
              to="/register"
              className="px-4 py-2 bg-purple-600 text-white rounded-full shadow hover:bg-purple-700 transition" // Updated button color
            >
              Register
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-purple-600 text-white rounded-full shadow hover:bg-purple-700 transition" // Updated button color
            >
              Login
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="pt-20 max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Website Introduction */}
        <SectionCard title={introduction?.title || "Welcome!"}>
          {introduction?.content?.length ? (
            introduction.content.map((paragraph, idx) => (
              <p key={idx} className="text-gray-700 text-base leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-gray-700 text-base">No introduction available.</p>
          )}
        </SectionCard>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Societies" value={stats.totalSocieties} color="from-purple-600 to-purple-400" /> {/* Updated color */}
          <StatCard title="Total Events" value={stats.totalEvents} color="from-green-600 to-green-400" />
          <StatCard title="Pending Approvals" value={stats.pendingApprovals} color="from-yellow-600 to-yellow-400" />
          <StatCard title="Active Members" value={stats.activeMembers} color="from-blue-600 to-blue-400" /> {/* Updated color */}
        </div>

        {/* Popular Societies Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border-l-8 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all duration-300"
        >
          {/* No title or icon here, as it's handled within PopularSocieties */}
          <PopularSocieties />
        </motion.section>

        {/* Upcoming Events Section */}
        <SectionCard title="Upcoming Events">
          {upcomingEvents.length > 0 ? (
            <UpcomingEvents events={upcomingEvents} />
          ) : (
            <p className="text-gray-500 text-center animate-pulse">No upcoming events.</p>
          )}
        </SectionCard>

        {/* Event Calendar */}
        <SectionCard title="Event Calendar">
          {eventCalendar.length > 0 ? (
            <EventCalendar events={eventCalendar} />
          ) : (
            <p className="text-gray-500 text-center animate-pulse">No events scheduled yet.</p>
          )}
        </SectionCard>

        {/* Recent Activities & Notifications - Using the Tabs component */}
        <SectionCard title="Updates">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab}>
            <TabPanel label="Recent Activities">
              {recentActivities.length ? (
                <ul className="space-y-2 pl-4 list-disc">
                  {recentActivities.map((activity, idx) => (
                    <li key={idx} className="text-gray-700 text-base">
                      {activity.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-base">No recent activities.</p>
              )}
            </TabPanel>
            <TabPanel label="Notifications">
              {notifications.length ? (
                <ul className="space-y-2 pl-4 list-disc">
                  {notifications.map((notification, idx) => (
                    <li key={idx} className="text-gray-700 text-base">
                      {notification.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-base">No notifications.</p>
              )}
            </TabPanel>
          </Tabs>
        </SectionCard>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-red-100 border-l-8 border-red-600 text-red-800 p-6 rounded-2xl shadow-md"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;