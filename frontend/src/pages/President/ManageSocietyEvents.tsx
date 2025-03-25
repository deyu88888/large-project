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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";

interface Event {
  id: number;
  title: string;
  date: string;
  start_time: string;
  status: string;
  hosted_by: number;
  main_description: string;
  location: string;
  duration: string;
  max_capacity: number;
  current_attendees: number[];
}
type FilterType = "upcoming" | "previous" | "pending" | "rejected";

interface FilterOption {
  label: string;
  value: FilterType;
  color: string;
}

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const ManageSocietyEvents: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { societyId, filter: filterParam } = useParams<{ societyId: string; filter?: string }>();
  const society_id = societyId;

  const isFilterType = (value: any): value is FilterType => {
    return ["upcoming", "previous", "pending", "rejected"].includes(value);
  };

  const [filter, setFilter] = useState<FilterType>(
    isFilterType(filterParam) ? filterParam : "upcoming"
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const numericSocietyId = society_id ? parseInt(society_id, 10) : null;

  useEffect(() => {
    if (!society_id) return;
    if (filter !== filterParam) {
      navigate(`/president-page/${society_id}/manage-society-events/${filter}`, { replace: true });
    }
  }, [filter, filterParam, society_id, navigate]);

  useEffect(() => {
    if (!numericSocietyId) {
      setError("Invalid society ID");
      setLoading(false);
      return;
    }

    const fetchEvents = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/api/events/sorted/", {
          params: { society_id: numericSocietyId },
        });

        const allSocietyEvents = response.data.filter((event: Event) => event.hosted_by === numericSocietyId);
        let filteredEvents: Event[] = [];
        const currentDate = new Date();

        if (filter === "upcoming") {
          filteredEvents = allSocietyEvents.filter((event: Event) => {
            const eventDate = new Date(`${event.date}T${event.start_time}`);
            return eventDate > currentDate && event.status === "Approved";
          });
        } else if (filter === "previous") {
          filteredEvents = allSocietyEvents.filter((event: Event) => {
            const eventDate = new Date(`${event.date}T${event.start_time}`);
            return eventDate < currentDate && event.status === "Approved";
          });
        } else if (filter === "pending") {
          filteredEvents = allSocietyEvents.filter((event: Event) => event.status === "Pending");
        } else if (filter === "rejected") {
          filteredEvents = allSocietyEvents.filter((event: Event) => event.status === "Rejected");
        }

        setEvents(filteredEvents);
      } catch (err: any) {
        setError(`Failed to load ${filter} events: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [numericSocietyId, filter]);

  const isEditable = (event: Event): boolean => {
    if (event.status === "Pending" || event.status === "Rejected") return true;
    const nowDate = new Date();
    const eventDateTime = new Date(`${event.date}T${event.start_time}`);
    return eventDateTime > nowDate;
  };

  const confirmDelete = (eventId: number) => {
    setSelectedEventId(eventId);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEventId !== null) {
      try {
        await apiClient.delete(`/api/events/${selectedEventId}/manage/`);
        setEvents((prev) => prev.filter((e) => e.id !== selectedEventId));
        setSnackbar({ open: true, message: "Event deleted successfully.", severity: "success" });
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to delete event.", severity: "error" });
      } finally {
        setOpenDialog(false);
        setSelectedEventId(null);
      }
    }
  };

  const handleEdit = (eventId: number) => {
    navigate(`/president-page/${society_id}/edit-event/${eventId}`);
  };

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
  const paperHoverBackgroundColor = theme.palette.mode === "dark" ? colors.primary[600] : "#f5f5f5";

  const filterOptions: FilterOption[] = [
    { label: "Upcoming", value: "upcoming", color: colors.blueAccent[500] },
    { label: "Previous", value: "previous", color: colors.greenAccent[500] },
    { label: "Pending Approval", value: "pending", color: colors.redAccent[500] },
    { label: "Rejected", value: "rejected", color: colors.grey[500] },
  ];

  return (
    <Box minHeight="100vh" p={4} sx={{ backgroundColor, color: textColor }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" fontWeight="bold" sx={{ color: textColor }}>
          Manage Society Events
        </Typography>
        <Typography variant="h6" sx={{ color: colors.grey[500] }}>
          {filter.charAt(0).toUpperCase() + filter.slice(1)} events for Society {society_id}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" mb={3}>
        <Button
          onClick={() => navigate(`/president-page/${society_id}/create-event`)}
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

      <Box display="flex" justifyContent="center" mb={4}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, newFilter) => newFilter && setFilter(newFilter)}
          sx={{ backgroundColor: colors.primary[500], borderRadius: "8px" }}
        >
          {filterOptions.map(({ label, value, color }) => (
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
          No {filter} events found for society {society_id}.
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
                backgroundColor: paperBackgroundColor,
                color: textColor,
                borderRadius: "8px",
                boxShadow: 3,
                transition: "0.3s",
                "&:hover": { backgroundColor: paperHoverBackgroundColor },
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {event.title}
              </Typography>
              <Typography>Date: {formatDate(event.date)}</Typography>
              <Typography>Time: {formatTime(event.start_time)}</Typography>
              <Typography>Location: {event.location}</Typography>
              <Typography>Status: {event.status}</Typography>

              {isEditable(event) && (
                <Box mt={2} display="flex" gap={2}>
                  <Button variant="contained" color="primary" onClick={() => handleEdit(event.id)}>
                    Edit
                  </Button>
                  <Button variant="contained" color="error" onClick={() => confirmDelete(event.id)}>
                    Delete
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this event?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageSocietyEvents;