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
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/events/rsvp");
        setEvents(response.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

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
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
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

        {loading ? (
          <p
            style={{
              color: isLight ? colours.grey[700] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            Loading events...
          </p>
        ) : events.length === 0 ? (
          <p
            style={{
              color: isLight ? colours.grey[600] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            No upcoming events.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "2rem",
              padding: "1rem 0",
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  backgroundColor: isLight ? colours.primary[400] : colours.primary[400],
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  cursor: "pointer",
                }}
              >
                <h2
                  style={{
                    color: isLight ? colours.grey[100] : colours.grey[100],
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                  }}
                >
                  {event.title}
                </h2>
                <div style={{ marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      color: isLight ? colours.grey[300] : colours.grey[300],
                      fontSize: "0.875rem",
                    }}
                  >
                    Date: {event.date}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      color: isLight ? colours.grey[300] : colours.grey[300],
                      fontSize: "0.875rem",
                    }}
                  >
                    Location: {event.location || "TBA"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "2.5rem",
            padding: "2rem 0",
          }}
        >
          <button
            onClick={() => navigate("/student-dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
              color: isLight ? "#ffffff" : colours.grey[100],
              padding: "0.75rem 2rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEvents;
