// TODO: to refactor once this is working

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from "react-big-calendar";
import moment from "moment";
import { Box, CircularProgress, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";

import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { getAllEvents } from "../../api";
import { Event as EventType } from "../../types";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from '../../types/admin/calendar';


// Initialize the localizer
const localizer = momentLocalizer(moment);


const AdminCalendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  // Fetch all events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch events from API
      const eventsData = await getAllEvents();
      
      // Transform API event data into CalendarEvent format
      const formattedEvents: CalendarEvent[] = eventsData.map((event: EventType) => {
        // Parse the date and time
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
      
      setEvents(formattedEvents);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for date handling
  const parseDateTime = (dateStr: string, timeStr: string): Date => {
    // Assuming dateStr format is YYYY-MM-DD and timeStr is HH:MM
    return new Date(`${dateStr}T${timeStr}`);
  };

  const calculateEndTime = (startDate: Date, durationStr: string): Date => {
    // Parse the duration (assuming format like "2 hours" or "30 minutes" or "1.5 hours")
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

  // Custom style getter for events
  const eventStyleGetter = (
    event: CalendarEvent,
    start: Date,
    end: Date,
    // isSelected: boolean    // TODO: delete as its not used
  ) => {
    // Generate a deterministic color based on the event ID
    const colorOptions = [
      "#6c5ce7", // Purple
      "#00cec9", // Teal
      "#fd79a8", // Pink
      "#fdcb6e", // Yellow
      "#e17055", // Orange
      "#0984e3", // Blue
      "#00b894", // Green
    ];
    
    // Use the event ID to pick a color (ensures same event always has same color)
    const backgroundColor = colorOptions[Number(event.id) % colorOptions.length];
    
    // Calculate the duration in minutes
    const duration = (end.getTime() - start.getTime()) / 60000;
    
    const style = {
      backgroundColor,
      borderRadius: "8px",
      opacity: 0.9,
      color: "white",
      border: "1px solid #fff",
      padding: "2px 4px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      // For very short events, enforce a minimum height
      minHeight: duration <= 0 ? 30 : undefined,
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

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Header title="Admin Calendar" subtitle="View All Events: Past, Present, and Future" />
        <Button 
          variant="contained" 
          color="secondary"
          onClick={fetchEvents}
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

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
          <CircularProgress />
        </Box>
      ) : (
        <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6" style={{ backgroundColor: colors.primary[400] }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              // className="rounded-lg"
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
              onSelectEvent={handleSelectEvent}
              popup={true}
              // Customize the appearance to match your theme
              // These styles can be adjusted to match your app's theme better
              className={`rounded-lg calendar-container ${theme.palette.mode}`}
            />
          </div>
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: colors.primary[400],
            color: colors.grey[100]
          }
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle
              style={{
                backgroundColor: eventStyleGetter(selectedEvent, selectedEvent.start, selectedEvent.end, false).style.backgroundColor,
                color: "#ffffff"
              }}
            >
              {selectedEvent.title}
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Date & Time:
                </Typography>
                <Typography variant="body1">
                  {moment(selectedEvent.start).format('dddd, MMMM Do YYYY')}
                  {' at '}
                  {moment(selectedEvent.start).format('h:mm A')}
                  {' - '}
                  {moment(selectedEvent.end).format('h:mm A')}
                </Typography>
              </Box>

              {selectedEvent.location && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Location:
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.location}
                  </Typography>
                </Box>
              )}

              {selectedEvent.description && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Description:
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}

              {selectedEvent.hostedBy && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Hosted By:
                  </Typography>
                  <Typography variant="body1">
                    Society ID: {selectedEvent.hostedBy}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="secondary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminCalendar;