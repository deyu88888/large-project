import React from "react";
import { useNavigate } from "react-router-dom";

const mockEvents = [
  { id: 1, name: "Basketball Practice", date: "2024-04-01", location: "Gym Hall" },
  { id: 2, name: "Debate Competition", date: "2024-04-15", location: "Auditorium" },
  { id: 3, name: "Music Concert", date: "2024-05-01", location: "Music Hall" },
];

const ViewEvents: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">All Events</h1>
        <p className="text-lg text-gray-600 mt-2">Check out all upcoming events here!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockEvents.map((event) => (
          <div
            key={event.id}
            className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold text-gray-900">{event.name}</h2>
            <p className="text-gray-600">Date: {event.date}</p>
            <p className="text-gray-600">Location: {event.location}</p>
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

export default ViewEvents;
