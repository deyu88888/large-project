import React, { useEffect, useState } from "react";
import {
  mockStats,
  mockRecentActivities,
  mockNotifications,
  mockSocietySpotlight,
  mockEventCalendar,
} from "./mockData";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [societySpotlight, setSocietySpotlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setStats(mockStats);
      setRecentActivities(mockRecentActivities);
      setNotifications(mockNotifications);
      setSocietySpotlight(mockSocietySpotlight);
      setLoading(false);
    }, 500); // Mock delay for data fetching
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
        <ul>
          {mockEventCalendar.map((event, idx) => (
            <li key={idx}>{`${event.date}: ${event.event}`}</li>
          ))}
        </ul>
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
