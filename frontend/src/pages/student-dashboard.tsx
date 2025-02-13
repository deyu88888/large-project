import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";
import {
  FaCalendarAlt,
  FaBell,
  FaUsers,
  FaUserPlus,
  FaCogs,
} from "react-icons/fa";
import axios from "axios";
import { apiClient } from "../api";
import { useAuthStore } from "../stores/auth-store";

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const { sidebarWidth } = useSidebar();

  // States for societies, events, and notifications
  const [societies, setSocieties] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<any[]>([]);
  const { user } = useAuthStore();

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  }

  // Fetch data from the updated endpoints
  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log("is_president is type:", typeof user?.is_president); 
      console.log("value:", user?.is_president);
      
      // Fetch societies
      const societiesResponse = await apiClient.get("/api/student-societies/");
      console.log(societiesResponse.data);
      setSocieties(societiesResponse.data || []);

      // Check if the student is president of any society
      const presidentSocieties = societiesResponse.data.filter(
        (society: any) => society.is_president
      );
      setIsPresident(presidentSocieties.length > 0);

      // Fetch events
      const eventsResponse = await apiClient.get("/api/events/rsvp");
      console.log(eventsResponse.data);
      setEvents(eventsResponse.data || []);

      // Fetch notifications
      const notificationsResponse = await apiClient.get("/api/notifications");
      setNotifications(notificationsResponse.data || []);

      // Fetch awards
      try {
        const response = await apiClient.get("/api/award-students/");
        console.log("Award assignments:", response.data);
        setAwards(response.data || []);
      } catch (error) {
        console.error("Error fetching award assignments:", error);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Join a society
  const joinSociety = async (societyId: number) => {
    try {
      await apiClient.post(`/api/join-society/${societyId}/`);
      fetchData(); // Refresh the data after joining a society
    } catch (error) {
      console.error("Error joining society:", error);
    }
  };

  // Leave a society
  const leaveSociety = async (societyId: number) => {
    try {
      await apiClient.delete(`/api/leave-society/${societyId}/`); // Ensure societyId is in the URL
      fetchData(); // Refresh societies after leaving
    } catch (error) {
      console.error("Error leaving society:", error.response?.data || error);
    }
  };

  // RSVP for an event
  const rsvpEvent = async (eventId: number) => {
    try {
      await apiClient.post(`/api/events/rsvp/`, { event_id: eventId });
      fetchData(); // Refresh the events after RSVP
    } catch (error) {
      console.error("Error RSVPing for event:", error);
    }
  };

  // Cancel RSVP for an event
  const cancelRSVP = async (eventId: number) => {
    try {
      await apiClient.delete("/api/events/rsvp/", {
        data: { event_id: eventId },
      });
      fetchData();
    } catch (error) {
      console.error("Error canceling RSVP:", error);
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = async (id: number) => {
    try {
      const response = await apiClient.patch(`/api/notifications/${id}/`, { is_read: true });
      
      if (response.status === 200) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error("Error marking notification as read:", error.response?.data || error);
    }
  };

  return (
    <div
      style={{
        marginLeft: `${sidebarWidth}px`,
        marginTop: "64px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "20px 40px",
        background: `${colours.primary[400]} !important`, //this is what determines light and dark mode colours
        border: "none",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {loading ? (
          <div className="text-center">
            <h1
              style={{ color: `${colours.grey[100]} !important` }}
              className="text-2xl font-bold"
            >
              Loading your dashboard...
            </h1>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Header */}
            <header className="text-center mb-16">
              <h1
                className="text-5xl font-extrabold mb-4"
                style={{ color: `${colours.grey[100]} !important` }}
              >
                Welcome to Your Dashboard
              </h1>
              <p
                className="text-lg"
                style={{ color: `${colours.grey[300]} !important` }}
              >
                Stay updated with your societies, events, and achievements.
              </p>
            </header>

            {/* Society Management */}
            <section className="mb-16">
              <div className="flex justify-between items-center mb-6">
                <h2
                  className="text-3xl font-bold flex items-center"
                  style={{ color: `${colours.grey[100]} !important` }}
                >
                  <FaUsers
                    className="mr-3"
                    style={{ color: colours.greenAccent[500] }}
                  />
                  My Societies
                </h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => navigate("/student/join-society")}
                    className="font-medium transition-all hover:underline"
                    style={{ color: colours.blueAccent[500] }}
                  >
                    Join a Society
                  </button>
                  <button
                    onClick={() => navigate("/student/my-societies")}
                    className="font-medium transition-all hover:underline"
                    style={{ color: colours.blueAccent[500] }}
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {societies.slice(0, 3).map((society) => (
                  <div
                    key={society.id}
                    className="p-6 rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1"
                    style={{
                      backgroundColor: `${colours.grey[400]} !important`,
                      border: `1px solid ${`${colours.grey[700]} !important`}`,
                    }}
                  >
                    <h3
                      className="text-xl font-semibold mb-4"
                      style={{ color: `${colours.grey[100]} !important` }}
                    >
                      {society.name}
                    </h3>
                    <button
                      onClick={() => leaveSociety(society.id)}
                      className="w-full px-6 py-2 rounded-lg transition-all font-medium"
                      style={{
                        backgroundColor: colours.redAccent[500],
                        color: colours.grey[100],
                      }}
                    >
                      Leave Society
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Event Management */}
            <section className="mb-16">
              <div className="flex justify-between items-center mb-6">
                <h2
                  className="text-3xl font-bold flex items-center"
                  style={{ color: `${colours.grey[100]} !important` }}
                >
                  <FaCalendarAlt
                    className="mr-3"
                    style={{ color: colours.blueAccent[500] }}
                  />
                  Upcoming Events
                </h2>
                <button
                  onClick={() => navigate("/student/view-events")}
                  className="font-medium transition-all hover:underline"
                  style={{ color: colours.blueAccent[500] }}
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="p-6 rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1"
                    style={{
                      backgroundColor: `${colours.grey[400]} !important`,
                      border: `${colours.grey[700]} !important`,
                    }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3
                        className="text-xl font-semibold"
                        style={{ color: `${colours.grey[100]} !important` }}
                      >
                        {event.title}
                      </h3>
                      <span
                        className="text-sm italic"
                        style={{ color: `${colours.grey[300]} !important` }}
                      >
                        {event.date}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        event.rsvp ? cancelRSVP(event.id) : rsvpEvent(event.id)
                      }
                      className="w-full px-6 py-2 rounded-lg transition-all font-medium"
                      style={{
                        backgroundColor: event.rsvp
                          ? `${colours.grey[600]} !important`
                          : colours.blueAccent[500],
                        color: colours.grey[100],
                      }}
                    >
                      {event.rsvp ? "Cancel RSVP" : "RSVP Now"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Notifications */}
            <section className="mb-20">
              <div className="flex justify-between items-center mb-6">
                <h2
                  className="text-3xl font-bold flex items-center"
                  style={{ color: `${colours.grey[100]} !important` }}
                >
                  <FaBell
                    className="mr-3"
                    style={{ color: colours.redAccent[500] }}
                  />
                  Notifications
                </h2>
                <button
                  onClick={() => navigate("/student/view-notifications")}
                  className="font-medium transition-all hover:underline"
                  style={{ color: colours.blueAccent[500] }}
                >
                  View All
                </button>
              </div>

              {notifications.length === 0 ? (
                <p
                  className="text-center"
                  style={{ color: `${colours.grey[300]} !important` }}
                >
                  No new notifications.
                </p>
              ) : (
                <div className="space-y-6">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-5 rounded-lg shadow-md transition-all"
                      style={{
                        backgroundColor: notification.is_read
                          ? `${colours.primary[400]} !important`
                          : `${colours.blueAccent[700]} !important`,
                        border: `1px solid ${`${colours.grey[400]} !important`}`,
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <p style={{ color: `${colours.grey[100]} !important` }}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4">
                          {notification.is_read ? (
                            <span
                              className="text-sm font-medium"
                              style={{ color: colours.greenAccent[500] }}
                            >
                              Read
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                markNotificationAsRead(notification.id)
                              }
                              className="text-sm font-medium transition-all hover:underline"
                              style={{ color: colours.blueAccent[300] }}
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Calendar Integration */}
            <section className="mb-20">
              <div className="flex items-center mb-6">
                <FaCalendarAlt
                  className="mr-3"
                  style={{
                    color: colours.greenAccent[500],
                    fontSize: "1.5rem",
                  }}
                />
                <h2
                  className="text-3xl font-bold"
                  style={{ color: `${colours.grey[100]} !important` }}
                >
                  Calendar
                </h2>
              </div>
              <div
                className="p-8 rounded-lg shadow-md border"
                style={{
                  backgroundColor: `${colours.primary[400]} !important`,
                  borderColor: `${colours.grey[700]} !important`,
                }}
              >
                <p
                  className="text-center text-lg"
                  style={{ color: `${colours.grey[300]} !important` }}
                >
                  Coming Soon!
                </p>
              </div>
            </section>

            {/* Start a Society */}
            <section className="mb-20">
              <div className="flex items-center mb-6">
                <FaUserPlus
                  className="mr-3"
                  style={{ color: colours.blueAccent[500], fontSize: "1.5rem" }}
                />
                <h2
                  className="text-3xl font-bold"
                  style={{ color: `${colours.grey[100]} !important` }}
                >
                  Start a Society
                </h2>
              </div>
              <p
                className="mb-4"
                style={{ color: `${colours.grey[300]} !important` }}
              >
                Have an idea for a new society? Share your passion and bring
                others together!
              </p>
              <button
                onClick={() => navigate("/student/start-society")}
                className="px-6 py-3 rounded-lg transition-all font-medium"
                style={{
                  backgroundColor: colours.blueAccent[500],
                  color: colours.grey[100],
                }}
              >
                Start a Society
              </button>
            </section>

            {/* Achievements */}
            <section>
              <h2
                className="text-3xl font-bold mb-6"
                style={{ color: `${colours.grey[100]} !important` }}
              >
                Achievements
              </h2>
              <div
                className="p-8 rounded-lg shadow-md border"
                style={{
                  backgroundColor: `${colours.primary[400]} !important`,
                  borderColor: `${colours.grey[700]} !important`,
                }}
              >
                <p
                  className="text-center text-lg"
                  style={{ color: `${colours.grey[300]} !important` }}
                >
                  Coming Soon!
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
