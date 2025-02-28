import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api";
import { LoadingView } from "../components/loading/loading-view";

// Define the interface for an Event
interface Event {
  id: number;
  title: string;
  date: string;
  start_time: string;
  status: string;
  // Add other fields if needed
}

const ManageSocietyEvents: React.FC = () => {
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();

  // Local state for events, filter, loading status, and error message.
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "previous" | "pending">("upcoming");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch events whenever society_id or filter changes.
  useEffect(() => {
    if (!society_id) return;
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/api/events/", {
          params: {
            society_id, 
            filter, // "upcoming", "previous", or "pending"
          },
        });
        setEvents(response.data || []);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [society_id, filter]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Page Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Society Events</h1>
        <p className="text-gray-600">
          {filter.charAt(0).toUpperCase() + filter.slice(1)} events for Society {society_id}
        </p>
      </header>

      {/* Action Buttons */}
      <div className="flex flex-col items-center space-y-6 mb-8">
        <button
          onClick={() => navigate(`/president-page/${society_id}/create-society-event/`)}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
        >
          Create a New Event
        </button>
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded ${
              filter === "upcoming" ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-800"
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setFilter("previous")}
            className={`px-4 py-2 rounded ${
              filter === "previous" ? "bg-green-600 text-white" : "bg-green-200 text-green-800"
            }`}
          >
            Previous Events
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded ${
              filter === "pending" ? "bg-yellow-600 text-white" : "bg-yellow-200 text-yellow-800"
            }`}
          >
            Pending Approval
          </button>
        </div>
      </div>

      {/* Events Display */}
      {loading ? (
        <LoadingView />
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-700">
          No events found for "{filter}".
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p>Date: {event.date}</p>
              <p>Start Time: {event.start_time}</p>
              <p>Status: {event.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageSocietyEvents;
