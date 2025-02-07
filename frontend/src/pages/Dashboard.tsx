import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents"; // ✅ Import UpcomingEvents Component
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties"; // ✅ Import PopularSocieties Component
import { getAllEvents } from "../api"; // ✅ Import function to fetch events
import { motion } from "framer-motion"; // ✅ Added animations

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

// WebSocket message types
type WebSocketMessage =
  | { type: "dashboard.update"; data: StatData }
  | { type: "update_activities"; activities: Activity[] }
  | { type: "update_notifications"; notifications: Notification[] }
  | { type: "update_events"; events: { id: number; title: string; start: string; end: string }[] }
  | { type: "update_introduction"; introduction: Introduction };

const Dashboard: React.FC = () => {
  // State Management
  const [stats, setStats] = useState<StatData>({ totalSocieties: 0, totalEvents: 0, pendingApprovals: 0, activeMembers: 0 });
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

  // --- Fetch All Events for Both Calendar & Upcoming Events ---
  useEffect(() => {
    getAllEvents()
      .then((data) => {
        console.log("🎉 Raw Events from API:", data);

        interface RawEvent {
          id: number;
          title: string;
          date: string;
          startTime: string;
          duration?: string;
        }

        const formattedEvents: CalendarEvent[] = (data as RawEvent[])
          .map((event: RawEvent): CalendarEvent | null => {
            try {
              if (!event.duration || typeof event.duration !== "string" || !event.duration.includes(":")) {
                console.warn(`⚠️ Skipping event with invalid duration:`, event);
                return null;
              }

              const startDateTime = new Date(`${event.date}T${event.startTime}`);
              const [hours, minutes, seconds] = event.duration.split(":").map(Number);
              const durationMs = (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
              const endDateTime = new Date(startDateTime.getTime() + durationMs);

              return {
                id: event.id,
                title: event.title,
                start: startDateTime,
                end: endDateTime,
              };
            } catch (error) {
              console.error(`❌ Error processing event:`, event, error);
              return null;
            }
          })
          .filter((event): event is CalendarEvent => event !== null);

        formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

        console.log("✅ Formatted Events (Sorted):", formattedEvents);
        setUpcomingEvents(formattedEvents);
        setEventCalendar(formattedEvents);
      })
      .catch((error) => {
        console.error("❌ Error fetching events:", error);
        setError("Failed to fetch events.");
      });
  }, []);

  // --- WebSocket Message Handler ---
  const messageHandler = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case "dashboard.update":
        setStats((prev) => (prev.totalSocieties !== data.data.totalSocieties ? data.data : prev));
        break;
      case "update_activities":
        setRecentActivities((prev) => (prev.length !== data.activities.length ? data.activities : prev));
        break;
      case "update_notifications":
        setNotifications((prev) => (prev.length !== data.notifications.length ? data.notifications : prev));
        break;
      case "update_events": {
        const formattedEvents = data.events.map((ev) => ({
          id: ev.id,
          title: ev.title,
          start: new Date(ev.start),
          end: new Date(ev.end),
        }));
        setEventCalendar(formattedEvents);
        setUpcomingEvents(formattedEvents);
        break;
      }
      case "update_introduction":
        setIntroduction((prev) => (prev?.title !== data.introduction.title ? data.introduction : prev));
        break;
      default:
        console.warn("Unknown WebSocket message type:", data);
    }
  }, []);

  // --- WebSocket Connection Handling ---
  useEffect(() => {
    console.log("[Dashboard] Initializing WebSocket...");
    const wsURL = process.env.NODE_ENV === "production"
      ? "wss://your-production-domain.com/ws/dashboard/"
      : "ws://127.0.0.1:8000/ws/dashboard/";

    const connectWebSocket = () => {
      if (socketRef.current) {
        console.warn("[Dashboard] WebSocket already connected. Skipping reconnection.");
        return;
      }

      const socket = new WebSocket(wsURL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[Dashboard] WebSocket Connected!");
        setError(null);
        reconnectAttempts = 0;
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          messageHandler(data);
        } catch (parseError) {
          console.error("Error parsing WebSocket message:", parseError);
          setError("Error parsing WebSocket message.");
        }
      };

      socket.onerror = (error) => {
        console.error("[Dashboard] WebSocket Error:", error);
        setError("WebSocket connection failed.");
      };

      socket.onclose = (event) => {
        console.warn("[Dashboard] WebSocket Closed:", event.code);
        socketRef.current = null;

        if (event.code !== 1000 && event.code !== 1005 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`[Dashboard] Attempting WebSocket Reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          if (!reconnectIntervalRef.current) {
            reconnectIntervalRef.current = setTimeout(connectWebSocket, 5000);
          }
        } else {
          console.warn("[Dashboard] Maximum WebSocket reconnect attempts reached. Stopping retries.");
        }
      };
    };

    connectWebSocket();

    return () => {
      console.log("[Dashboard] Cleaning up WebSocket...");
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [messageHandler]);

  // Set loading state after stats & introduction are received
  useEffect(() => {
    if (stats.totalSocieties >= 0 && introduction !== null) {
      setLoading(false);
    }
  }, [stats, introduction]);

  if (loading) {
    return <LoadingView />;
  }

  // ==================== REUSABLE COMPONENTS ====================


  // Reusable section wrapper for each content block
  const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = memo(
    ({ title, icon, children }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-l-8 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all duration-300"
      >
        <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <span role="img" aria-hidden="true" className="text-4xl">{icon}</span>
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
      </motion.div>
    )
  );
  SectionCard.displayName = "SectionCard";

  // Reusable statistics card for dashboard
  const StatCard: React.FC<{ title: string; value: number; color: string }> = memo(
    ({ title, value, color }) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative rounded-2xl shadow-2xl p-8 text-white bg-gradient-to-br ${color} transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-2xl`}
      >
        <p className="uppercase tracking-widest text-lg">{title}</p>
        <p className="text-6xl font-extrabold mt-2">{value}</p>
      </motion.div>
    )
  );
  StatCard.displayName = "StatCard";

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-10 space-y-12">
      {/* ========== HEADER ========== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center animate-fadeInDown"
      >
        <h1 className="text-4xl font-extrabold tracking-widest flex items-center gap-3">
          <span role="img" aria-hidden="true" className="text-5xl">✨</span> Student Society Dashboard
        </h1>
        <div className="flex gap-6 items-center mt-4 md:mt-0">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 p-4 rounded-full focus:outline-none focus:ring-4 focus:ring-pink-300 shadow-lg text-gray-800"
            style={{ caretColor: "black" }}
          />
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105">
            <Link to="/register">Register</Link>
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105">
            <Link to="/login">Login</Link>
          </button>
        </div>
      </motion.header>

      {/* ========== WEBSITE INTRODUCTION ========== */}
      <SectionCard title={introduction?.title || "Welcome!"} icon="🌐">
        {introduction?.content?.length ? (
          introduction.content.map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed text-lg">{paragraph}</p>
          ))
        ) : (
          <p className="text-gray-700 leading-relaxed text-lg">No introduction available.</p>
        )}
      </SectionCard>

      {/* ========== STATS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard title="Total Societies" value={stats.totalSocieties} color="from-blue-600 to-blue-400" />
        <StatCard title="Total Events" value={stats.totalEvents} color="from-green-600 to-green-400" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} color="from-yellow-600 to-yellow-400" />
        <StatCard title="Active Members" value={stats.activeMembers} color="from-purple-600 to-purple-400" />
      </div>

      {/* 🔥 MOST POPULAR SOCIETIES SECTION */}
      <PopularSocieties />

      {/* 🕒 UPCOMING EVENTS SECTION (Fixed Prop) */}
      <SectionCard title="Upcoming Events" icon="📅">
        {upcomingEvents.length > 0 ? (
          <UpcomingEvents events={upcomingEvents} />
        ) : (
          <p className="text-gray-500 text-lg text-center animate-pulse">No upcoming events.</p> // ✅ Added Fallback UI
        )}
      </SectionCard>

      {/* ========== ERROR MESSAGE ========== */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-red-100 border-l-8 border-red-600 text-red-800 p-6 rounded-2xl shadow-lg animate-pulse"
        >
          <strong>Error:</strong> {error}
        </motion.div>
      )}

      {/* ========== RECENT ACTIVITIES ========== */}
      <SectionCard title="Recent Activities" icon="🔥">
        {recentActivities.length ? (
          <ul className="space-y-3 pl-4">
            {recentActivities.map((activity, idx) => (
              <li key={idx} className="text-gray-700 text-lg">• {activity.description}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-lg">No recent activities found.</p>
        )}
      </SectionCard>

      {/* ========== EVENT CALENDAR (Now Fills After Seeding) ========== */}
      <SectionCard title="Event Calendar" icon="📅">
        {eventCalendar.length > 0 ? (
          <EventCalendar events={eventCalendar} />
        ) : (
          <p className="text-gray-500 text-lg text-center animate-pulse">No events scheduled yet.</p> // ✅ Added Fallback UI
        )}
      </SectionCard>

      {/* ========== NOTIFICATIONS ========== */}
      <SectionCard title="Notifications" icon="🔔">
        {notifications.length ? (
          <ul className="space-y-3 pl-4">
            {notifications.map((notification, idx) => (
              <li key={idx} className="text-gray-700 text-lg">• {notification.message}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-lg">No notifications found.</p>
        )}
      </SectionCard>
    </div>
  );
};
export default Dashboard;