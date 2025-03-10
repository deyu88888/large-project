import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import {
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import { format } from "date-fns";
import { useAuthStore } from "../stores/auth-store";

interface Attendee {
  id: number;
  first_name: string;
  icon?: string | null;
}

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  current_attendees?: Attendee[];
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  following?: number[];
}

export default function AllEventsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      apiClient
        .get("/api/user/current")
        .then((res) => {
          setCurrentUser(res.data);
          setUser && setUser(res.data);
        })
        .catch((err) => console.error("Error fetching current user:", err));
    } else {
      setCurrentUser(user);
    }
  }, [user, setUser]);

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

  if (loading || !currentUser) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <Typography variant="h4" align="center" gutterBottom>
        All Events
      </Typography>

      {events.length === 0 && (
        <Typography variant="h6" align="center" color="textSecondary">
          No events available at the moment.
        </Typography>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {events.map((event) => {
          let followingsAttending: Attendee[] = [];
          if (currentUser.following && event.current_attendees) {
            followingsAttending = event.current_attendees.filter((attendee) =>
              currentUser.following!.includes(attendee.id)
            );
          }

          return (
            <Card
              key={event.id}
              style={{ padding: "20px", cursor: "pointer" }}
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <CardContent>
                <Typography variant="h6">{event.title}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Date: {format(new Date(event.date), "dd/MM/yyyy")}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Location: {event.location || "TBA"}
                </Typography>


                {followingsAttending.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <AvatarGroup max={4}>
                      {followingsAttending.map((att) => (
                        <Avatar
                          key={att.id}
                          src={att.icon || ""}
                          alt={att.first_name}
                          sx={{ width: 32, height: 32 }}
                        />
                      ))}
                    </AvatarGroup>
                    <Typography variant="body2" color="textSecondary">
                      {followingsAttending[0].first_name + " "}
                      {followingsAttending.length > 1 &&
                        ` and ${followingsAttending.length} more following `}
                      also attended this event
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
