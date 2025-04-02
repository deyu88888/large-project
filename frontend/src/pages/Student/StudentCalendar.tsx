import { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Alert,
  IconButton,
} from "@mui/material";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaMapMarkerAlt,
  FaUsers,
  FaInfoCircle,
  FaSync,
} from "react-icons/fa";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  EventData,
  CalendarEvent,
  StudentCalendarProps,
} from "../../types/shared/calendar";
import {
  StyleProps,
  CustomEventProps,
  DialogContentProps,
  DialogActionProps,
  CalendarHeaderProps,
  AlertMessageProps,
  CalendarContainerProps,
  EventDialogProps,
  NoEventsMessageProps,
  EventDateTimeInfoProps,
  EventLocationInfoProps,
  EventSocietyInfoProps,
  EventDescriptionInfoProps,
  EventDialogTitleProps,
  LoadingIndicatorProps
} from "../../types/student/StudentCalendar";

const parseDateTime = (dateStr: string, timeStr: string, tz: string): Date => {
  if (!dateStr || !timeStr) {
    throw new Error("Invalid date or time");
  }
  const dateTime = moment.tz(`${dateStr}T${timeStr}`, tz);
  return dateTime.toDate();
};

const extractDurationValues = (
  durationStr: string
): { hours: number; minutes: number } => {
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
  endDate.setMinutes(
    endDate.getMinutes() + Math.round((hours % 1) * 60) + minutes
  );
  return endDate;
};

const transformEvent = (
  event: EventData,
  societies: StudentCalendarProps["societies"],
  timezone: string
): CalendarEvent => {
  const startDate = parseDateTime(event.date, event.start_time, timezone);
  const endDate = calculateEndTime(startDate, event.duration);

  const society = societies?.find((s) => s.id === event.hosted_by);
  const societyName = society
    ? society.name
    : event.societyName || `Society ${event.hosted_by}`;

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

const hasEventStarted = (event: CalendarEvent): boolean => {
  const now = new Date();
  return event.start < now;
};

const CustomEvent: React.FC<CustomEventProps> = ({ event }) => {
  const start = moment(event.start);
  const end = moment(event.end);
  const eventStarted = hasEventStarted(event);

  return (
    <div className="p-1">
      <strong className="block text-sm">{event.title}</strong>
      <span className="block text-xs">
        {start.format("LT")} - {end.format("LT")}
        {event.rsvp && (
          <span className="ml-2">
            <FaCalendarCheck
              size={10}
              style={{ display: "inline", marginRight: "2px" }}
            />
            RSVP
          </span>
        )}
        {eventStarted && !event.rsvp && (
          <span className="ml-2" style={{ color: "#ff9999" }}>
            (Started)
          </span>
        )}
      </span>
    </div>
  );
};

const EventDialogTitle: React.FC<EventDialogTitleProps> = ({ 
  selectedEvent, 
  eventStyleGetter 
}) => {
  const backgroundColor = eventStyleGetter(selectedEvent).style.backgroundColor;
  const eventStarted = hasEventStarted(selectedEvent);

  return (
    <DialogTitle
      style={{
        backgroundColor,
        color: "#ffffff",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
      }}
    >
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
      {eventStarted && !selectedEvent.rsvp && (
        <Chip
          icon={<FaCalendarTimes size={14} />}
          label="Already started"
          size="small"
          color="error"
          sx={{ ml: 2, backgroundColor: "rgba(255,0,0,0.2)" }}
        />
      )}
    </DialogTitle>
  );
};

const EventDateTimeInfo: React.FC<EventDateTimeInfoProps> = ({ start, end, timezone }) => {
  const now = new Date();
  const hasStarted = start < now;
  
  return (
    <Box mb={2}>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        display="flex"
        alignItems="center"
      >
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
        {hasStarted && (
          <Typography variant="caption" component="span" color="error" sx={{ ml: 1, fontWeight: 'bold' }}>
            This event has already started
          </Typography>
        )}
      </Typography>
    </Box>
  );
};

const EventLocationInfo: React.FC<EventLocationInfoProps> = ({ location }) => {
  if (!location) return null;

  return (
    <Box mb={2}>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        display="flex"
        alignItems="center"
      >
        <FaMapMarkerAlt style={{ marginRight: "8px" }} />
        Location:
      </Typography>
      <Typography variant="body1">{location}</Typography>
    </Box>
  );
};

const EventSocietyInfo: React.FC<EventSocietyInfoProps> = ({ societyName }) => {
  if (!societyName) return null;

  return (
    <Box mb={2}>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        display="flex"
        alignItems="center"
      >
        <FaUsers style={{ marginRight: "8px" }} />
        Hosted By:
      </Typography>
      <Typography variant="body1">{societyName}</Typography>
    </Box>
  );
};

const EventDescriptionInfo: React.FC<EventDescriptionInfoProps> = ({ description }) => {
  if (!description) return null;

  return (
    <Box mb={2}>
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        display="flex"
        alignItems="center"
      >
        <FaInfoCircle style={{ marginRight: "8px" }} />
        Description:
      </Typography>
      <Typography variant="body1">{description}</Typography>
    </Box>
  );
};

const EventDialogContent: React.FC<DialogContentProps> = ({
  selectedEvent,
  timezone,
}) => {
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
  styleProps,
}) => {
  const { colours } = styleProps;
  const eventStarted = hasEventStarted(selectedEvent);

  return (
    <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
      <Button onClick={handleCloseDialog} color="inherit">
        Close
      </Button>

      {selectedEvent.rsvp ? (
        <Box display="flex" alignItems="center">
          <Chip
            icon={<FaCalendarCheck />}
            label="You're attending this event"
            color="success"
            variant="outlined"
            sx={{ mr: 2, border: `1px solid ${colours.greenAccent[500]}`, color: colours.greenAccent[400] }}
          />
          {!eventStarted && (
            <Button
              variant="outlined"
              startIcon={<FaCalendarTimes />}
              onClick={() => handleRSVP(selectedEvent.id, false)}
              disabled={rsvpLoading}
              color="error"
              size="small"
              sx={{
                borderColor: colours.redAccent[500],
                color: colours.redAccent[500],
                "&:hover": {
                  backgroundColor: colours.redAccent[900],
                  borderColor: colours.redAccent[600],
                },
              }}
            >
              {rsvpLoading ? "Updating..." : "Cancel"}
            </Button>
          )}
        </Box>
      ) : eventStarted ? (
        <Chip
          icon={<FaCalendarTimes />}
          label="You cannot RSVP for an event that has already started"
          color="error"
          variant="outlined"
          sx={{ borderColor: colours.redAccent[500], color: colours.redAccent[400] }}
        />
      ) : (
        <Button
          variant="contained"
          startIcon={<FaCalendarCheck />}
          onClick={() => handleRSVP(selectedEvent.id, true)}
          disabled={rsvpLoading || eventStarted}
          color="primary"
          sx={{
            backgroundColor: colours.blueAccent[500],
            "&:hover": {
              backgroundColor: colours.blueAccent[600],
            },
          }}
        >
          {rsvpLoading ? "Updating..." : "RSVP to Event"}
        </Button>
      )}
    </DialogActions>
  );
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  timezone,
  fetchEvents,
  loading,
  styleProps,
}) => {
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

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ colours }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="500px"
    >
      <CircularProgress
        size={40}
        sx={{ color: colours.blueAccent[500] }}
        role="progressbar"
      />
    </Box>
  );
};

const NoEventsMessage: React.FC<NoEventsMessageProps> = ({ styleProps }) => {
  const { colours } = styleProps;

  return (
    <Typography
      variant="body1"
      align="center"
      sx={{ color: colours.grey[300], py: 4 }}
    >
      No events from your societies
    </Typography>
  );
};

const CalendarContainer: React.FC<CalendarContainerProps> = ({
  events,
  handleSelectEvent,
  eventStyleGetter,
  CustomEvent,
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
  styleProps,
}) => {
  const { colours } = styleProps;

  if (!selectedEvent) return null;

  const eventStyleGetter = (event: CalendarEvent) => {
    const colorOptions = [
      "#6c5ce7",
      "#00cec9",
      "#fd79a8",
      "#fdcb6e",
      "#e17055",
      "#0984e3",
      "#00b894",
    ];
    const colorIndex = Math.abs(event.societyId % colorOptions.length);
    const backgroundColor = colorOptions[colorIndex];
    
    const eventStarted = hasEventStarted(event);
    const opacity = eventStarted && !event.rsvp ? 0.6 : 0.9;
    
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity,
        color: "white",
        border: event.rsvp ? "2px solid #00ff00" : "1px solid #fff",
        padding: "2px 4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      },
    };
  };

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
      <EventDialogTitle
        selectedEvent={selectedEvent}
        eventStyleGetter={eventStyleGetter}
      />
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

const useCalendarEvents = (
  societies: StudentCalendarProps["societies"] = [],
  userEvents: EventData[] | undefined,
  timezone: string
) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const societyIds = useMemo(() => societies?.map((s) => s.id) || [], [societies]);

  const transformEvents = (eventsData: EventData[]) => {
    try {
      const formatted = eventsData.map((event) =>
        transformEvent(event, societies, timezone)
      );
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
      const response = await apiClient.get<EventData[]>("/api/events/all/");
      if (!response.data) {
        throw new Error("No data received from API");
      }
      const filtered = response.data.filter((e) => societyIds.includes(e.hosted_by));
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
      const filtered = userEvents.filter((e) => societyIds.includes(e.hosted_by));
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
    handleCloseDialog,
  };
};

const useRsvpHandler = (
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
  setSelectedEvent: React.Dispatch<React.SetStateAction<CalendarEvent | null>>,
  events: CalendarEvent[]
) => {
  const [rsvpLoading, setRsvpLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRSVP = async (eventId: number, isAttending: boolean) => {
    try {
      const event = events.find(e => e.id === eventId);
      
      if (event && isAttending) {
        if (hasEventStarted(event)) {
          setError("You cannot RSVP for an event that has already started.");
          return;
        }
      }
      
      setRsvpLoading(true);

      if (isAttending) {
        await apiClient.post("/api/events/rsvp/", { event_id: eventId });
      } else {
        await apiClient.delete("/api/events/rsvp/", { data: { event_id: eventId } });
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, rsvp: isAttending } : e))
      );
      setSelectedEvent((prev) =>
        prev && prev.id === eventId ? { ...prev, rsvp: isAttending } : prev
      );
    } catch (err: any) {
      console.error("Error updating RSVP:", err);

      let errorMessage = "Failed to update RSVP status. Please try again.";
      if (err.response?.data?.non_field_errors && 
          err.response.data.non_field_errors.length > 0) {
        errorMessage = err.response.data.non_field_errors[0];
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setRsvpLoading(false);
    }
  };

  return { rsvpLoading, error, setError, handleRSVP };
};

function StudentCalendar({
  societies = [],
  userEvents,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: StudentCalendarProps) {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const styleProps = { colours };

  const { events, loading, error, setError, fetchEvents, setEvents } =
    useCalendarEvents(societies, userEvents, timezone);

  const {
    selectedEvent,
    setSelectedEvent,
    openDialog,
    setOpenDialog,
    handleSelectEvent,
    handleCloseDialog,
  } = useEventSelection();

  const {
    rsvpLoading,
    error: rsvpError,
    setError: setRsvpError,
    handleRSVP,
  } = useRsvpHandler(setEvents, setSelectedEvent, events);

  function eventStyleGetter(event: CalendarEvent) {
    const colorOptions = [
      "#6c5ce7",
      "#00cec9",
      "#fd79a8",
      "#fdcb6e",
      "#e17055",
      "#0984e3",
      "#00b894",
    ];
    const colorIndex = Math.abs(event.societyId % colorOptions.length);
    const backgroundColor = colorOptions[colorIndex];
    
    const eventStarted = hasEventStarted(event);
    const opacity = eventStarted && !event.rsvp ? 0.6 : 0.9;
    
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity,
        color: "white",
        border: event.rsvp ? "2px solid #00ff00" : "1px solid #fff",
        padding: "2px 4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      },
    };
  }

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
            <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500">
              <div
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-6"
                style={{ backgroundColor: colours.primary[400] }}
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      .rbc-event {
                        transition: all 0.2s ease-in-out;
                      }
                      .rbc-event:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
                      }
                    `,
                  }}
                />
                <CalendarContainer
                  events={memoizedEvents}
                  handleSelectEvent={handleSelectEvent}
                  eventStyleGetter={eventStyleGetter}
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