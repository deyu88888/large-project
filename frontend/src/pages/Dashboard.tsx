import React, { useEffect, useState, useRef } from "react";
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";

// Debug message remains for clarity
console.log("=== React app is running! ===");

const Dashboard: React.FC = () => {
  // State for dashboard data
  const [stats, setStats] = useState({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [eventCalendar, setEventCalendar] = useState<any[]>([]);

  // UI and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection tracking
  const isConnectedRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("%c[Dashboard] Component mounted", "color: #2f8de4; font-weight: bold;");

    let reconnectInterval: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      console.log("%c[Dashboard] Attempting to create WebSocket connection...", "color: #2f8de4;");
      const wsURL =
        process.env.NODE_ENV === "production"
          ? "wss://your-production-domain.com/ws/dashboard/"
          : "ws://127.0.0.1:8000/ws/dashboard/";

      try {
        const socket = new WebSocket(wsURL);
        socketRef.current = socket;

        // === onopen ===
        socket.onopen = () => {
          console.log("%c[Dashboard] WebSocket connected successfully!", "color: green; font-weight: bold;");
          isConnectedRef.current = true;
          setError(null);
          setLoading(false);

          if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
            console.log("%c[Dashboard] Reconnection successful. Clearing reconnect interval.", "color: #27ae60;");
          }
        };

        // === onmessage ===
        socket.onmessage = (event) => {
          console.log("%c[Dashboard] Raw WebSocket message received:", "color: #8e44ad;", event.data);

          try {
            const data = JSON.parse(event.data);
            console.log("%c[Dashboard] Parsed WebSocket message:", "color: #8e44ad;", data);

            if (!data.type) {
              console.warn("%c[Dashboard] Message has no 'type' field.", "color: orange;", data);
              return;
            }

            switch (data.type) {
              case "dashboard.update":
                setStats(data.data);
                break;
              case "update_activities":
                setRecentActivities(data.activities || []);
                break;
              case "update_notifications":
                setNotifications(data.notifications || []);
                break;
              case "update_events": {
                const formattedEvents = (data.events || []).map((ev: any) => ({
                  title: ev.title,
                  start: new Date(ev.start),
                  end: new Date(ev.end),
                }));
                setEventCalendar(formattedEvents);
                break;
              }
              default:
                console.warn("%c[Dashboard] Unknown message type:", "color: orange;", data.type);
            }
          } catch (parseError) {
            console.error("%c[Dashboard] Error parsing message:", "color: red;", parseError);
            setError("An error occurred while processing WebSocket messages.");
          }
        };

        // === onerror ===
        socket.onerror = (wsError) => {
          console.error("%c[Dashboard] WebSocket error:", "color: red;", wsError);
          setError("WebSocket connection failed. Please refresh.");
        };

        // === onclose ===
        socket.onclose = (event) => {
          console.warn("%c[Dashboard] WebSocket closed with code:", "color: orange;", event.code);

          if (!isConnectedRef.current) {
            console.error("%c[Dashboard] WebSocket never fully established!", "color: red;");
            setError("WebSocket disconnected unexpectedly before establishing a connection.");
          } else {
            console.log("%c[Dashboard] WebSocket closed gracefully.", "color: #f39c12;");
          }

          if (!reconnectInterval) {
            console.log("%c[Dashboard] Starting reconnect interval...", "color: #f1c40f;");
            reconnectInterval = setInterval(connectWebSocket, 5000);
          }
        };
      } catch (err) {
        console.error("%c[Dashboard] WebSocket initialization failed:", "color: red;", err);
        setError("Failed to initialize WebSocket connection.");
      }
    };

    // Initial WebSocket connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      console.log("%c[Dashboard] Cleaning up WebSocket connection...", "color: #2f8de4;");
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        console.log("%c[Dashboard] Closing WebSocket...", "color: #2f8de4;");
        socketRef.current.close();
      }
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, []);

  // Debug effect: logs state whenever it changes
  useEffect(() => {
    console.log("%c[Dashboard] Current stats:", "color: #27ae60;", stats);
    console.log("%c[Dashboard] Current recent activities:", "color: #27ae60;", recentActivities);
    console.log("%c[Dashboard] Current notifications:", "color: #27ae60;", notifications);
    console.log("%c[Dashboard] Current event calendar:", "color: #27ae60;", eventCalendar);
  }, [stats, recentActivities, notifications, eventCalendar]);

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
          <input
            type="text"
            placeholder="Search..."
            className="w-64 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 shadow"
          />
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105">
            <Link to={"/register"}>Register</Link>
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105">
            <Link to={"/login"}>Login</Link>
          </button>
        </div>
      </header>

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