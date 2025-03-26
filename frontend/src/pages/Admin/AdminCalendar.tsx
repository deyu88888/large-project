import { useState, useEffect, memo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import {
  Box, CircularProgress, Typography, useTheme, Dialog,
  DialogContent, DialogActions, Button, Alert, Tooltip
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { getAllEvents } from "../../api";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Constants
const EVENT_COLORS = ["#6c5ce7", "#00cec9", "#fd79a8", "#fdcb6e", "#e17055", "#0984e3", "#00b894"];
const localizer = momentLocalizer(moment);

// Custom event component
const CustomEvent = memo(({ event }) => (
  <div className="p-1 overflow-hidden text-ellipsis">
    <strong className="block text-sm whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</strong>
    <span className="block text-xs whitespace-nowrap">
      {moment(event.start).format("LT")} - {moment(event.end).format("LT")}
    </span>
  </div>
));

// Format events
const formatEvents = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(event => {
    try {
      // Determine start date
      let start = event.start ? new Date(event.start) : 
                 event.date && event.startTime ? new Date(`${event.date}T${event.startTime}`) :
                 event.startDate ? new Date(event.startDate) : 
                 event.start_date ? new Date(event.start_date) :
                 event.event_date ? new Date(event.event_date) :
                 event.created_at ? new Date(event.created_at) :
                 event.updated_at ? new Date(event.updated_at) : new Date();
      
      if (isNaN(start.getTime())) start = new Date();
      
      // Determine end date
      let end = event.end ? new Date(event.end) :
               event.endDate ? new Date(event.endDate) :
               event.end_date ? new Date(event.end_date) :
               new Date(start.getTime() + 3600000); // Default: 1 hour
      
      // Create event object
      return {
        id: event.id || Math.random().toString(36).slice(2, 9),
        title: event.title || event.name || 'Untitled Event',
        start,
        end,
        description: event.description || '',
        location: event.location || event.venue || '',
        hostedBy: event.hostedBy || event.society_id || event.organizer || ''
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
};

// Main Component
const AdminCalendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moreEvents, setMoreEvents] = useState({ open: false, data: [] });

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getAllEvents();
        setEvents(formatEvents(data || []));
      } catch (err) {
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Event handlers
  const handleSelectEvent = useCallback(event => {
    setSelectedEvent(event);
    setDialogOpen(true);
  }, []);
  
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedEvent(null);
  }, []);
  
  const handleShowMore = useCallback(events => {
    setMoreEvents({ open: true, data: events });
  }, []);
  
  const handleCloseMoreEvents = useCallback(() => {
    setMoreEvents(prev => ({ ...prev, open: false }));
  }, []);

  // Event styling
  const eventStyleGetter = useCallback(event => ({
    style: {
      backgroundColor: EVENT_COLORS[Number(event.id) % EVENT_COLORS.length],
      borderRadius: "8px",
      color: "white",
      border: "none",
      boxShadow: "0 2px 4px rgba(0,0,0,0.25)"
    }
  }), []);

  // Event components
  const components = {
    event: CustomEvent,
    eventWrapper: ({ event, children }) => (
      <Tooltip title={`${event.title}: ${moment(event.start).format('LT')} - ${moment(event.end).format('LT')}`} placement="top">
        <div>{children}</div>
      </Tooltip>
    ),
    showMore: ({ events }) => (
      <button
        type="button"
        onClick={e => { 
          e.stopPropagation();
          handleShowMore(events);
        }}
        className="text-xs text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-full w-full text-center"
      >
        +{events.length} more
      </button>
    )
  };

  // More events modal content
  const renderMoreEventsModal = () => {
    if (!moreEvents.data.length) return null;
    
    const sorted = [...moreEvents.data].sort((a, b) => a.start.getTime() - b.start.getTime());
    const date = moreEvents.data[0]?.start ? moment(moreEvents.data[0].start).format('MMM D, YYYY') : '';
    
    // Group by time of day
    const timeGroups = [
      { title: "MORNING", items: sorted.filter(e => e.start.getHours() < 12) },
      { title: "AFTERNOON", items: sorted.filter(e => e.start.getHours() >= 12 && e.start.getHours() < 17) },
      { title: "EVENING", items: sorted.filter(e => e.start.getHours() >= 17) }
    ];
    
    return (
      <Dialog
        open={moreEvents.open}
        onClose={handleCloseMoreEvents}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: '12px' } }}
      >
        <div className="p-3 border-b">
          <Typography variant="h6">{moreEvents.data.length} Events on {date}</Typography>
        </div>
        <DialogContent>
          <div className="max-h-96 overflow-y-auto">
            {timeGroups.map((group, i) => 
              group.items.length ? (
                <div key={i} className="mb-3">
                  <Typography className="text-xs font-medium opacity-75 mb-1">{group.title}</Typography>
                  <div className="space-y-1">
                    {group.items.map((event, idx) => {
                      const bgColor = EVENT_COLORS[Number(event.id) % EVENT_COLORS.length];
                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            handleSelectEvent(event);
                            handleCloseMoreEvents();
                          }}
                          className="p-2 rounded-md cursor-pointer hover:bg-opacity-70 flex items-center"
                          style={{ backgroundColor: `${bgColor}15` }}
                        >
                          <div className="w-2 h-full min-h-8 rounded-sm mr-2" style={{ backgroundColor: bgColor }}></div>
                          <div className="flex-1 overflow-hidden">
                            <Typography variant="subtitle2" noWrap>{event.title}</Typography>
                            <Typography variant="caption" className="block opacity-75">
                              {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                            </Typography>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoreEvents}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Event details modal content
  const renderEventDetailsModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: colors.primary[400],
            color: colors.grey[100],
            borderRadius: '16px'
          }
        }}
      >
        <div 
          className="p-4 text-white"
          style={{
            backgroundColor: EVENT_COLORS[Number(selectedEvent.id) % EVENT_COLORS.length]
          }}
        >
          <Typography variant="h6">{selectedEvent.title}</Typography>
        </div>
        <DialogContent className="p-4">
          <div className="space-y-3">
            <div className="bg-gray-100/10 p-3 rounded-lg">
              <Typography variant="subtitle1" fontWeight="bold">Date & Time:</Typography>
              <Typography variant="body1">
                {moment(selectedEvent.start).format('ddd, MMM D, YYYY')} · 
                {moment(selectedEvent.start).format('h:mm A')} - 
                {moment(selectedEvent.end).format('h:mm A')}
              </Typography>
            </div>
            
            {selectedEvent.location && (
              <div className="bg-gray-100/10 p-3 rounded-lg">
                <Typography variant="subtitle1" fontWeight="bold">Location:</Typography>
                <Typography variant="body1">{selectedEvent.location}</Typography>
              </div>
            )}
            
            {selectedEvent.description && (
              <div className="bg-gray-100/10 p-3 rounded-lg">
                <Typography variant="subtitle1" fontWeight="bold">Description:</Typography>
                <Typography variant="body1">{selectedEvent.description}</Typography>
              </div>
            )}
            
            {selectedEvent.hostedBy && (
              <div className="bg-gray-100/10 p-3 rounded-lg">
                <Typography variant="subtitle1" fontWeight="bold">Hosted By:</Typography>
                <Typography variant="body1">Society ID: {selectedEvent.hostedBy}</Typography>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="p-3">
          <Button onClick={handleCloseDialog} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Header title="Admin Calendar" subtitle="View All Events" />
        <Button 
          variant="contained" 
          color="secondary"
          onClick={() => window.location.reload()}
          sx={{ borderRadius: '8px' }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      <div className="bg-white/90 rounded-xl p-6" style={{ backgroundColor: colors.primary[400] }}>
        <style dangerouslySetInnerHTML={{__html: `
          .rbc-event { padding: 2px 5px; border-radius: 6px; border: none; }
          .rbc-event:hover { transform: translateY(-1px); box-shadow: 0 3px 5px rgba(0,0,0,0.2); }
          .rbc-month-view { border-radius: 10px; overflow: hidden; }
          .rbc-day-bg:hover { background-color: rgba(0,0,0,0.03); }
          .rbc-today { background-color: rgba(66, 153, 225, 0.08); }
        `}} />
        
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          components={components}
          views={["month", "week", "day", "agenda"]}
          min={new Date().setHours(6, 0, 0)}
          max={new Date().setHours(23, 0, 0)}
          onSelectEvent={handleSelectEvent}
          eventLimit={5}
          popup={false}
          drilldownView="day"
        />
      </div>

      {renderEventDetailsModal()}
      {renderMoreEventsModal()}
    </Box>
  );
};

export default AdminCalendar;