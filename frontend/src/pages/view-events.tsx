import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api"; // Import API client

const ViewEvents: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/events/rsvp"); // Fetch real event data
      console.log("Fetched events:", response.data); // Debugging: See the API response
      setEvents(response.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">All Events</h1>
        <p className="text-lg text-gray-600 mt-2">Check out all upcoming events here!</p>
      </header>

      {/* Show Loading State */}
      {loading ? (
        <p className="text-center text-gray-600">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-center text-gray-600">No upcoming events.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
              <p className="text-gray-600">Date: {event.date}</p>
              <p className="text-gray-600">Location: {event.location || "TBA"}</p>
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

export default ViewEvents;
