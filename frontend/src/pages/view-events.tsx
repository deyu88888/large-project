import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../styles/theme";
// Removed: import { useSidebar } from "../components/layout/SidebarContext";

const ViewEvents: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

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
    <div
      style={{
        marginLeft: "0px", // Removed sidebarWidth dependency; set to "0px"
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "20px 40px",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        <header
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            padding: "2rem 0",
          }}
        >
          <h1
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "2.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            All Events
          </h1>
          <p
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "1.125rem",
              margin: 0,
            }}
          >
            Check out all upcoming events here!
          </p>
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
