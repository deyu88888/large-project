import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api"; // Ensure apiClient is correctly imported

const ViewNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications when the component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/notifications");
      console.log("Fetched Notifications:", response.data); // Debugging log
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">All Notifications</h1>
        <p className="text-lg text-gray-600 mt-2">
          Stay informed about the latest updates and announcements.
        </p>
      </header>

      {loading ? (
        <p className="text-center text-gray-600">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-600">No new notifications.</p>
      ) : (
        <div className="space-y-6">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-5 rounded-lg shadow-md hover:shadow-lg border transition-all ${
                notification.is_read ? "bg-gray-100 border-gray-300" : "bg-blue-50 border-blue-100"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="text-gray-800">{notification.message}</p>
                <div className="flex items-center space-x-4">
                  {notification.is_read ? (
                    <span className="text-green-500 text-sm font-medium">Read</span>
                  ) : (
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="text-sm text-blue-500 hover:underline"
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

      <div className="mt-10 text-center">
        <button
          onClick={() => navigate("/student-dashboard")}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ViewNotifications;
