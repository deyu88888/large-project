import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useTheme,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { FaCalendarAlt, FaRegClock, FaMapMarkerAlt } from "react-icons/fa";
import { EventData } from "../../types/student/event";

// interface EventData {
//   id: number;
//   title: string;
//   description?: string;
//   date: string;
//   start_time: string;
//   duration: string;
//   location?: string;
//   hosted_by: number;
//   societyName?: string;
//   rsvp?: boolean;
//   status: string;
// }

const ViewSocietyEvents: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const { society_id, event_type } = useParams();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [societyName, setSocietyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [society_id, event_type]);

  const fetchEvents = async () => {
    if (!society_id) {
      setError("Society ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // First fetch society info to get the name
      try {
        const societyResponse = await apiClient.get(`/api/societies/${society_id}`);
        if (societyResponse.data && societyResponse.data.name) {
          setSocietyName(societyResponse.data.name);
        }
      } catch (error) {
        console.error("Error fetching society info:", error);
        // Continue anyway as this is not critical
      }
      
      // Main events request
      let endpoint = `/api/events?society_id=${society_id}`;

      // Apply filtering based on event_type
      if (event_type === "upcoming-events") {
        endpoint += "&filter=upcoming";
      } else if (event_type === "previous-events") {
        endpoint += "&filter=previous";
      } else if (event_type === "pending-events") {
        endpoint += "&filter=pending";
      }

      const response = await apiClient.get(endpoint);
      
      // If we got data back but it's empty
      if (response.data && Array.isArray(response.data) && response.data.length === 0) {
        setEvents([]);
      } 
      // If we got actual event data
      else if (response.data && Array.isArray(response.data)) {
        setEvents(response.data);
      } 
      // Fallback to the getAllEvents approach used in the dashboard
      else {
        const allEventsResponse = await apiClient.get("/api/events/");
        if (allEventsResponse.data) {
          const filteredEvents = allEventsResponse.data.filter((event: EventData) => 
            event.hosted_by === parseInt(society_id) &&
            (
              (event_type === "pending-events" && event.status === "Pending") ||
              (event_type === "upcoming-events" && event.status === "Approved" && isUpcoming(event.date)) ||
              (event_type === "previous-events" && event.status === "Approved" && !isUpcoming(event.date)) ||
              (!event_type)
            )
          );
          setEvents(filteredEvents);
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (dateStr: string): boolean => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const handleRSVP = async (eventId: number, isAttending: boolean) => {
    try {
      if (isAttending) {
        await apiClient.post("/api/events/rsvp", { event_id: eventId });
      } else {
        await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
      }
      
      // Refresh events after RSVP change
      fetchEvents();
    } catch (error) {
      console.error("Error updating RSVP:", error);
    }
  };

  const getPageTitle = () => {
    let title = "";
    if (event_type === "upcoming-events") title = "Upcoming Events";
    else if (event_type === "previous-events") title = "Previous Events";
    else if (event_type === "pending-events") title = "Pending Approval Events";
    else title = "All Events";
    
    if (societyName) {
      return `${societyName} - ${title}`;
    }
    return title;
  };

  return (
    <Box minHeight="100vh" bgcolor={colours.primary[500]} py={8}>
      <Box maxWidth="1920px" mx="auto" px={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" sx={{ color: colours.grey[100] }}>
            {getPageTitle()}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: colours.blueAccent[500],
              color: colours.grey[100],
            }}
          >
            Back
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress size={48} style={{ color: colours.grey[100] }} />
          </Box>
        ) : error ? (
          <Paper
            elevation={3}
            sx={{
              backgroundColor: colours.primary[400],
              border: `1px solid ${colours.grey[800]}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: colours.redAccent[500], textAlign: "center" }}>
              {error}
            </Typography>
          </Paper>
        ) : events.length === 0 ? (
          <Paper
            elevation={3}
            sx={{
              backgroundColor: colours.primary[400],
              border: `1px solid ${colours.grey[800]}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: colours.grey[300], textAlign: "center" }}>
              No events found.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} md={6} lg={4} key={event.id}>
                <Paper
                  elevation={2}
                  sx={{
                    backgroundColor: colours.primary[400],
                    border: `1px solid ${colours.grey[800]}`,
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box flex="1">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ color: colours.grey[100] }}>
                        {event.title}
                      </Typography>
                      <Box
                        px={1}
                        py={0.5}
                        borderRadius="4px"
                        bgcolor={
                          event.status === "Approved"
                            ? colours.greenAccent[500]
                            : event.status === "Pending"
                            ? colours.orangeAccent[500] || colours.yellowAccent[500]
                            : colours.redAccent[500]
                        }
                        color={colours.primary[500]}
                      >
                        <Typography variant="caption">{event.status}</Typography>
                      </Box>
                    </Box>
                    
                    {event.description && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: colours.grey[300], 
                          mb: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {event.description}
                      </Typography>
                    )}
                    
                    <Box display="flex" alignItems="center" mt={1}>
                      <FaRegClock style={{ marginRight: 8, color: colours.grey[300] }} />
                      <Typography variant="body2" sx={{ color: colours.grey[300] }}>
                        {event.date} {event.start_time && `at ${event.start_time}`}
                        {event.duration && ` (${event.duration})`}
                      </Typography>
                    </Box>
                    
                    {event.location && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <FaMapMarkerAlt style={{ marginRight: 8, color: colours.grey[300] }} />
                        <Typography variant="body2" sx={{ color: colours.grey[300] }}>
                          {event.location}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {event.status === "Approved" && event.rsvp !== undefined && isUpcoming(event.date) && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleRSVP(event.id, !event.rsvp)}
                      sx={{
                        mt: 2,
                        backgroundColor: event.rsvp
                          ? colours.grey[700]
                          : colours.blueAccent[500],
                        color: colours.grey[100],
                      }}
                    >
                      {event.rsvp ? "Cancel RSVP" : "RSVP Now"}
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ViewSocietyEvents;