import { Box, Typography, CircularProgress, useTheme } from "@mui/material";
import EventCalendar from "../components/EventCalendar";
import { useEffect, useState, useRef, useMemo } from "react";
import { getAllEvents } from "../api";
import { tokens } from "../theme/theme";

const eventsCache = {
  data: null,
  timestamp: 0
};

export default function Calendar() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const calendarRef = useRef(null);
  const initialized = useRef(false);
  const requestRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .fc-event, .fc-event-main, .fc-daygrid-event, .fc-timegrid-event {
        transform: none !important;
        transition: none !important;
        animation: none !important;
        scale: none !important;
      }
      .fc-event:hover, .fc-event-main:hover, .fc-daygrid-event:hover, .fc-timegrid-event:hover {
        transform: none !important;
        box-shadow: none !important;
        scale: none !important;
        z-index: 0 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (eventsCache.data && now - eventsCache.timestamp < 5 * 60 * 1000) {
      setEvents(eventsCache.data);
      fetchEvents(false);
    } else {
      fetchEvents(true);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const fetchEvents = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const rawEvents = await getAllEvents();
      
      if (rawEvents && rawEvents.length > 0) {
        requestRef.current = requestAnimationFrame(() => {
          const processedEvents = processEvents(rawEvents);
          
          eventsCache.data = processedEvents;
          eventsCache.timestamp = Date.now();
          
          setEvents(processedEvents);
          setError(null);
        });
      } else {
        setEvents([]);
        setError(null);
      }
    } catch (err) {
      if (!events.length) {
        setError("Failed to load events");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processEvents = useMemo(() => (rawEvents) => {
    return rawEvents
      .map(event => {
        try {
          const timeField = event.startTime || event.start_time || "";
          let startDate;
          
          if (event.date) {
            const dateStr = `${event.date}T${timeField}`;
            startDate = new Date(dateStr);
          } else if (event.start_date || event.startDate) {
            const dateStr = event.start_date || event.startDate;
            startDate = new Date(dateStr);
            
            if (timeField && !dateStr.includes('T') && !dateStr.includes(' ')) {
              startDate.setHours(
                parseInt(timeField.split(':')[0]),
                parseInt(timeField.split(':')[1] || 0),
                parseInt(timeField.split(':')[2] || 0)
              );
            }
          } else {
            startDate = new Date(event.start || event.start_time);
          }
          
          if (isNaN(startDate.getTime())) {
            return null;
          }
          
          let endDate;
          
          if (event.end || event.end_date || event.endDate) {
            endDate = new Date(event.end || event.end_date || event.endDate);
          } else {
            endDate = new Date(startDate);
            
            if (event.duration && event.duration.includes(":")) {
              const [hours, minutes, seconds = 0] = event.duration.split(":").map(Number);
              endDate = new Date(startDate.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
            } else if (event.duration) {
              const durationInMinutes = parseFloat(event.duration);
              if (!isNaN(durationInMinutes)) {
                endDate = new Date(startDate.getTime() + durationInMinutes * 60 * 1000);
              } else {
                endDate = new Date(startDate.getTime() + 3600000);
              }
            } else {
              endDate = new Date(startDate.getTime() + 3600000);
            }
          }
          
          return {
            id: event.id,
            title: event.title,
            start: startDate,
            end: endDate,
            allDay: event.allDay || event.all_day || false,
            color: event.color,
            description: event.description
          };
        } catch (e) {
          return null;
        }
      })
      .filter(event => event !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, []);

  return (
    <Box 
      sx={{ 
        padding: 2, 
        height: "calc(100vh - 120px)",
        overflow: "hidden",
        maxWidth: "100%",
        mx: "auto",
        position: "relative",
        '& .fc-event, & .fc-event-main, & .fc-daygrid-event, & .fc-timegrid-event': {
          transform: 'none !important',
          transition: 'none !important',
          boxShadow: 'none !important',
          scale: 'none !important',
          '&:hover': {
            transform: 'none !important',
            boxShadow: 'none !important',
            scale: 'none !important',
            zIndex: '0 !important'
          },
        }
      }}
    >
      <Box 
        ref={calendarRef}
        sx={{ 
          height: "100%", 
          maxWidth: "100%",
          opacity: error ? 0.3 : 1,
          '& *': {
            transform: 'none !important',
            transition: 'none !important',
          }
        }}
      >
        <EventCalendar 
          events={events} 
          height="100%"
          forceEventDuration={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
        />
      </Box>
      
      {isLoading && !events.length && (
        <Box 
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.1)",
            backdropFilter: "blur(2px)",
            zIndex: 10
          }}
        >
          <CircularProgress size={30} sx={{ color: colors.primary[500] }} />
        </Box>
      )}
      
      {error && (
        <Box 
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) !important",
            padding: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
            boxShadow: 3,
            zIndex: 20,
            maxWidth: "80%",
            textAlign: "center"
          }}
        >
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Box mt={2}>
            <Typography 
              variant="button" 
              sx={{ 
                cursor: "pointer", 
                color: colors.primary[500],
                '&:hover': { textDecoration: "underline" }
              }}
              onClick={() => fetchEvents(true)}
            >
              Retry
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}