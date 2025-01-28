import React, { useEffect, useState } from "react";
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
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

  useEffect(() => {
    // WebSocket setup
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/dashboard/");

    socket.onopen = () => {
      console.log("WebSocket connected!");
      setError(null); // Clear any previous errors
      setLoading(false); // Stop loading when connected
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);

      // Update the dashboard based on the message type
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
          const formattedEvents = (data.events || []).map((event: any) => ({
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
          }));
          setEventCalendar(formattedEvents);
          break;
        }
        default:
          console.warn("Unknown message type:", data.type);
          break;
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("A WebSocket error occurred. Please refresh the page or try again later.");
      setLoading(false); // Stop loading if there's an error
    };

    socket.onclose = (event) => {
      console.log("WebSocket closed with code:", event.code);
      if (event.code !== 1000) {
        setError("WebSocket connection lost. Please check your internet connection.");
      }
      setLoading(false); // Stop loading on close
    };

    // Cleanup on component unmount
    return () => {
      socket.close();
    };
  }, []);

  if (loading) return <LoadingView />;

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow" role="alert">
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
