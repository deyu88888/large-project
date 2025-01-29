import React, { useEffect, useState, useRef } from "react";
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
console.log("=== React app is running! ===");

const Dashboard: React.FC = () => {
  // Dashboard states
  const [stats, setStats] = useState({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [eventCalendar, setEventCalendar] = useState<any[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Persistent connection status
  const isConnectedRef = useRef(false); // Tracks if socket has connected at least once
  const socketRef = useRef<WebSocket | null>(null); // Reference to the WebSocket object

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
        // Create the WebSocket
        const socket = new WebSocket(wsURL);
        socketRef.current = socket;

        // === onopen ===
        socket.onopen = () => {
          console.log(
            "%c[Dashboard] WebSocket connected successfully!",
            "color: green; font-weight: bold;"
          );
          isConnectedRef.current = true;
          setError(null); // Clear any existing error
          setLoading(false); // Stop loading

          if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
            console.log(
              "%c[Dashboard] Reconnection successful. Clearing reconnect interval.",
              "color: #27ae60;"
            );
          }
        };

        // === onmessage ===
        socket.onmessage = (event) => {
          console.log(
            "%c[Dashboard] Raw WebSocket message received:",
            "color: #8e44ad;",
            event.data
          );

          try {
            const data = JSON.parse(event.data);
            console.log("%c[Dashboard] Parsed WebSocket message:", "color: #8e44ad;", data);

            if (!data.type) {
              console.warn("%c[Dashboard] Message has no 'type' field.", "color: orange;", data);
              return;
            }

            switch (data.type) {
              case "dashboard.update":
                console.log(
                  "%c[Dashboard] Updating stats with:",
                  "color: #2980b9;",
                  data.data
                );
                setStats((prevStats) => {
                  console.log(
                    "%c[Dashboard] Previous stats:",
                    "color: #2980b9;",
                    prevStats
                  );
                  console.log(
                    "%c[Dashboard] New stats:",
                    "color: #2980b9;",
                    data.data
                  );
                  return data.data;
                });
                break;

              case "update_activities":
                console.log(
                  "%c[Dashboard] Updating recent activities:",
                  "color: #2980b9;",
                  data.activities
                );
                setRecentActivities(data.activities || []);
                break;

              case "update_notifications":
                console.log(
                  "%c[Dashboard] Updating notifications:",
                  "color: #2980b9;",
                  data.notifications
                );
                setNotifications(data.notifications || []);
                break;

              case "update_events":
                console.log(
                  "%c[Dashboard] Updating event calendar:",
                  "color: #2980b9;",
                  data.events
                );
                const formattedEvents = (data.events || []).map((ev: any) => ({
                  title: ev.title,
                  start: new Date(ev.start),
                  end: new Date(ev.end),
                }));
                setEventCalendar(formattedEvents);
                break;

              default:
                console.warn(
                  "%c[Dashboard] Unknown message type:",
                  "color: orange;",
                  data.type
                );
            }
          } catch (parseError) {
            console.error(
              "%c[Dashboard] Error parsing message:",
              "color: red;",
              parseError
            );
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

          // Start reconnecting
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

    // Cleanup on unmount or re-render
    return () => {
      console.log("%c[Dashboard] Cleaning up WebSocket connection...", "color: #2f8de4;");
      // Only close if socket is still OPEN or CONNECTING
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        console.log("%c[Dashboard] Closing WebSocket...", "color: #2f8de4;");
        socketRef.current.close();
      }
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, []);

  // Debug effect: log current state whenever it changes
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold">Student Society Dashboard</h1>
        <div className="flex flex-row gap-2">
          <input
            type="text"
            placeholder="Search societies or events..."
            className="p-2 rounded border border-gray-300 w-60"
          />
          <button className="btn btn-secondary">
            <Link to={"/register"}>Register</Link>
          </button>
          <button className="btn btn-primary">
            <Link to={"/login"}>Login</Link>
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow"
          role="alert"
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-100 shadow p-6 rounded text-center">
          <p className="text-gray-500">Total Societies</p>
          <p className="text-3xl font-bold">{stats.totalSocieties}</p>
        </div>
        <div className="bg-green-100 shadow p-6 rounded text-center">
          <p className="text-gray-500">Total Events</p>
          <p className="text-3xl font-bold">{stats.totalEvents}</p>
        </div>
        <div className="bg-yellow-100 shadow p-6 rounded text-center">
          <p className="text-gray-500">Pending Approvals</p>
          <p className="text-3xl font-bold">{stats.pendingApprovals}</p>
        </div>
        <div className="bg-purple-100 shadow p-6 rounded text-center">
          <p className="text-gray-500">Active Members</p>
          <p className="text-3xl font-bold">{stats.activeMembers}</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-lg font-bold mb-4">Recent Activities</h2>
        {recentActivities.length > 0 ? (
          <ul className="list-disc pl-5">
            {recentActivities.map((activity, idx) => (
              <li key={idx}>{activity.description}</li>
            ))}
          </ul>
        ) : (
          <p>No recent activities found.</p>
        )}
      </div>

      {/* Event Calendar */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-lg font-bold mb-4">Event Calendar</h2>
        <EventCalendar events={eventCalendar} />
      </div>

      {/* Notifications */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-lg font-bold mb-4">Notifications</h2>
        {notifications.length > 0 ? (
          <ul className="list-disc pl-5">
            {notifications.map((notification, idx) => (
              <li key={idx}>{notification.message}</li>
            ))}
          </ul>
        ) : (
          <p>No notifications found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
