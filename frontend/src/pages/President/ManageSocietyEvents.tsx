import { useState, useEffect } from "react";
import { useNavigate, useParams, Params } from "react-router-dom";
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
import { Event } from "../../types/event/event";
import {
  FilterType,
  FilterOption,
  ThemeStyles
} from "../../types/president/ManageSocietyEvents";

const getDateOptions = (): Intl.DateTimeFormatOptions => {
  return {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
};

const formatDate = (dateString: string): string => {
  const options = getDateOptions();
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getTimeOptions = (): Intl.DateTimeFormatOptions => {
  return {
    hour: "2-digit",
    minute: "2-digit",
  };
};

const parseTimeString = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date;
};

const formatTime = (timeString: string): string => {
  const parsedTime = parseTimeString(timeString);
  const options = getTimeOptions();
  return parsedTime.toLocaleTimeString(undefined, options);
};

const isFilterType = (value: unknown): value is FilterType => {
  return ["upcoming", "previous", "pending", "rejected"].includes(
    value as FilterType
  );
};

const getUpcomingEvents = (events: Event[], societyId: number): Event[] => {
  const currentDate = new Date();
  return events
    .filter((event) => event.hosted_by === societyId)
    .filter(
      (event) =>
        new Date(`${event.date}T${event.start_time}`) > currentDate &&
        event.status === "Approved"
    );
};

const getPreviousEvents = (events: Event[], societyId: number): Event[] => {
  const currentDate = new Date();
  return events
    .filter((event) => event.hosted_by === societyId)
    .filter(
      (event) =>
        new Date(`${event.date}T${event.start_time}`) < currentDate &&
        event.status === "Approved"
    );
};

const getPendingEvents = (events: Event[], societyId: number): Event[] => {
  return events
    .filter((event) => event.hosted_by === societyId)
    .filter((event) => event.status === "Pending");
};

const getRejectedEvents = (events: Event[], societyId: number): Event[] => {
  return events
    .filter((event) => event.hosted_by === societyId)
    .filter((event) => event.status === "Rejected");
};

const getFilteredEvents = (
  events: Event[],
  filter: FilterType,
  societyId: number
): Event[] => {
  switch (filter) {
    case "upcoming":
      return getUpcomingEvents(events, societyId);
    case "previous":
      return getPreviousEvents(events, societyId);
    case "pending":
      return getPendingEvents(events, societyId);
    case "rejected":
      return getRejectedEvents(events, societyId);
    default:
      return [];
  }
};

export default function ManageSocietyEvents() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { societyId, filter: filterParam } = useParams<Params>();

  const numericSocietyId = societyId ? parseInt(societyId, 10) : null;
  const [filter, setFilter] = useState<FilterType>(
    isFilterType(filterParam) ? filterParam : "upcoming"
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const getThemeStyles = (): ThemeStyles => {
    return {
      backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
      textColor: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      paperBackgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
      paperHoverBackgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#f5f5f5"
    };
  };

  const themeStyles = getThemeStyles();

  const getFilterOptions = (): FilterOption[] => {
    return [
      { label: "Upcoming", value: "upcoming", color: colors.blueAccent[500] },
      { label: "Previous", value: "previous", color: colors.greenAccent[500] },
      {
        label: "Pending Approval",
        value: "pending",
        color: colors.redAccent[500],
      },
      { label: "Rejected", value: "rejected", color: colors.grey[500] },
    ];
  };

  const filterOptions = getFilterOptions();

  const navigateToFilteredPage = () => {
    if (!societyId || filter === filterParam) return;
    
    navigate(`/president-page/${societyId}/manage-society-events/${filter}`, {
      replace: true,
    });
  };

  useEffect(() => {
    navigateToFilteredPage();
  }, [filter, filterParam, societyId]);

  const validateSocietyId = (): boolean => {
    if (!numericSocietyId) {
      setError("Invalid society ID");
      setLoading(false);
      return false;
    }
    return true;
  };

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const endLoading = () => {
    setLoading(false);
  };

  const processEventsResponse = (data: Event[], societyId: number) => {
    setEvents(getFilteredEvents(data, filter, societyId));
  };

  const handleFetchError = (err: unknown) => {
    setError(`Failed to load ${filter} events. ${err}`);
  };

  const fetchEvents = async (id: number) => {
    startLoading();
    try {
      const response = await apiClient.get("/api/events/sorted/", {
        params: { society_id: id },
      });
      processEventsResponse(response.data, id);
    } catch (error) {
      handleFetchError(error);
    } finally {
      endLoading();
    }
  };

  const initializeEventsFetch = () => {
    if (!validateSocietyId()) return;
    fetchEvents(numericSocietyId);
  };

  useEffect(() => {
    initializeEventsFetch();
  }, [numericSocietyId, filter]);

  const navigateToEditEvent = (eventId: number) => {
    navigate(`/president-page/${societyId}/edit-event/${eventId}`);
  };

  const handleEdit = (eventId: number) => {
    navigateToEditEvent(eventId);
  };

  const openDeleteDialog = (eventId: number) => {
    setSelectedEventId(eventId);
    setOpenDialog(true);
  };

  const confirmDelete = (eventId: number) => {
    openDeleteDialog(eventId);
  };

  const closeDeleteDialog = () => {
    setOpenDialog(false);
    setSelectedEventId(null);
  };

  const removeEventFromList = (eventId: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const showSuccessSnackbar = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "success",
    });
  };

  const showErrorSnackbar = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "error",
    });
  };

  const deleteEvent = async (eventId: number) => {
    await apiClient.delete(`/api/events/${eventId}/manage/`);
  };

  const handleConfirmDelete = async () => {
    if (selectedEventId === null) return;
    
    try {
      await deleteEvent(selectedEventId);
      removeEventFromList(selectedEventId);
      showSuccessSnackbar("Event deleted successfully.");
    } catch {
      showErrorSnackbar("Failed to delete event.");
    } finally {
      closeDeleteDialog();
    }
  };

  const isEventInFuture = (event: Event): boolean => {
    return new Date(`${event.date}T${event.start_time}`) > new Date();
  };

  const isEditable = (event: Event): boolean => {
    if (event.status === "Pending" || event.status === "Rejected") return true;
    return isEventInFuture(event);
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const navigateToCreateEvent = () => {
    navigate(`/president-page/${societyId}/create-event`);
  };

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getFilterTitle = (): string => {
    return capitalizeFirstLetter(filter);
  };

  const createPageTitle = () => {
    return (
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" fontWeight="bold" sx={{ color: themeStyles.textColor }}>
          Manage Society Events
        </Typography>
        <Typography variant="h6" sx={{ color: colors.grey[500] }}>
          {getFilterTitle()} events for Society {societyId}
        </Typography>
      </Box>
    );
  };

  const createNewEventButton = () => {
    return (
      <Box display="flex" justifyContent="center" mb={3}>
        <Button
          onClick={navigateToCreateEvent}
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
    );
  };

  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, newFilter: FilterType) => {
    if (newFilter) setFilter(newFilter);
  };

  const createToggleButton = (option: FilterOption) => {
    return (
      <ToggleButton
        key={option.value}
        value={option.value}
        sx={{
          backgroundColor: filter === option.value ? option.color : colors.grey[600],
          color: theme.palette.mode === "dark" ? "#ffffff" : "#141b2d",
          fontWeight: "bold",
          "&:hover": { backgroundColor: option.color, opacity: 0.8 },
          transition: "0.3s",
        }}
      >
        {option.label}
      </ToggleButton>
    );
  };

  const createFilterToggleGroup = () => {
    return (
      <Box display="flex" justifyContent="center" mb={4}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          sx={{ backgroundColor: colors.primary[500], borderRadius: "8px" }}
        >
          {filterOptions.map(createToggleButton)}
        </ToggleButtonGroup>
      </Box>
    );
  };

  const createLoadingIndicator = () => {
    return (
      <Box display="flex" justifyContent="center">
        <CircularProgress color="secondary" />
      </Box>
    );
  };

  const createErrorMessage = () => {
    return (
      <Typography color={colors.redAccent[500]} textAlign="center">
        {error}
      </Typography>
    );
  };

  const createEmptyStateMessage = () => {
    return (
      <Typography textAlign="center" color={colors.grey[500]}>
        No {filter} events found for society {societyId}.
      </Typography>
    );
  };

  const createEventButtons = (event: Event) => {
    if (!isEditable(event)) return null;
    
    return (
      <Box mt={2} display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleEdit(event.id)}
        >
          Edit
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => confirmDelete(event.id)}
        >
          Delete
        </Button>
      </Box>
    );
  };

  const createEventCard = (event: Event) => {
    return (
      <Paper
        key={event.id}
        elevation={3}
        sx={{
          p: 3,
          mb: 2,
          backgroundColor: themeStyles.paperBackgroundColor,
          color: themeStyles.textColor,
          borderRadius: "8px",
          boxShadow: 3,
          transition: "0.3s",
          "&:hover": { backgroundColor: themeStyles.paperHoverBackgroundColor },
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {event.title}
        </Typography>
        <Typography>Date: {formatDate(event.date)}</Typography>
        <Typography>Time: {formatTime(event.start_time)}</Typography>
        <Typography>Location: {event.location}</Typography>
        <Typography>Status: {event.status}</Typography>

        {createEventButtons(event)}
      </Paper>
    );
  };

  const createEventsList = () => {
    return (
      <Box maxWidth="800px" mx="auto">
        {events.map(createEventCard)}
      </Box>
    );
  };

  const createDialogActions = () => {
    return (
      <DialogActions>
        <Button onClick={closeDeleteDialog} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleConfirmDelete} color="error">
          Delete
        </Button>
      </DialogActions>
    );
  };

  const createConfirmationDialog = () => {
    return (
      <Dialog open={openDialog} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this event?</Typography>
        </DialogContent>
        {createDialogActions()}
      </Dialog>
    );
  };

  const createSnackbarAlert = () => {
    return (
      <Alert
        severity={snackbar.severity}
        variant="filled"
        onClose={closeSnackbar}
      >
        {snackbar.message}
      </Alert>
    );
  };

  const createSnackbar = () => {
    return (
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {createSnackbarAlert()}
      </Snackbar>
    );
  };

  const renderMainContent = () => {
    if (loading) {
      return createLoadingIndicator();
    }
    
    if (error) {
      return createErrorMessage();
    }
    
    if (events.length === 0) {
      return createEmptyStateMessage();
    }
    
    return createEventsList();
  };

  return (
    <Box minHeight="100vh" p={4} sx={{ backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor }}>
      {createPageTitle()}
      {createNewEventButton()}
      {createFilterToggleGroup()}
      {renderMainContent()}
      {createConfirmationDialog()}
      {createSnackbar()}
    </Box>
  );
}