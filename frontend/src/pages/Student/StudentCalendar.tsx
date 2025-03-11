import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
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
  FaSync
} from "react-icons/fa";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";

// Initialize the localizer
const localizer = momentLocalizer(moment);

// Define the Event type from API
interface EventData {
  id: number;
  title: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM
  duration: string; // Format: "X hours" or "X minutes" or "X.Y hours"
  location?: string;
  description?: string;
  hostedBy: number; // Society ID
  societyName?: string;
  rsvp?: boolean;
}

// Custom event type that extends BigCalendarEvent
interface CalendarEvent extends BigCalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  societyId: number;
  societyName: string;
  rsvp: boolean;
}

interface Society {
  id: number;
  name: string;
  is_president?: boolean;
}

interface StudentCalendarProps {
  societies?: Society[]; // Societies the student is a member of
  userEvents?: EventData[]; // Optional pre-loaded events
  timezone?: string; // Optional timezone override
}

const StudentCalendar: React.FC<StudentCalendarProps> = ({ 
  societies = [], 
  userEvents,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone // Default to browser's timezone
}) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [rsvpLoading, setRsvpLoading] = useState<boolean>(false);

  // Extract society IDs for filtering
  const societyIds = societies.map(society => society.id);

  // Fetch events on component mount or when dependencies change
  useEffect(() => {
    if (userEvents) {
      // If events are passed as props, filter and use them
      const filteredEvents = userEvents.filter(event => 
        societyIds.includes(event.hostedBy)
      );
      transformEvents(filteredEvents);
    } else {
      // Otherwise fetch from API
      fetchEvents();
    }
  }, [userEvents, societyIds, timezone]); // Added timezone as dependency

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all events from API
      const response = await apiClient.get<EventData[]>('/api/events/');
      
      if (!response.data) {
        throw new Error("No data received from API");
      }
      
      // Filter events to only include those from societies the student is a member of
      const filteredEvents = response.data.filter((event) => 
        societyIds.includes(event.hostedBy)
      );
      
      transformEvents(filteredEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const transformEvents = (eventsData: EventData[]) => {
    // Transform API event data into CalendarEvent format
    const formattedEvents: CalendarEvent[] = eventsData.map((event) => {
      // Parse the date and time with timezone
      const startDate = parseDateTime(event.date, event.startTime, timezone);
      const endDate = calculateEndTime(startDate, event.duration);
      
      // Find society name from the societies list
      const society = societies.find(s => s.id === event.hostedBy);
      const societyName = society ? society.name : event.societyName || `Society ${event.hostedBy}`;
      
      return {
        id: event.id,
        title: event.title,
        start: startDate,
        end: endDate,
        description: event.description || '',
        location: event.location || '',
        societyId: event.hostedBy,
        societyName: societyName,
        rsvp: event.rsvp || false,
      };
    });
    
    setEvents(formattedEvents);
  };

  // Helper functions for date handling
  const parseDateTime = (dateStr: string, timeStr: string, tz: string): Date => {
    // Create a moment object with the given date, time, and timezone
    const dateTime = moment.tz(`${dateStr}T${timeStr}`, tz);
    return dateTime.toDate();
  };

  const calculateEndTime = (startDate: Date, durationStr: string): Date => {
    const endDate = new Date(startDate);
    
    // Handle various duration formats with regex
    const hourRegex = /(\d+(?:\.\d+)?)\s*(?:hour|hr|h)s?/i;
    const minuteRegex = /(\d+(?:\.\d+)?)\s*(?:minute|min|m)s?/i;
    
    let hours = 0;
    let minutes = 0;
    
    // Extract hours if present
    const hourMatch = durationStr.match(hourRegex);
    if (hourMatch && hourMatch[1]) {
      hours = parseFloat(hourMatch[1]);
    }
    
    // Extract minutes if present
    const minuteMatch = durationStr.match(minuteRegex);
    if (minuteMatch && minuteMatch[1]) {
      minutes = parseFloat(minuteMatch[1]);
    }
    
    // If no matches found, try to interpret the whole string as a number of hours
    if (!hourMatch && !minuteMatch) {
      const numericValue = parseFloat(durationStr);
      if (!isNaN(numericValue)) {
        hours = numericValue;
      } else {
        // Default to 1 hour if unparseable
        console.warn(`Could not parse duration: "${durationStr}", defaulting to 1 hour`);
        hours = 1;
      }
    }
    
    // Add hours and minutes to the start date
    endDate.setHours(endDate.getHours() + Math.floor(hours));
    endDate.setMinutes(endDate.getMinutes() + Math.round((hours % 1) * 60) + minutes);
    
    return endDate;
  };

  // Handle RSVP for events
  const handleRSVP = async (eventId: number, isAttending: boolean) => {
    try {
      setRsvpLoading(true);
      
      if (isAttending) {
        await apiClient.post("/api/events/rsvp", { event_id: eventId });
      } else {
        await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
      }
      
      // Update the events list to reflect the RSVP status change
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, rsvp: isAttending } 
          : event
      ));
      
      // Update the selected event if it's the one being RSVP'd
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          rsvp: isAttending
        });
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      setError("Failed to update RSVP status. Please try again.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // Custom style getter for events
  const eventStyleGetter = (
    event: CalendarEvent,
    start: Date,
    end: Date,
    isSelected: boolean
  ) => {
    // Generate a deterministic color based on the event's society ID
    const colorOptions = [
      "#6c5ce7", // Purple
      "#00cec9", // Teal
      "#fd79a8", // Pink
      "#fdcb6e", // Yellow
      "#e17055", // Orange
      "#0984e3", // Blue
      "#00b894", // Green
    ];
    
    // Use the society ID to pick a color (ensures same society's events have same color)
    const colorIndex = Math.abs(event.societyId % colorOptions.length);
    const backgroundColor = colorOptions[colorIndex];
    
    // Calculate the duration in minutes
    const duration = (end.getTime() - start.getTime()) / 60000;
    
    const style = {
      backgroundColor,
      borderRadius: "8px",
      opacity: 0.9,
      color: "white",
      border: event.rsvp ? "2px solid #00ff00" : "1px solid #fff",
      padding: "2px 4px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      // For very short events, enforce a minimum height
      minHeight: duration <= 30 ? 30 : undefined,
    };
    
    return { style };
  };

  // Custom event component
  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
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

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };

  // Define the visible time range for the day view
  const minTime = new Date();
  minTime.setHours(6, 0, 0); // Start at 6 AM
  const maxTime = new Date();
  maxTime.setHours(23, 0, 0); // End at 11 PM

  // Memoize the events array to prevent unnecessary rerenders
  const memoizedEvents = React.useMemo(() => events, [events]);

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="500px">
          <CircularProgress size={40} sx={{ color: colours.blueAccent[500] }} role="progressbar" />
        </Box>
      ) : (
        <Box>
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
          
          {events.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ color: colours.grey[300], py: 4 }}>
              No events from your societies
            </Typography>
          ) : (
            <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6" style={{ backgroundColor: colours.primary[400] }}>
                <Calendar
                  localizer={localizer}
                  events={memoizedEvents}
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
                    noEventsInRange: "No events in this date range from your societies"
                  }}
                  formats={{
                    eventTimeRangeFormat: () => "",
                  }}
                  onSelectEvent={handleSelectEvent}
                  popup={true}
                  culture={navigator.language}
                />
              </div>
            </div>
          )}
        </Box>
      )}

      {/* Event Details Dialog */}
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
          }
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle
              style={{
                backgroundColor: eventStyleGetter(selectedEvent, selectedEvent.start, selectedEvent.end, false).style.backgroundColor,
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
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
                  <FaInfoCircle style={{ marginRight: "8px" }} />
                  When:
                </Typography>
                <Typography variant="body1">
                  {moment(selectedEvent.start).format('dddd, MMMM Do YYYY')}
                </Typography>
                <Typography variant="body2">
                  {moment(selectedEvent.start).format('h:mm A')}
                  {' - '}
                  {moment(selectedEvent.end).format('h:mm A')}
                  {' '}
                  <Typography variant="caption" component="span" color="text.secondary">
                    ({timezone})
                  </Typography>
                </Typography>
              </Box>

              {selectedEvent.location && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
                    <FaMapMarkerAlt style={{ marginRight: "8px" }} />
                    Location:
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.location}
                  </Typography>
                </Box>
              )}

              {selectedEvent.societyName && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
                    <FaUsers style={{ marginRight: "8px" }} />
                    Hosted By:
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.societyName}
                  </Typography>
                </Box>
              )}

              {selectedEvent.description && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center">
                    <FaInfoCircle style={{ marginRight: "8px" }} />
                    Description:
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}
            </DialogContent>
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
                    backgroundColor: selectedEvent.rsvp ? colours.redAccent[600] : colours.blueAccent[600],
                  }
                }}
              >
                {rsvpLoading ? "Updating..." : selectedEvent.rsvp ? "Cancel RSVP" : "RSVP to Event"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default StudentCalendar;