import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { CircularProgress, Card, CardContent, Typography } from "@mui/material";
import { format } from "date-fns";

const AllEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/api/all-events");
        console.log("Fetched Events:", response.data);
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
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <Typography variant="h4" align="center" gutterBottom>
        All Events
      </Typography>

      {loading && <CircularProgress style={{ display: "block", margin: "20px auto" }} />}

      {!loading && events.length === 0 && (
        <Typography variant="h6" align="center" color="textSecondary">
          No events available at the moment.
        </Typography>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {events.map((event) => (
          <Card key={event.id} style={{ padding: "20px", cursor: "pointer" }} onClick={() => navigate(`/event/${event.id}`)}>
            <CardContent>
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                Date: {format(new Date(event.date), "dd/MM/yyyy")}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Location: {event.location || "TBA"}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllEventsPage;
