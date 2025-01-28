import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockNotifications = [
  { id: 1, text: "Chess Club meeting tomorrow!", read: false },
  { id: 2, text: "New event added to Debate Society", read: true },
  { id: 3, text: "Basketball match rescheduled", read: false },
  { id: 4, text: "Music Society's workshop is cancelled", read: true },
];

const ViewNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleMarkAsRead = (id: number) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">All Notifications</h1>
        <p className="text-lg text-gray-600 mt-2">
          Stay informed about the latest updates and announcements.
        </p>
      </header>

      <div className="space-y-6">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-5 rounded-lg shadow-md hover:shadow-lg border transition-all ${
              notification.read ? "bg-gray-100 border-gray-300" : "bg-blue-50 border-blue-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-800">{notification.text}</p>
              <div className="flex items-center space-x-4">
                {notification.read ? (
                  <span className="text-green-500 text-sm font-medium">Read</span>
                ) : (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
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

      <div className="mt-10 text-center">
        <button
          onClick={handleBackToDashboard}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ViewNotifications;
