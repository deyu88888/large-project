import { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import { Box, CircularProgress, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Alert, IconButton } from "@mui/material";
import { FaCalendarCheck, FaCalendarTimes, FaMapMarkerAlt, FaUsers, FaInfoCircle, FaSync } from "react-icons/fa";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  EventData,
  CalendarEvent,
  StudentCalendarProps
} from "../../types/shared/calendar";

// Interfaces
interface StyleProps {
  colours: ReturnType<typeof tokens>;
}

interface CustomEventProps {
  event: CalendarEvent;
}

interface EventStyleProps {
  event: CalendarEvent;
}

interface DialogContentProps {
  selectedEvent: CalendarEvent;
  timezone: string;
}

interface DialogActionProps {
  selectedEvent: CalendarEvent;
  handleCloseDialog: () => void;
  handleRSVP: (eventId: number, isAttending: boolean) => void;
  rsvpLoading: boolean;
  styleProps: StyleProps;
}

interface CalendarHeaderProps {
  timezone: string;
  fetchEvents: () => void;
  loading: boolean;
  styleProps: StyleProps;
}

interface AlertMessageProps {
  error: string | null;
  onClear: () => void;
}

interface CalendarContainerProps {
  events: CalendarEvent[];
  handleSelectEvent: (event: CalendarEvent) => void;
  eventStyleGetter: (event: CalendarEvent) => { style: React.CSSProperties };
  CustomEvent: React.FC<CustomEventProps>;
}

interface EventDialogProps {
  openDialog: boolean;
  handleCloseDialog: () => void;
  selectedEvent: CalendarEvent | null;
  handleRSVP: (eventId: number, isAttending: boolean) => void;
  rsvpLoading: boolean;
  timezone: string;
  styleProps: StyleProps;
}

interface NoEventsMessageProps {
  styleProps: StyleProps;
}

// Utility functions
const parseDateTime = (dateStr: string, timeStr: string, tz: string): Date => {
  if (!dateStr || !timeStr) {
    throw new Error("Invalid date or time");
  }
  const dateTime = moment.tz(`${dateStr}T${timeStr}`, tz);
  return dateTime.toDate();
};

const extractDurationValues = (durationStr: string): { hours: number; minutes: number } => {
  const hourRegex = /(\d+(?:\.\d+)?)\s*(?:hour|hr|h)s?/i;
  const minuteRegex = /(\d+(?:\.\d+)?)\s*(?:minute|min|m)s?/i;
  let hours = 0;
  let minutes = 0;

  const hourMatch = durationStr.match(hourRegex);
  if (hourMatch && hourMatch[1]) {
    hours = parseFloat(hourMatch[1]);
  }

  const minuteMatch = durationStr.match(minuteRegex);
  if (minuteMatch && minuteMatch[1]) {
    minutes = parseFloat(minuteMatch[1]);
  }

  if (!hourMatch && !minuteMatch) {
    const numericValue = parseFloat(durationStr);
    if (!isNaN(numericValue)) {
      hours = numericValue;
    } else {
      hours = 1;
    }
  }

  return { hours, minutes };
};

const calculateEndTime = (startDate: Date, durationStr: string): Date => {
  const endDate = new Date(startDate);
  const { hours, minutes } = extractDurationValues(durationStr);
  
  endDate.setHours(endDate.getHours() + Math.floor(hours));
  endDate.setMinutes(endDate.getMinutes() + Math.round((hours % 1) * 60) + minutes);
  return endDate;
};

const transformEvent = (event: EventData, societies: StudentCalendarProps['societies'], timezone: string): CalendarEvent => {
  const startDate = parseDateTime(event.date, event.start_time, timezone);
  const endDate = calculateEndTime(startDate, event.duration);
  const society = societies?.find(s => s.id === event.hosted_by);
  const societyName = society ? society.name : event.societyName || `Society ${event.hosted_by}`;
  
  return {
    id: event.id,
    title: event.title,
    start: startDate,
    end: endDate,
    description: event.description || "",
    location: event.location || "",
    societyId: event.hosted_by,
    societyName,
    rsvp: event.rsvp || false,
  };
};

// Updated getEventStyle function with better error handling
const getEventStyle = (societyId: number, isRsvp: boolean = false): React.CSSProperties => {
  const colorOptions = [
    "#6c5ce7",
    "#00cec9",
    "#fd79a8",
    "#fdcb6e",
    "#e17055",
    "#0984e3",
    "#00b894",
  ];
  // Ensure societyId is a valid number
  const validSocietyId = typeof societyId === 'number' ? societyId : 0;
  const colorIndex = Math.abs(validSocietyId % colorOptions.length);
  const backgroundColor = colorOptions[colorIndex];
  
  return {
    backgroundColor,
    borderRadius: "8px",
    opacity: 0.9,
    color: "white",
    border: isRsvp ? "2px solid #00ff00" : "1px solid #fff",
    padding: "2px 4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
  };
};

// Component Functions
const CustomEvent: React.FC<CustomEventProps> = ({ event }) => {
  const start = moment(event.start);
  const end = moment(event.end);
  
  return (
    <div className="p-1">
      <strong className="block text-sm">{event.title}</strong>
      <span className="block text-xs">
        {start.format("LT")} - {end.format("LT")}
        {event.rsvp && (
          <span className="ml-2">
            <FaCalendarCheck size={10} style={{ display: "inline", marginRight: "2px" }} />
            RSVP
          </span>
        )}
      </span>
    </div>
  );
};

// Updated EventStyleGetter with null/undefined check
const EventStyleGetter = ({ event }: EventStyleProps) => {
  // Check if event is defined before accessing properties
  if (!event || typeof event.societyId === 'undefined') {
    // Return a default style if event or societyId is undefined
    return {
      style: {
        backgroundColor: "#808080", // Default gray color
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "1px solid #fff",
        padding: "2px 4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      }
    };
  }
  
  return {
    style: getEventStyle(event.societyId, event.rsvp),
  };
};

const EventDialogTitle: React.FC<{
  selectedEvent: CalendarEvent;
  style: React.CSSProperties;
}> = ({ selectedEvent, style }) => {
  return (
    <DialogTitle style={style}>
      {selectedEvent.title}
      {selectedEvent.rsvp && (
        <Chip
          icon={<FaCalendarCheck size={14} />}
          label="You're going"
          size="small"
          color="success"
          sx={{ ml: 2, backgroundColor: "rgba(0,255,0,0.2)" }}
        />
      )}
    </DialogTitle>
  );
};

const EventDateTimeInfo: React.FC<{
  start: Date;
  end: Date;
  timezone: string;
}> = ({ start, end, timezone }) => {
  return (
    <Box mb={2}>
      <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
        <FaInfoCircle style={{ marginRight: "8px" }} />
        When:
      </Typography>
      <Typography variant="body1">
        {moment(start).format("dddd, MMMM Do YYYY")}
      </Typography>
      <Typography variant="body2">
        {moment(start).format("h:mm A")} - {moment(end).format("h:mm A")}{" "}
        <Typography variant="caption" component="span" color="text.secondary">
          ({timezone})
        </Typography>
      </Typography>
    </Box>
  );
};

const EventLocationInfo: React.FC<{
  location: string;
}> = ({ location }) => {
  if (!location) return null;
  
  return (
    <Box mb={2}>
      <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
        <FaMapMarkerAlt style={{ marginRight: "8px" }} />
        Location:
      </Typography>
      <Typography variant="body1">{location}</Typography>
    </Box>
  );
};

const EventSocietyInfo: React.FC<{
  societyName: string;
}> = ({ societyName }) => {
  if (!societyName) return null;
  
  return (
    <Box mb={2}>
      <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
        <FaUsers style={{ marginRight: "8px" }} />
        Hosted By:
      </Typography>
      <Typography variant="body1">{societyName}</Typography>
    </Box>
  );
};

const EventDescriptionInfo: React.FC<{
  description: string;
}> = ({ description }) => {
  if (!description) return null;
  
  return (
    <Box mb={2}>
      <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
        <FaInfoCircle style={{ marginRight: "8px" }} />
        Description:
      </Typography>
      <Typography variant="body1">{description}</Typography>
    </Box>
  );
};

const EventDialogContent: React.FC<DialogContentProps> = ({ selectedEvent, timezone }) => {
  return (
    <DialogContent dividers>
      <EventDateTimeInfo 
        start={selectedEvent.start} 
        end={selectedEvent.end} 
        timezone={timezone} 
      />
      <EventLocationInfo location={selectedEvent.location} />
      <EventSocietyInfo societyName={selectedEvent.societyName} />
      <EventDescriptionInfo description={selectedEvent.description} />
    </DialogContent>
  );
};

const EventDialogActions: React.FC<DialogActionProps> = ({ 
  selectedEvent, 
  handleCloseDialog, 
  handleRSVP, 
  rsvpLoading, 
  styleProps 
}) => {
  const { colours } = styleProps;
  
  return (
    <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
      <Button onClick={handleCloseDialog} color="inherit">
        Close
      </Button>
      <Button
        variant="contained"
        startIcon={selectedEvent.rsvp ? <FaCalendarTimes /> : <FaCalendarCheck />}
        onClick={() => handleRSVP(selectedEvent.id, !selectedEvent.rsvp)}
        disabled={rsvpLoading}
        color={selectedEvent.rsvp ? "error" : "primary"}
        sx={{
          backgroundColor: selectedEvent.rsvp ? colours.redAccent[500] : colours.blueAccent[500],
          "&:hover": {
            backgroundColor: selectedEvent.rsvp
              ? colours.redAccent[600]
              : colours.blueAccent[600],
          },
        }}
      >
        {rsvpLoading
          ? "Updating..."
          : selectedEvent.rsvp
            ? "Cancel RSVP"
            : "RSVP to Event"}
      </Button>
    </DialogActions>
  );
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ timezone, fetchEvents, loading, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h6" sx={{ color: colours.grey[100] }}>
        My Society Events
      </Typography>
      <Box>
        <Typography variant="caption" sx={{ color: colours.grey[300], mr: 2 }}>
          Timezone: {timezone}
        </Typography>
        <IconButton
          onClick={fetchEvents}
          disabled={loading}
          sx={{ color: colours.blueAccent[500] }}
          title="Refresh events"
        >
          <FaSync />
        </IconButton>
      </Box>
    </Box>
  );
};

const AlertMessage: React.FC<AlertMessageProps> = ({ error, onClear }) => {
  if (!error) return null;
  
  return (
    <Alert severity="error" sx={{ mb: 3 }} onClose={onClear}>
      {error}
    </Alert>
  );
};

const LoadingIndicator: React.FC<{ colours: ReturnType<typeof tokens> }> = ({ colours }) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="500px">
      <CircularProgress size={40} sx={{ color: colours.blueAccent[500] }} role="progressbar" />
    </Box>
  );
};

const NoEventsMessage: React.FC<NoEventsMessageProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <Typography variant="body1" align="center" sx={{ color: colours.grey[300], py: 4 }}>
      No events from your societies
    </Typography>
  );
};

const CalendarContainer: React.FC<CalendarContainerProps> = ({ 
  events, 
  handleSelectEvent, 
  eventStyleGetter, 
  CustomEvent 
}) => {
  const localizer = momentLocalizer(moment);
  const minTime = new Date();
  minTime.setHours(6, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(23, 0, 0);
  
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      className="rounded-lg"
      eventPropGetter={eventStyleGetter}
      components={{
        event: CustomEvent,
        agenda: { event: CustomEvent },
      }}
      views={["month", "week", "day", "agenda"]}
      dayLayoutAlgorithm="no-overlap"
      min={minTime}
      max={maxTime}
      messages={{
        agenda: "Agenda",
        noEventsInRange: "No events in this date range from your societies",
      }}
      formats={{
        eventTimeRangeFormat: () => "",
      }}
      onSelectEvent={handleSelectEvent}
      popup
      culture={navigator.language}
    />
  );
};

const EventDialog: React.FC<EventDialogProps> = ({
  openDialog,
  handleCloseDialog,
  selectedEvent,
  handleRSVP,
  rsvpLoading,
  timezone,
  styleProps
}) => {
  const { colours } = styleProps;
  
  if (!selectedEvent) return null;
  
  // Add safety check for selectedEvent.societyId
  const safeEventStyle = () => {
    if (typeof selectedEvent.societyId === 'undefined') {
      return {
        backgroundColor: "#808080",
        color: "#ffffff",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
      };
    }
    return {
      backgroundColor: getEventStyle(selectedEvent.societyId, selectedEvent.rsvp).backgroundColor,
      color: "#ffffff",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    };
  };
  
  const titleStyle = safeEventStyle();
  
  return (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: colours.primary[400],
          color: colours.grey[100],
          borderRadius: "12px",
        },
      }}
    >
      <EventDialogTitle selectedEvent={selectedEvent} style={titleStyle} />
      <EventDialogContent selectedEvent={selectedEvent} timezone={timezone} />
      <EventDialogActions
        selectedEvent={selectedEvent}
        handleCloseDialog={handleCloseDialog}
        handleRSVP={handleRSVP}
        rsvpLoading={rsvpLoading}
        styleProps={styleProps}
      />
    </Dialog>
  );
};

// Custom Hooks
const useCalendarEvents = (
  societies: StudentCalendarProps['societies'] = [],
  userEvents: EventData[] | undefined,
  timezone: string
) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const societyIds = useMemo(() => societies.map(s => s.id), [societies]);
  
  const transformEvents = (eventsData: EventData[]) => {
    try {
      const formatted = eventsData.map(event => transformEvent(event, societies, timezone));
      setEvents(formatted);
    } catch (err) {
      console.error("Error transforming events:", err);
      setError("Failed to process events. Please try again.");
    }
  };
  
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<EventData[]>("/api/events/");
      if (!response.data) {
        throw new Error("No data received from API");
      }
      const filtered = response.data.filter(e => societyIds.includes(e.hosted_by));
      transformEvents(filtered);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!userEvents) {
      fetchEvents();
      return;
    }
    
    setLoading(true);
    try {
      const filtered = userEvents.filter(e => societyIds.includes(e.hosted_by));
      transformEvents(filtered);
    } catch (err) {
      console.error("Error transforming userEvents:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userEvents, societyIds]);
  
  return { events, loading, error, setError, fetchEvents, setEvents };
};

const useEventSelection = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };
  
  return { 
    selectedEvent, 
    setSelectedEvent, 
    openDialog, 
    setOpenDialog, 
    handleSelectEvent, 
    handleCloseDialog 
  };
};

const useRsvpHandler = (setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>, setSelectedEvent: React.Dispatch<React.SetStateAction<CalendarEvent | null>>) => {
  const [rsvpLoading, setRsvpLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleRSVP = async (eventId: number, isAttending: boolean) => {
    try {
      setRsvpLoading(true);
      
      // Add logging to help debug the request
      console.log("Sending RSVP request with:", { event_id: eventId });
      
      if (isAttending) {
        // Try with the correct format the server expects
        await apiClient.post("/api/events/rsvp/", { event_id: eventId });
      } else {
        // Same for delete
        await apiClient.delete("/api/events/rsvp/", { data: { event_id: eventId } });
      }
      
      setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, rsvp: isAttending } : e)));
      setSelectedEvent(prev => prev && prev.id === eventId ? { ...prev, rsvp: isAttending } : prev);
    } catch (err) {
      console.error("Error updating RSVP:", err);
      
      // More detailed error logging
      if (err.response) {
        console.error("Server response data:", err.response.data);
      }
      
      setError("Failed to update RSVP status. Please try again.");
    } finally {
      setRsvpLoading(false);
    }
  };
  
  return { rsvpLoading, error, setError, handleRSVP };
};

// Main Component
function StudentCalendar({
  societies = [],
  userEvents,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: StudentCalendarProps) {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const styleProps = { colours };
  
  // Custom hooks
  const { 
    events, 
    loading, 
    error, 
    setError, 
    fetchEvents, 
    setEvents 
  } = useCalendarEvents(societies, userEvents, timezone);
  
  const { 
    selectedEvent, 
    setSelectedEvent,
    openDialog, 
    handleSelectEvent, 
    handleCloseDialog 
  } = useEventSelection();
  
  const { 
    rsvpLoading, 
    error: rsvpError, 
    setError: setRsvpError,
    handleRSVP 
  } = useRsvpHandler(setEvents, setSelectedEvent);
  
  // Memoized values
  const memoizedEvents = useMemo(() => events, [events]);
  const combinedError = error || rsvpError;
  const clearError = () => {
    setError(null);
    setRsvpError(null);
  };
  
  return (
    <>
      <AlertMessage error={combinedError} onClear={clearError} />
      
      {loading ? (
        <LoadingIndicator colours={colours} />
      ) : (
        <Box>
          <CalendarHeader 
            timezone={timezone} 
            fetchEvents={fetchEvents} 
            loading={loading} 
            styleProps={styleProps} 
          />
          
          {memoizedEvents.length === 0 ? (
            <NoEventsMessage styleProps={styleProps} />
          ) : (
            <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
              <div
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-6"
                style={{ backgroundColor: colours.primary[400] }}
              >
                <CalendarContainer 
                  events={memoizedEvents}
                  handleSelectEvent={handleSelectEvent}
                  eventStyleGetter={EventStyleGetter}
                  CustomEvent={CustomEvent}
                />
              </div>
            </div>
          )}
        </Box>
      )}
      
      <EventDialog 
        openDialog={openDialog}
        handleCloseDialog={handleCloseDialog}
        selectedEvent={selectedEvent}
        handleRSVP={handleRSVP}
        rsvpLoading={rsvpLoading}
        timezone={timezone}
        styleProps={styleProps}
      />
    </>
  );
}

export default StudentCalendar;