import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useTheme,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { FaRegClock, FaMapMarkerAlt } from "react-icons/fa";
import { EventData } from "../../types/student/event";
import {
  StyleProps,
  Society,
  ViewSocietyEventsState,
  PageHeaderProps,
  LoadingStateProps,
  ErrorStateProps,
  EmptyStateProps,
  EventStatusBadgeProps,
  EventTimeProps,
  EventLocationProps,
  RsvpButtonProps,
  EventCardProps,
  EventListProps
} from "../../types/student/ViewSocietyEvents";

// Utility Functions
const isUpcomingEvent = (dateStr: string): boolean => {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
};

const getPageTitle = (eventType: string | undefined, societyName: string): string => {
  let title = "";
  if (eventType === "upcoming-events") title = "Upcoming Events";
  else if (eventType === "previous-events") title = "Previous Events";
  else if (eventType === "pending-events") title = "Pending Approval Events";
  else title = "All Events";

  if (societyName) {
    return `${societyName} - ${title}`;
  }
  return title;
};

// API Functions
const fetchSocietyInfo = async (societyId: string): Promise<Society | null> => {
  try {
    const response = await apiClient.get(`/api/societies/${societyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching society info:", error);
    return null;
  }
};

const fetchEventsBySociety = async (
  societyId: string, 
  eventType: string | undefined
): Promise<EventData[]> => {
  // Main events request
  let endpoint = `/api/events?society_id=${societyId}`;

  // Apply filtering based on event_type
  if (eventType === "upcoming-events") {
    endpoint += "&filter=upcoming";
  } else if (eventType === "previous-events") {
    endpoint += "&filter=previous";
  } else if (eventType === "pending-events") {
    endpoint += "&filter=pending";
  }

  const response = await apiClient.get(endpoint);

  // If we got data back but it's empty
  if (response.data && Array.isArray(response.data) && response.data.length === 0) {
    return [];
  }
  // If we got actual event data
  else if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

const fetchAllEventsAndFilter = async (
  societyId: string, 
  eventType: string | undefined
): Promise<EventData[]> => {
  const response = await apiClient.get("/api/events/");
  
  if (!response.data) {
    return [];
  }
  
  return response.data.filter(
    (event: EventData) =>
      event.hosted_by === parseInt(societyId) &&
      ((eventType === "pending-events" && event.status === "Pending") ||
        (eventType === "upcoming-events" &&
          event.status === "Approved" &&
          isUpcomingEvent(event.date)) ||
        (eventType === "previous-events" &&
          event.status === "Approved" &&
          !isUpcomingEvent(event.date)) ||
        !eventType)
  );
};

const handleRsvpRequest = async (eventId: number, isAttending: boolean): Promise<boolean> => {
  try {
    if (isAttending) {
      await apiClient.post("/api/events/rsvp", { event_id: eventId });
    } else {
      await apiClient.delete("/api/events/rsvp", {
        data: { event_id: eventId },
      });
    }
    return true;
  } catch (error) {
    console.error("Error updating RSVP:", error);
    return false;
  }
};

// Component Functions
const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={4}
    >
      <Typography variant="h4" sx={{ color: colours.grey[100] }}>
        {title}
      </Typography>
      <Button
        variant="contained"
        onClick={onBack}
        sx={{
          backgroundColor: colours.blueAccent[500],
          color: colours.grey[100],
        }}
      >
        Back
      </Button>
    </Box>
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      py={8}
    >
      <CircularProgress size={48} style={{ color: colours.grey[100] }} />
    </Box>
  );
};

const ErrorState: React.FC<ErrorStateProps> = ({ error, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: colours.primary[400],
        border: `1px solid ${colours.grey[800]}`,
        p: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: colours.redAccent[500], textAlign: "center" }}
      >
        {error}
      </Typography>
    </Paper>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: colours.primary[400],
        border: `1px solid ${colours.grey[800]}`,
        p: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: colours.grey[300], textAlign: "center" }}
      >
        No events found.
      </Typography>
    </Paper>
  );
};

const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ status, styleProps }) => {
  const { colours } = styleProps;
  
  const getBadgeColor = (status: string) => {
    if (status === "Approved") return colours.greenAccent[500];
    if (status === "Pending") return colours.orangeAccent[500];
    return colours.redAccent[500];
  };
  
  return (
    <Box
      px={1}
      py={0.5}
      borderRadius="4px"
      bgcolor={getBadgeColor(status)}
      color={colours.primary[500]}
    >
      <Typography variant="caption">
        {status}
      </Typography>
    </Box>
  );
};

const EventTime: React.FC<EventTimeProps> = ({ date, startTime, duration, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Box display="flex" alignItems="center" mt={1}>
      <FaRegClock
        style={{ marginRight: 8, color: colours.grey[300] }}
      />
      <Typography
        variant="body2"
        sx={{ color: colours.grey[300] }}
      >
        {date} {startTime && `at ${startTime}`}
        {duration && ` (${duration})`}
      </Typography>
    </Box>
  );
};

const EventLocation: React.FC<EventLocationProps> = ({ location, styleProps }) => {
  const { colours } = styleProps;
  
  if (!location) return null;
  
  return (
    <Box display="flex" alignItems="center" mt={1}>
      <FaMapMarkerAlt
        style={{ marginRight: 8, color: colours.grey[300] }}
      />
      <Typography
        variant="body2"
        sx={{ color: colours.grey[300] }}
      >
        {location}
      </Typography>
    </Box>
  );
};

const RsvpButton: React.FC<RsvpButtonProps> = ({ eventId, isRsvped, onRsvp, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Button
      fullWidth
      variant="contained"
      onClick={() => onRsvp(eventId, !isRsvped)}
      sx={{
        mt: 2,
        backgroundColor: isRsvped
          ? colours.grey[700]
          : colours.blueAccent[500],
        color: colours.grey[100],
      }}
    >
      {isRsvped ? "Cancel RSVP" : "RSVP Now"}
    </Button>
  );
};

const EventCard: React.FC<EventCardProps> = ({ event, onRsvp, isUpcoming, styleProps }) => {
  const { colours } = styleProps;
  
  const shouldShowRsvpButton = () => {
    return (
      event.status === "Approved" &&
      event.rsvp !== undefined &&
      isUpcoming(event.date)
    );
  };
  
  return (
    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={event.id}>
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h6"
              sx={{ color: colours.grey[100] }}
            >
              {event.title}
            </Typography>
            <EventStatusBadge status={event.status} styleProps={styleProps} />
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

          <EventTime 
            date={event.date} 
            startTime={event.start_time} 
            duration={event.duration}
            styleProps={styleProps}
          />

          {event.location && (
            <EventLocation 
              location={event.location} 
              styleProps={styleProps} 
            />
          )}
        </Box>

        {shouldShowRsvpButton() && (
          <RsvpButton 
            eventId={event.id}
            isRsvped={!!event.rsvp}
            onRsvp={onRsvp}
            styleProps={styleProps}
          />
        )}
      </Paper>
    </Grid>
  );
};

const EventList: React.FC<EventListProps> = ({ events, onRsvp, isUpcoming, styleProps }) => {
  return (
    <Grid container spacing={3}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onRsvp={onRsvp}
          isUpcoming={isUpcoming}
          styleProps={styleProps}
        />
      ))}
    </Grid>
  );
};

// Custom Hooks
const useSocietyEvents = (societyId: string | undefined, eventType: string | undefined) => {
  const [state, setState] = useState<ViewSocietyEventsState>({
    events: [],
    loading: true,
    societyName: "",
    error: null,
  });
  
  const updateState = (updates: Partial<ViewSocietyEventsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  
  const fetchEvents = async () => {
    if (!societyId) {
      updateState({ 
        error: "Society ID is missing", 
        loading: false 
      });
      return;
    }

    updateState({ loading: true, error: null });

    try {
      // First fetch society info to get the name
      const society = await fetchSocietyInfo(societyId);
      if (society?.name) {
        updateState({ societyName: society.name });
      }

      // Try to fetch events using the main endpoint first
      try {
        const events = await fetchEventsBySociety(societyId, eventType);
        updateState({ events, loading: false });
      } catch (error) {
        // Fallback to the getAllEvents approach if the main approach fails
        const filteredEvents = await fetchAllEventsAndFilter(societyId, eventType);
        updateState({ events: filteredEvents, loading: false });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      updateState({
        error: "Failed to load events. Please try again later.",
        loading: false,
      });
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, [societyId, eventType]);
  
  const handleRsvp = async (eventId: number, isAttending: boolean) => {
    const success = await handleRsvpRequest(eventId, isAttending);
    if (success) {
      fetchEvents();
    }
  };
  
  return {
    ...state,
    handleRsvp,
    fetchEvents,
  };
};

// Main Component
const ViewSocietyEvents: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const { society_id, event_type } = useParams();
  const styleProps = { colours };
  
  const { events, loading, societyName, error, handleRsvp } = useSocietyEvents(society_id, event_type);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const renderContent = () => {
    if (loading) {
      return <LoadingState styleProps={styleProps} />;
    }
    
    if (error) {
      return <ErrorState error={error} styleProps={styleProps} />;
    }
    
    if (events.length === 0) {
      return <EmptyState styleProps={styleProps} />;
    }
    
    return (
      <EventList
        events={events}
        onRsvp={handleRsvp}
        isUpcoming={isUpcomingEvent}
        styleProps={styleProps}
      />
    );
  };
  
  const title = getPageTitle(event_type, societyName);
  
  return (
    <Box minHeight="100vh" bgcolor={colours.primary[500]} py={8}>
      <Box maxWidth="1920px" mx="auto" px={4}>
        <PageHeader 
          title={title} 
          onBack={handleBack} 
          styleProps={styleProps} 
        />
        {renderContent()}
      </Box>
    </Box>
  );
};

export default ViewSocietyEvents;