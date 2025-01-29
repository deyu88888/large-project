import React, { useEffect, useState, useRef } from "react";
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [eventCalendar, setEventCalendar] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const isConnectedRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      const wsURL =
        process.env.NODE_ENV === "production"
          ? "wss://your-production-domain.com/ws/dashboard/"
          : "ws://127.0.0.1:8000/ws/dashboard/";

      try {
        const socket = new WebSocket(wsURL);
        socketRef.current = socket;

        socket.onopen = () => {
          isConnectedRef.current = true;
          setError(null);
          setLoading(false);
          if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
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
                break;
            }
          } catch {
            setError("An error occurred while processing WebSocket messages.");
          }
        };

        socket.onerror = () => {
          setError("WebSocket connection failed. Please refresh.");
        };

        socket.onclose = () => {
          if (!isConnectedRef.current) {
            setError("WebSocket disconnected unexpectedly before establishing a connection.");
          }
          if (!reconnectInterval) {
            reconnectInterval = setInterval(connectWebSocket, 5000);
          }
        };
      } catch {
        setError("Failed to initialize WebSocket connection.");
      }
    };

    connectWebSocket();

    return () => {
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        socketRef.current.close();
      }
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, []);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6 space-y-10">
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

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-lg animate-pulse">
          <strong>Error:</strong> {error}
        </div>
      )}

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

      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
          <span role="img" aria-label="calendar">
            📅
          </span>
          Event Calendar
        </h2>
        <EventCalendar events={eventCalendar} />
      </div>

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