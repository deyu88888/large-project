import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties"; // ✅ Import PopularSocieties Component

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
  | { type: "update_events"; events: { title: string; start: string; end: string }[] }
  | { type: "update_introduction"; introduction: Introduction };

const Dashboard: React.FC = () => {
  // State Management
  const [stats, setStats] = useState<StatData>({ totalSocieties: 0, totalEvents: 0, pendingApprovals: 0, activeMembers: 0 });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);
  const [introduction, setIntroduction] = useState<Introduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // WebSocket references
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      case "update_events":
        setEventCalendar((prev) => {
          const formattedEvents = data.events.map(ev => ({
            title: ev.title,
            start: new Date(ev.start),
            end: new Date(ev.end),
          }));
          return prev.length !== formattedEvents.length ? formattedEvents : prev;
        });
        break;
      case "update_introduction":
        setIntroduction((prev) => (prev?.title !== data.introduction.title ? data.introduction : prev));
        break;
      default:
        console.warn("Unknown WebSocket message type:", data);
    }
  }, []);

  // --- WebSocket Connection Handling ---
  useEffect(() => {
    console.log("%c[Dashboard] Initializing WebSocket...", "color: #2f8de4;");
    const wsURL = process.env.NODE_ENV === "production"
      ? "wss://your-production-domain.com/ws/dashboard/"
      : "ws://127.0.0.1:8000/ws/dashboard/";

    const connectWebSocket = () => {
      if (socketRef.current) {
        console.warn("%c[Dashboard] WebSocket already connected. Skipping reconnection.", "color: orange;");
        return;
      }

      const socket = new WebSocket(wsURL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("%c[Dashboard] WebSocket Connected!", "color: green;");
        setError(null);
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
        console.error("%c[Dashboard] WebSocket Error:", "color: red;", error);
        setError("WebSocket connection failed.");
      };

      socket.onclose = (event) => {
        console.warn("%c[Dashboard] WebSocket Closed:", "color: orange;", event.code);
        socketRef.current = null;
        if (event.code !== 1000 && event.code !== 1005) {
          if (!reconnectIntervalRef.current) {
            console.log("%c[Dashboard] Attempting WebSocket Reconnect...", "color: #f1c40f;");
            reconnectIntervalRef.current = setInterval(connectWebSocket, 5000);
          }
        }
      };
    };

    connectWebSocket();

    return () => {
      console.log("%c[Dashboard] Cleaning up WebSocket...", "color: #2f8de4;");
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

  // Debug Logs
  useEffect(() => {
    console.log("%c[Dashboard] Current State:", "color: #27ae60;", {
      stats,
      recentActivities,
      notifications,
      eventCalendar,
      introduction,
    });
  }, [stats, recentActivities, notifications, eventCalendar, introduction]);

  if (loading) {
    console.log("%c[Dashboard] Loading Dashboard...", "color: #2f8de4;");
    return <LoadingView />;
  }

  // ==================== REUSABLE COMPONENTS ====================

  // Reusable section wrapper for each content block
  const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = memo(
    ({ title, icon, children }) => (
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-l-8 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all duration-300">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <span role="img" aria-hidden="true" className="text-4xl">{icon}</span>
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
      </div>
    )
  );
  SectionCard.displayName = "SectionCard";

  // Reusable statistics card for dashboard
  const StatCard: React.FC<{ title: string; value: number; color: string }> = memo(
    ({ title, value, color }) => (
      <div
        className={`relative rounded-2xl shadow-2xl p-8 text-white bg-gradient-to-br ${color} transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-2xl`}
      >
        <p className="uppercase tracking-widest text-lg">{title}</p>
        <p className="text-6xl font-extrabold mt-2">{value}</p>
      </div>
    )
  );
  StatCard.displayName = "StatCard";

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-10 space-y-12">
      {/* ========== HEADER ========== */}
      <header className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-center animate-fadeInDown">
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
      </header>

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

      {/* ========== ERROR MESSAGE ========== */}
      {error && (
        <div className="bg-red-100 border-l-8 border-red-600 text-red-800 p-6 rounded-2xl shadow-lg animate-pulse">
          <strong>Error:</strong> {error}
        </div>
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

      {/* ========== EVENT CALENDAR ========== */}
      <SectionCard title="Event Calendar" icon="📅">
        <EventCalendar events={eventCalendar ?? []} />
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