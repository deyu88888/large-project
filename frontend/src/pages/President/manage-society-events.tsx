import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";
import { LoadingView } from "../../components/loading/loading-view";

interface Event {
  id: number;
  title: string;
  date: string;
  start_time: string;
  status: string;
}

const ManageSocietyEvents: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();

  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "previous" | "pending">("upcoming");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!society_id) return;
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/api/events/", {
          params: { society_id, filter },
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
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#ffffff",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
      }}
    >
      {/* Page Header */}
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
          }}
        >
          Manage Society Events
        </Typography>
        <Typography variant="h6" color={colors.grey[500]}>
          {filter.charAt(0).toUpperCase() + filter.slice(1)} events for Society {society_id}
        </Typography>
      </Box>

      {/* Create Event Button */}
      <Box display="flex" justifyContent="center" mb={3}>
        <Button
          onClick={() => navigate(`/president-page/${society_id}/create-society-event/`)}
          sx={{
            backgroundColor: colors.blueAccent[500],
            color: theme.palette.mode === "dark" ? "#141b2d" : "#ffffff",
            fontSize: "1rem",
            fontWeight: "bold",
            padding: "12px 20px",
            borderRadius: "8px",
            "&:hover": { backgroundColor: colors.blueAccent[600] },
          }}
        >
          Create a New Event
        </Button>
      </Box>

      {/* Filter Toggle */}
      <Box display="flex" justifyContent="center" mb={4}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, newFilter) => newFilter && setFilter(newFilter)}
          sx={{
            backgroundColor: colors.primary[500],
            borderRadius: "8px",
          }}
        >
          {[
            { label: "Upcoming", value: "upcoming", color: colors.blueAccent[500] },
            { label: "Previous", value: "previous", color: colors.greenAccent[500] },
            { label: "Pending Approval", value: "pending", color: colors.redAccent[500] },
          ].map(({ label, value, color }) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{
                backgroundColor: filter === value ? color : colors.grey[600],
                color: theme.palette.mode === "dark" ? "#ffffff" : "#141b2d",
                fontWeight: "bold",
                "&:hover": { backgroundColor: color, opacity: 0.8 },
                transition: "0.3s",
              }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Events Display */}
      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress color="secondary" />
        </Box>
      ) : error ? (
        <Typography color={colors.redAccent[500]} textAlign="center">
          {error}
        </Typography>
      ) : events.length === 0 ? (
        <Typography textAlign="center" color={colors.grey[500]}>
          No events found for "{filter}".
        </Typography>
      ) : (
        <Box maxWidth="800px" mx="auto">
          {events.map((event) => (
            <Paper
              key={event.id}
              elevation={3}
              sx={{
                p: 3,
                mb: 2,
                backgroundColor: colors.primary[500],
                color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
                transition: "0.3s",
                "&:hover": { backgroundColor: colors.primary[600] },
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {event.title}
              </Typography>
              <Typography>Date: {event.date}</Typography>
              <Typography>Start Time: {event.start_time}</Typography>
              <Typography>Status: {event.status}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ManageSocietyEvents;
