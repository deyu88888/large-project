import React, { useEffect, useState } from "react";
import axios from "axios"; // Import axios for API calls
import EventCalendar from "../components/EventCalendar";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [eventCalendar, setEventCalendar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const accessToken = "<your-access-token>"; // Replace this with your access token

        // Fetch dashboard statistics
        const statsResponse = await axios.get("/api/dashboard/stats/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setStats(statsResponse.data);

        // Fetch recent activities
        const activitiesResponse = await axios.get("/api/dashboard/activities/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setRecentActivities(Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);

        // Fetch notifications
        const notificationsResponse = await axios.get("/api/dashboard/notifications/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setNotifications(Array.isArray(notificationsResponse.data) ? notificationsResponse.data : []);

        // Fetch events for the calendar
        const eventsResponse = await axios.get("/api/dashboard/events/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const formattedEvents = Array.isArray(eventsResponse.data)
          ? eventsResponse.data.map((event: any) => ({
              title: event.title,
              start: new Date(event.start),
              end: new Date(event.end),
            }))
          : [];
        setEventCalendar(formattedEvents);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingView />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex justify-end items-center">
        <h1 className="text-2xl font-bold mr-auto">Student Society Dashboard</h1>
        <div className="flex flex-row gap-2">
          <input
            type="text"
            placeholder="Search societies or events..."
            className="p-2 rounded border border-gray-300"
          />
          <button className={"btn btn-secondary"}>
            <Link to={"/register"}>Register</Link>
          </button>
          <button className={"btn btn-primary"}>
            <Link to={"/login"}>Login</Link>
          </button>
        </div>
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
        {recentActivities.length > 0 ? (
          <ul>
            {recentActivities.map((activity, idx) => (
              <li key={idx}>{activity.description}</li>
            ))}
          </ul>
        ) : (
          <p>No recent activities found.</p>
        )}
      </div>

      {/* Society Spotlight */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Society Spotlight</h2>
        {stats?.spotlight_society ? (
          <div>
            <h3 className="text-xl font-bold">{stats.spotlight_society.name}</h3>
            <p>{stats.spotlight_society.description}</p>
            <p className="text-sm text-gray-500">
              Upcoming Event: {stats.spotlight_society.upcoming_event}
            </p>
          </div>
        ) : (
          <p>No spotlight available.</p>
        )}
      </div>

      {/* Event Calendar */}
      <EventCalendar events={eventCalendar.length > 0 ? eventCalendar : []} />

      {/* Notifications */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Notifications</h2>
        {notifications.length > 0 ? (
          <ul>
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