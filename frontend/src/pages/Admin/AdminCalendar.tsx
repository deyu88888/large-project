import { useState, useEffect, FC } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from "react-big-calendar";
import moment from "moment";
import { Box, CircularProgress, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";

import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { getAllEvents } from "../../api";
import { Event as EventType } from "../../types";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from '../../types/admin/calendar';

// Types and Interfaces
interface CustomEventProps {
  event: CalendarEvent;
}

interface EventDetailsDialogProps {
  open: boolean;
  selectedEvent: CalendarEvent | null;
  colors: any;
  onClose: () => void;
  getEventStyle: (event: CalendarEvent) => { backgroundColor: string };
}

interface CalendarContainerProps {
  events: CalendarEvent[];
  colors: any;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

interface EventStyleParams {
  backgroundColor: string;
  borderRadius: string;
  opacity: number;
  color: string;
  border: string;
  padding: string;
  boxShadow: string;
  minHeight?: number;
}

// Initialize the localizer
const localizer = momentLocalizer(moment);

// Color options for events
const EVENT_COLORS = [
  "#6c5ce7", // Purple
  "#00cec9", // Teal
  "#fd79a8", // Pink
  "#fdcb6e", // Yellow
  "#e17055", // Orange
  "#0984e3", // Blue
  "#00b894", // Green
];

// Time range settings
const getTimeRangeSettings = () => {
  const minTime = new Date();
  minTime.setHours(6, 0, 0); // Start at 6 AM
  
  const maxTime = new Date();
  maxTime.setHours(23, 0, 0); // End at 11 PM
  
  return { minTime, maxTime };
};

// Custom event component
const CustomEvent: FC<CustomEventProps> = ({ event }) => {
  const start = moment(event.start);
  const end = moment(event.end);
  
  return (
    <div className="p-1">
      <strong className="block text-sm">{event.title}</strong>
      <span className="block text-xs">
        {start.format("LT")} - {end.format("LT")}
      </span>
    </div>
  );
};

// Event Details Dialog Component
const EventDetailsDialog: FC<EventDetailsDialogProps> = ({ 
  open, 
  selectedEvent, 
  colors, 
  onClose,
  getEventStyle 
}) => {
  if (!selectedEvent) return null;
  
  const eventStyle = getEventStyle(selectedEvent);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: colors.primary[400],
          color: colors.grey[100]
        }
      }}
    >
      <DialogTitle
        style={{
          backgroundColor: eventStyle.backgroundColor,
          color: "#ffffff"
        }}
      >
        {selectedEvent.title}
      </DialogTitle>
      <DialogContent dividers>
        <EventDetailsContent event={selectedEvent} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Event Details Content
const EventDetailsContent: FC<{ event: CalendarEvent }> = ({ event }) => {
  return (
    <>
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Date & Time:
        </Typography>
        <Typography variant="body1">
          {moment(event.start).format('dddd, MMMM Do YYYY')}
          {' at '}
          {moment(event.start).format('h:mm A')}
          {' - '}
          {moment(event.end).format('h:mm A')}
        </Typography>
      </Box>

      {event.location && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            Location:
          </Typography>
          <Typography variant="body1">
            {event.location}
          </Typography>
        </Box>
      )}

      {event.description && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            Description:
          </Typography>
          <Typography variant="body1">
            {event.description}
          </Typography>
        </Box>
      )}

      {event.hostedBy && (
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            Hosted By:
          </Typography>
          <Typography variant="body1">
            Society ID: {event.hostedBy}
          </Typography>
        </Box>
      )}
    </>
  );
};

// Calendar Container Component
const CalendarContainer: FC<CalendarContainerProps> = ({ 
  events, 
  colors, 
  loading, 
  error, 
  onRefresh,
  onSelectEvent 
}) => {
  const theme = useTheme();
  const { minTime, maxTime } = getTimeRangeSettings();
  
  const getEventStyle = (event: CalendarEvent): { backgroundColor: string } => {
    return {
      backgroundColor: EVENT_COLORS[Number(event.id) % EVENT_COLORS.length]
    };
  };
  
  const eventStyleGetter = (event: CalendarEvent, start: Date, end: Date) => {
    const { backgroundColor } = getEventStyle(event);
    const duration = (end.getTime() - start.getTime()) / 60000;
    
    const style: EventStyleParams = {
      backgroundColor,
      borderRadius: "8px",
      opacity: 0.9,
      color: "white",
      border: "1px solid #fff",
      padding: "2px 4px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
    };
    
    if (duration <= 0) {
      style.minHeight = 30;
    }
    
    return { style };
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Header title="Admin Calendar" subtitle="View All Events: Past, Present, and Future" />
        <Button 
          variant="contained" 
          color="secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh Events
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6" style={{ backgroundColor: colors.primary[400] }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
              agenda: { event: CustomEvent },
            }}
            views={["month", "week", "day", "agenda"]}
            dayLayoutAlgorithm="no-overlap"
            min={minTime}
            max={maxTime}
            messages={{ agenda: "Agenda" }}
            formats={{
              eventTimeRangeFormat: () => "",
            }}
            onSelectEvent={onSelectEvent}
            popup={true}
            className={`rounded-lg calendar-container ${theme.palette.mode}`}
          />
        </div>
      </div>
    </>
  );
};

// Helper functions for date handling
const parseDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(`${dateStr}T${timeStr}`);
};

const calculateEndTime = (startDate: Date, durationStr: string): Date => {
  const durationParts = durationStr.split(' ');
  const durationValue = parseFloat(durationParts[0]);
  const durationUnit = durationParts[1].toLowerCase();
  
  const endDate = new Date(startDate);
  
  if (durationUnit.includes('hour')) {
    endDate.setHours(endDate.getHours() + durationValue);
  } else if (durationUnit.includes('minute')) {
    endDate.setMinutes(endDate.getMinutes() + durationValue);
  }
  
  return endDate;
};

// Format event data from API to calendar-compatible format
const formatEvents = (eventsData: EventType[]): CalendarEvent[] => {
  return eventsData.map((event: EventType) => {
    const startDate = parseDateTime(event.date, event.startTime);
    const endDate = calculateEndTime(startDate, event.duration);
    
    return {
      id: event.id,
      title: event.title,
      start: startDate,
      end: endDate,
      description: event.description,
      location: event.location,
      hostedBy: event.hostedBy
    };
  });
};

// Main Component
const AdminCalendar: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventsData = await getAllEvents();
      const formattedEvents = formatEvents(eventsData);
      
      setEvents(formattedEvents);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };

  const getEventStyle = (event: CalendarEvent) => {
    return {
      backgroundColor: EVENT_COLORS[Number(event.id) % EVENT_COLORS.length]
    };
  };

  return (
    <Box m="20px">
      <CalendarContainer 
        events={events}
        colors={colors}
        loading={loading}
        error={error}
        onRefresh={fetchEvents}
        onSelectEvent={handleSelectEvent}
      />

      <EventDetailsDialog
        open={openDialog}
        selectedEvent={selectedEvent}
        colors={colors}
        onClose={handleCloseDialog}
        getEventStyle={getEventStyle}
      />
    </Box>
  );
};

export default AdminCalendar;