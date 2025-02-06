import React, { useEffect, useState, useRef, useCallback } from "react";
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";

// Debug message remains for clarity
console.log("=== React app is running! ===");

// --- Type Definitions ---
interface StatData {
  totalSocieties: number;
  totalEvents: number;
  pendingApprovals: number;
  activeMembers: number;
}

interface Activity {
  description: string; // Add other fields as needed
}

interface Notification {
  message: string; // Add other fields as needed
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

interface Introduction {
  title: string;
  content: string[]; // content is an array of strings
}

interface DashboardUpdateMessage {
  type: "dashboard.update";
  data: StatData;
}

interface ActivitiesUpdateMessage {
  type: "update_activities";
  activities: Activity[];
}

interface NotificationsUpdateMessage {
  type: "update_notifications";
  notifications: Notification[];
}

interface EventsUpdateMessage {
  type: "update_events";
  events: { title: string; start: string; end: string }[];
}

interface IntroductionUpdateMessage {
  type: "update_introduction";
  introduction: Introduction;
}

type WebSocketMessage =
  | DashboardUpdateMessage
  | ActivitiesUpdateMessage
  | NotificationsUpdateMessage
  | EventsUpdateMessage
  | IntroductionUpdateMessage;


const Dashboard: React.FC = () => {
  // State for dashboard data
  const [stats, setStats] = useState<StatData>({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);

  // State for the introduction.  Initialize as null.
  const [introduction, setIntroduction] = useState<Introduction | null>(null);

  // UI and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState(""); // Controlled input

  // WebSocket connection tracking
  const isConnectedRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null); // Store interval ID


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
      case "update_events": {
        const formattedEvents = data.events.map((ev) => ({
          title: ev.title,
          start: new Date(ev.start),
          end: new Date(ev.end),
        }));
        setEventCalendar(formattedEvents);
        break;
      }
      case "update_introduction":
        setIntroduction(data.introduction);
        break;
      default:
        console.warn("Unknown message type:", data.type);
    }
  }, [setStats, setRecentActivities, setNotifications, setEventCalendar, setIntroduction]);


  useEffect(() => {
    console.log("%c[Dashboard] Component mounted", "color: #2f8de4; font-weight: bold;");

    const connectWebSocket = () => {
      console.log("%c[Dashboard] Attempting to create WebSocket connection...", "color: #2f8de4;");
      const wsURL =
        process.env.NODE_ENV === "production"
          ? "wss://your-production-domain.com/ws/dashboard/"
          : "ws://127.0.0.1:8000/ws/dashboard/";

      try {
        const socket = new WebSocket(wsURL);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log(
            "%c[Dashboard] WebSocket connected successfully!",
            "color: green; font-weight: bold;"
          );
          isConnectedRef.current = true;
          setError(null);
          // *Don't* set loading to false here. Wait for data.

          if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current);
            reconnectIntervalRef.current = null;
            console.log(
              "%c[Dashboard] Reconnection successful. Clearing reconnect interval.",
              "color: #27ae60;"
            );
          }
        };

        socket.onmessage = (event) => {
          console.log("%c[Dashboard] Raw WebSocket message received:", "color: #8e44ad;", event.data);
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log("%c[Dashboard] Parsed data:", data);
            messageHandler(data);
          } catch (parseError) {
            console.error("Error parsing WebSocket message:", parseError);
            setError("Error parsing WebSocket message.");
          }
        };

        socket.onerror = (wsError) => {
          console.error("%c[Dashboard] WebSocket error:", "color: red;", wsError);
          setError("WebSocket connection failed. Please refresh.");
        };

        socket.onclose = (event) => {
          console.warn("%c[Dashboard] WebSocket closed with code:", "color: orange;", event.code);
          isConnectedRef.current = false; // Set to false on close

          if (event.code !== 1000 && event.code !== 1005) { // Don't reconnect on normal closure
              if (!reconnectIntervalRef.current) { // Check if interval is already set
                console.log("%c[Dashboard] Starting reconnect interval...", "color: #f1c40f;");
                reconnectIntervalRef.current = setInterval(connectWebSocket, 5000);
            }
          }
        };

      } catch (err) {
        console.error("%c[Dashboard] WebSocket initialization failed:", "color: red;", err);
        setError("Failed to initialize WebSocket connection.");
      }
    };

    connectWebSocket();

    return () => {
      console.log("%c[Dashboard] Cleaning up WebSocket connection...", "color: #2f8de4;");
      isConnectedRef.current = false; // Ensure it's set to false on unmount
      if (socketRef.current) {
        console.log("%c[Dashboard] Closing WebSocket...", "color: #2f8de4;");
        socketRef.current.close(); // Close the socket
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current); // Clear any pending reconnect attempts
        reconnectIntervalRef.current = null; // Reset the interval ID
      }
    };
    }, [messageHandler]);


    useEffect(() => {
        // Set loading to false *after* we've received both stats *and* introduction
        if (stats.totalSocieties >= 0 && introduction !== null) {
            setLoading(false);
        }
    }, [stats, introduction]);

  // Debug effect (keep this, but add introduction to the dependencies)
  useEffect(() => {
    console.log("%c[Dashboard] Current stats:", "color: #27ae60;", stats);
    console.log("%c[Dashboard] Current recent activities:", "color: #27ae60;", recentActivities);
    console.log("%c[Dashboard] Current notifications:", "color: #27ae60;", notifications);
    console.log("%c[Dashboard] Current event calendar:", "color: #27ae60;", eventCalendar);
    console.log("%c[Dashboard] Current introduction:", "color: #27ae60;", introduction);
  }, [stats, recentActivities, notifications, eventCalendar, introduction]);


  if (loading) {
    console.log("%c[Dashboard] Loading dashboard data...", "color: #2f8de4;");
    return <LoadingView />;
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6 space-y-10">
      {/* ========== HEADER ========== */}
      <header className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center animate-fadeIn">
        <h1 className="text-3xl font-bold tracking-widest flex items-center gap-2">
          <span role="img" aria-label="star">
            ✨
          </span>
          Student Society Dashboard
        </h1>
        <div className="flex gap-4 items-center">
          {/* Controlled input with black caret */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 shadow text-gray-800"
            style={{ caretColor: "black" }}
          />
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105">
            <Link to={"/register"}>Register</Link>
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105">
            <Link to={"/login"}>Login</Link>
          </button>
        </div>
      </header>

    {/* ========== WEBSITE INTRODUCTION ========== */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
          <span role="img" aria-label="globe">
            🌐
          </span>
          {/* Show default title if no introduction, otherwise show the title */}
          {introduction ? introduction.title : "Welcome!"}
        </h2>
          {/*Show default content if no introduction, otherwise show the content */}
        {(introduction && introduction.content.length > 0) ? (
          introduction.content.map((paragraph, index) => (
            <p key={index} className="text-gray-600 leading-relaxed mt-2">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-gray-600 leading-relaxed mt-2">
            No introduction available.
          </p>
        )}
      </div>

      {/* ========== ERROR MESSAGE ========== */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-lg animate-pulse">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ========== STATS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="relative overflow-hidden rounded-xl shadow-xl p-6 text-white bg-gradient-to-r from-blue-600 to-blue-400 transition-transform transform hover:scale-105">
          <p className="uppercase text-sm">Total Societies</p>
          <p className="text-5xl font-extrabold">{stats.totalSocieties}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl shadow-xl p-6 text-white bg-gradient-to-r from-green-600 to-green-400 transition-transform transform hover:scale-105">
          <p className="uppercase text-sm">Total Events</p>
          <p className="text-5xl font-extrabold">{stats.totalEvents}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl shadow-xl p-6 text-white bg-gradient-to-r from-yellow-600 to-yellow-400 transition-transform transform hover:scale-105">
          <p className="uppercase text-sm">Pending Approvals</p>
          <p className="text-5xl font-extrabold">{stats.pendingApprovals}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl shadow-xl p-6 text-white bg-gradient-to-r from-purple-600 to-purple-400 transition-transform transform hover:scale-105">
          <p className="uppercase text-sm">Active Members</p>
          <p className="text-5xl font-extrabold">{stats.activeMembers}</p>
        </div>
      </div>

      {/* ========== RECENT ACTIVITIES ========== */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
          <span role="img" aria-label="fire">
            🔥
          </span>
          Recent Activities
        </h2>
        {recentActivities.length > 0 ? (
          <ul className="space-y-3 pl-4">
            {recentActivities.map((activity, idx) => (
              <li key={idx} className="text-gray-600 leading-relaxed">
                • {activity.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent activities found.</p>
        )}
      </div>

      {/* ========== EVENT CALENDAR ========== */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
          <span role="img" aria-label="calendar">
            📅
          </span>
          Event Calendar
        </h2>
        <EventCalendar events={eventCalendar} />
      </div>

      {/* ========== NOTIFICATIONS ========== */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
          <span role="img" aria-label="bell">
            🔔
          </span>
          Notifications
        </h2>
        {notifications.length > 0 ? (
          <ul className="space-y-3 pl-4">
            {notifications.map((notification, idx) => (
              <li key={idx} className="text-gray-600 leading-relaxed">
                • {notification.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No notifications found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;