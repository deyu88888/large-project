import React from "react";
import { FaCalendarAlt, FaBell, FaUserFriends } from "react-icons/fa";

// Mock data (would normally come from backend)
const mockSocieties = [
  { id: 1, name: "Chess Club" },
  { id: 2, name: "Debate Society" },
];

const mockEvents = [
  { id: 1, name: "Chess Tournament", date: "2024-04-01", rsvp: true },
  { id: 2, name: "Debate Competition", date: "2024-04-15", rsvp: false },
];

const mockNotifications = [
  { id: 1, text: "Chess Club meeting tomorrow!", read: false },
  { id: 2, text: "New event added to Debate Society", read: true },
];

const StudentDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      {/* Dashboard Title */}
      <header className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900">
          Welcome to Your Dashboard
        </h1>
        <p className="text-lg text-gray-600 mt-4">
          Stay updated with your societies, events, and achievements.
        </p>
      </header>

      {/* Society Management */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          My Societies
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockSocieties.map((society) => (
            <div
              key={society.id}
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {society.name}
              </h3>
              <button className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-all">
                Leave Society
              </button>
            </div>
          ))}
          <div className="flex items-center justify-center bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-md border-dashed border border-gray-300 hover:shadow-lg hover:border-green-400 transition-all">
            <button className="text-green-600 font-semibold px-6 py-4 hover:text-green-700">
              + Join New Society
            </button>
          </div>
        </div>
      </section>

      {/* Event Management */}
      <section className="mb-20">
        <div className="flex items-center mb-6">
          <FaCalendarAlt className="text-blue-500 text-2xl mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">Upcoming Events</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockEvents.map((event) => (
            <div
              key={event.id}
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {event.name}
                </h3>
                <span className="text-sm text-gray-500 italic">
                  {event.date}
                </span>
              </div>
              <button
                className={`w-full px-4 py-2 rounded-md font-semibold ${
                  event.rsvp
                    ? "bg-gray-400 hover:bg-gray-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } transition-all`}
              >
                {event.rsvp ? "Cancel RSVP" : "RSVP Now"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-20">
        <div className="flex items-center mb-6">
          <FaBell className="text-yellow-500 text-2xl mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">Notifications</h2>
        </div>
        <div className="space-y-6">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-5 rounded-lg shadow-md hover:shadow-lg border transition-all ${
                notification.read
                  ? "bg-gray-100 border-gray-300"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="text-gray-800">{notification.text}</p>
                <button className="text-sm text-blue-500 hover:underline">
                  Mark as Read
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar Integration */}
      <section className="mb-20">
        <div className="flex items-center mb-6">
          <FaCalendarAlt className="text-teal-500 text-2xl mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">Calendar</h2>
        </div>
        <div className="flex items-center justify-center p-8 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-500 text-lg">Calendar Integration Placeholder</p>
        </div>
      </section>

      {/* Admin Requests */}
      <section className="mb-20">
        <div className="flex items-center mb-6">
          <FaUserFriends className="text-purple-500 text-2xl mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">Admin Requests</h2>
        </div>
        <button className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-all">
          Request to Become Society President
        </button>
      </section>

      {/* Achievements Section */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Achievements</h2>
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg shadow-md border border-gray-200">
          <p className="text-gray-500 text-lg">Coming Soon!</p>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
