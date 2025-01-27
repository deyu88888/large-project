import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaBell, FaUsers, FaUserPlus } from "react-icons/fa";

// Mock data for showcasing purposes
const mockSocieties = [
  { id: 1, name: "Basketball Society" },
  { id: 2, name: "Debate Society" },
  { id: 3, name: "Music Society" },
];

const mockEvents = [
  { id: 1, name: "Basketball Practice", date: "2024-04-01", rsvp: true },
  { id: 2, name: "Debate Competition", date: "2024-04-15", rsvp: false },
  { id: 3, name: "Guy's Bar", date: "2024-05-01", rsvp: false },
];

const mockNotifications = [
  { id: 1, text: "Chess Club meeting tomorrow!", read: false },
  { id: 2, text: "New event added to Debate Society", read: true },
];

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleViewAllSocieties = () => {
    navigate("/my-societies");
  };

  const handleViewAllEvents = () => {
    navigate("/view-events");
  };

  const handleViewAllNotifications = () => {
    navigate("/view-notifications");
  };

  const handleStartSociety = () => {
    navigate("/start-society");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      {/* Dashboard Title */}
      <header className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900">Welcome to Your Dashboard</h1>
        <p className="text-lg text-gray-600 mt-4">Stay updated with your societies, events, and achievements.</p>
      </header>

      {/* Society Management */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaUsers className="mr-3 text-green-500" />
            My Societies
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/join-society")}
              className="text-blue-500 hover:underline font-medium"
            >
              Join a Society
            </button>
            <button
              onClick={handleViewAllSocieties}
              className="text-blue-500 hover:underline font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockSocieties.slice(0, 3).map((society) => (
            <div
              key={society.id}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{society.name}</h3>
              <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all">
                Leave Society
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Event Management */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaCalendarAlt className="mr-3 text-blue-500" />
            Upcoming Events
          </h2>
          <button
            onClick={handleViewAllEvents}
            className="text-blue-500 hover:underline font-medium"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockEvents.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                <span className="text-sm text-gray-600 italic">{event.date}</span>
              </div>
              <button
                className={`w-full px-6 py-2 text-white rounded-lg ${
                  event.rsvp
                    ? "bg-gray-400 hover:bg-gray-500"
                    : "bg-blue-500 hover:bg-blue-600"
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaBell className="text-yellow-500 text-2xl mr-3" />
            Notifications
          </h2>
          <button
            onClick={handleViewAllNotifications}
            className="text-blue-500 hover:underline font-medium"
          >
            View All
          </button>
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

      {/* Start a Society Section */}
      <section className="mb-20">
        <div className="flex items-center mb-6">
          <FaUserPlus className="text-purple-500 text-2xl mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">Start a Society</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Have an idea for a new society? Share your passion and bring others together!
        </p>
        <button
          onClick={handleStartSociety}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-all"
        >
          Start a Society
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
