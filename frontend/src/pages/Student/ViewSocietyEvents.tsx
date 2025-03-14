import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";

interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  status: string;
}

const ViewSocietyEvents: React.FC = () => {
  const { user } = useAuthStore();
  const { society_id, event_type } = useParams(); 
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchEvents();
  }, [event_type]); // Refetch when event type changes

  const fetchEvents = async () => {
    if (!society_id) return;

    setLoading(true);
    try {
      let endpoint = `/api/events?society_id=${society_id}`;

      if (event_type === "upcoming-events") {
        endpoint += "&filter=upcoming";
      } else if (event_type === "previous-events") {
        endpoint += "&filter=previous";
      } else if (event_type === "pending-events") {
        endpoint += "&filter=pending";
      }

      const response = await apiClient.get(endpoint);
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        {event_type === "upcoming-events" && "Upcoming Events"}
        {event_type === "previous-events" && "Previous Events"}
        {event_type === "pending-events" && "Pending Approval Events"}
      </h1>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="p-6 bg-white rounded-xl shadow border">
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="text-gray-600">{event.description}</p>
              <p className="text-sm text-gray-500">{event.date} - {event.start_time}</p>
              <span className={`px-3 py-1 rounded text-white ${event.status === "Approved" ? "bg-green-500" : event.status === "Pending" ? "bg-yellow-500" : "bg-red-500"}`}>
                {event.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewSocietyEvents;
