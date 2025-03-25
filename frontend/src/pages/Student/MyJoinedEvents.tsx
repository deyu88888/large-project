import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { CircularProgress } from "@mui/material";
import EventCard from "../../components/EventCard";

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  current_attendees?: any[];
}

const MyJoinedEvents: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get("/api/events/joined/");
        setEvents(response.data || []);
      } catch (error) {
        console.error("Error fetching joined events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleViewEvent = (eventId: number) => {
    navigate(`/student/event/${eventId}`);
  };

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: isLight ? "#fcfcfc" : colours.primary[500],
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              color: colours.grey[100],
              fontSize: "2.25rem",
              fontWeight: 700,
            }}
          >
            My Events
          </h1>
          <p style={{ color: colours.grey[300], fontSize: "1.125rem" }}>
            Events you've RSVP'd to
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <CircularProgress />
            <p style={{ color: colours.grey[300], marginTop: "1rem" }}>
              Loading events...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: colours.grey[300] }}>You haven’t joined any events yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                followingsAttending={[]}
                isLight={isLight}
                colors={colours}
                onViewEvent={handleViewEvent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJoinedEvents;
