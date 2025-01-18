import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [societySpotlight, setSocietySpotlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, activitiesResponse, notificationsResponse, spotlightResponse] = await Promise.all([
          axios.get("/api/dashboard/stats/"),
          axios.get("/api/dashboard/recent-activities/"),
          axios.get("/api/dashboard/notifications/"),
          axios.get("/api/dashboard/society-spotlight/"),
        ]);
        setStats(statsResponse.data);
        setRecentActivities(activitiesResponse.data);
        setNotifications(notificationsResponse.data);
        setSocietySpotlight(spotlightResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Society Dashboard</h1>
        <input
          type="text"
          placeholder="Search societies or events..."
          className="p-2 rounded border border-gray-300"
        />
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Total Societies</p>
          <p className="text-3xl font-bold">{stats?.total_societies || 0}</p>
        </div>
        <div className="bg-green-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Total Events</p>
          <p className="text-3xl font-bold">{stats?.total_events || 0}</p>
        </div>
        <div className="bg-yellow-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Pending Approvals</p>
          <p className="text-3xl font-bold">{stats?.pending_approvals || 0}</p>
        </div>
        <div className="bg-purple-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Active Members</p>
          <p className="text-3xl font-bold">{stats?.active_members || 0}</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent Activities</h2>
        <ul>
          {recentActivities.map((activity, idx) => (
            <li key={idx}>{activity.description}</li>
          ))}
        </ul>
      </div>

      {/* Society Spotlight */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Society Spotlight</h2>
        {societySpotlight ? (
          <div>
            <h3 className="text-xl font-bold">{societySpotlight.name}</h3>
            <p>{societySpotlight.description}</p>
            <p className="text-sm text-gray-500">Upcoming Event: {societySpotlight.upcoming_event}</p>
          </div>
        ) : (
          <p>No spotlight available.</p>
        )}
      </div>

      {/* Event Calendar */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Event Calendar</h2>
        <p>Calendar integration goes here...</p>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Notifications</h2>
        <ul>
          {notifications.map((notification, idx) => (
            <li key={idx}>{notification.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
