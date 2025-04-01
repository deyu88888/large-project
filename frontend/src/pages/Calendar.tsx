import { useState, useEffect, memo, useCallback, useRef } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar"; // Added View import
import moment from "moment";
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Tooltip,
} from "@mui/material";
import Header from "../components/Header";
import { tokens } from "../theme/theme";
import { getAllEvents } from "../api";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  CalendarEvent,
  CustomEventProps,
  MoreEventsState,
  TimeGroup,
  EventWrapperProps,
  ShowMoreProps,
  EVENT_COLORS
} from "../types/admin/AdminCalendar";

const localizer = momentLocalizer(moment);

const eventsCache = {
  data: null,
  timestamp: 0
};

const CustomEvent = memo(({ event }: CustomEventProps) => (
  <div className="p-1 overflow-hidden text-ellipsis">
    <strong className="block text-sm whitespace-nowrap overflow-hidden text-ellipsis">
      {event.title}
    </strong>
    <span className="block text-xs whitespace-nowrap">
      {moment(event.start).format("LT")} - {moment(event.end).format("LT")}
    </span>
  </div>
));

const formatEvents = (data: any): CalendarEvent[] => {
  if (!Array.isArray(data)) return [];

  return data
    .map((event) => {
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
          startDate = new Date(event.start || event.start_time || event.event_date || event.created_at || event.updated_at || new Date());
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
          id: event.id || Math.random().toString(36).slice(2, 9),
          title: event.title || event.name || "Untitled Event",
          start: startDate,
          end: endDate,
          description: event.description || "",
          location: event.location || event.venue || "",
          hostedBy: event.hostedBy || event.society_id || event.organizer || "",
        };
      } catch (e) {
        console.error("Error processing event:", e);
        return null;
      }
    })
    .filter(Boolean) as CalendarEvent[];
};

const AdminCalendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moreEvents, setMoreEvents] = useState<MoreEventsState>({ 
    open: false, 
    data: [] 
  });
  // Fix: Changed the type from string to View
  const [currentView, setCurrentView] = useState<View>('month');

  const requestRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleShowMore = useCallback((eventsList: CalendarEvent[]) => {
    console.log("Show more clicked with", eventsList.length, "events");
    setMoreEvents({ open: true, data: eventsList });
  }, []);

  const handleCloseMoreEvents = useCallback(() => {
    setMoreEvents((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchEvents = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      console.log("Fetching events...");
      const rawEvents = await getAllEvents();
      console.log("Received events:", rawEvents?.length || 0);
      
      if (rawEvents && rawEvents.length > 0) {
        requestRef.current = requestAnimationFrame(() => {
          const processedEvents = formatEvents(rawEvents);
          console.log("Processed events:", processedEvents.length);
          
          eventsCache.data = processedEvents;
          eventsCache.timestamp = Date.now();
          
          setEvents(processedEvents);
          setError(null);
        });
      } else {
        console.log("No events found or empty array returned");
        setEvents([]);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      
      if (!events.length) {
        setError("Failed to load events. Please try again.");
      }
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (eventsCache.data && now - eventsCache.timestamp < 5 * 60 * 1000) {
      setEvents(eventsCache.data);
      fetchEvents(false);
    } else {
      fetchEvents(true);
    }
    
    refreshTimerRef.current = setInterval(() => {
      fetchEvents(false);
    }, 5 * 60 * 1000);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchEvents]);

  // Find events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    if (!date || isNaN(date.getTime())) return [];
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return events.filter(event => {
      if (!event || !event.start) return false;
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  }, [events]);

  // Post-render function to add "show more" buttons
  useEffect(() => {
    if (events.length === 0 || currentView !== 'month') return;

    // Clear any existing plus buttons
    document.querySelectorAll('.custom-plus-button').forEach(el => el.remove());
    
    // Function to add plus buttons
    const addPlusButtons = () => {
      // Get all day cells
      const days = document.querySelectorAll('.rbc-day-bg');
      
      days.forEach(day => {
        // Get the date from the cell
        const dateNumber = day.querySelector('.rbc-date-cell')?.textContent?.trim();
        if (!dateNumber) return;
        
        // Get the current month view date from calendar header
        const headerText = document.querySelector('.rbc-toolbar-label')?.textContent;
        if (!headerText) return;
        
        // Parse month and year
        const [monthName, yearStr] = headerText.split(' ');
        if (!monthName || !yearStr) return;
        
        const monthIndex = moment().month(monthName).month();
        const year = parseInt(yearStr);
        
        // Create date for this cell
        const cellDate = new Date(year, monthIndex, parseInt(dateNumber));
        
        // Find events for this date
        const dayEvents = getEventsForDate(cellDate);
        
        // If multiple events, add "plus" button
        if (dayEvents.length > 1) {
          // Create button element
          const plusButton = document.createElement('button');
          plusButton.className = 'custom-plus-button';
          plusButton.textContent = `+${dayEvents.length} events`;
          
          // Add click handler
          plusButton.onclick = (e) => {
            e.stopPropagation();
            handleShowMore(dayEvents);
          };
          
          // Add to day cell
          day.appendChild(plusButton);
        }
      });
    };
    
    // Run after a slight delay to ensure calendar is rendered
    const timer = setTimeout(addPlusButtons, 100);
    
    // Add button when changing months or views
    const calendarElement = calendarRef.current;
    if (calendarElement) {
      const observer = new MutationObserver(() => {
        setTimeout(addPlusButtons, 100);
      });
      
      observer.observe(calendarElement, {
        childList: true,
        subtree: true
      });
      
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
    
    return () => clearTimeout(timer);
  }, [events, currentView, getEventsForDate, handleShowMore]);

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: EVENT_COLORS[Number(event.id) % EVENT_COLORS.length],
        borderRadius: "8px",
        color: "white",
        border: "none",
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      },
    }),
    []
  );

  const components = {
    event: CustomEvent,
    eventWrapper: ({ event, children }: EventWrapperProps) => (
      <Tooltip
        title={`${event.title}: ${moment(event.start).format("LT")} - ${moment(
          event.end
        ).format("LT")}`}
        placement="top"
      >
        <div>{children}</div>
      </Tooltip>
    ),
  };

  // Fix: Updated handleViewChange to accept a View type parameter
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const renderMoreEventsModal = () => {
    if (!moreEvents.data.length) return null;

    const sorted = [...moreEvents.data].sort(
      (a: CalendarEvent, b: CalendarEvent) => a.start.getTime() - b.start.getTime()
    );
    const date = moreEvents.data[0]?.start
      ? moment(moreEvents.data[0].start).format("MMM D, YYYY")
      : "";

    const timeGroups: TimeGroup[] = [
      {
        title: "MORNING",
        items: sorted.filter((e) => e.start.getHours() < 12),
      },
      {
        title: "AFTERNOON",
        items: sorted.filter(
          (e) => e.start.getHours() >= 12 && e.start.getHours() < 17
        ),
      },
      {
        title: "EVENING",
        items: sorted.filter((e) => e.start.getHours() >= 17),
      },
    ];

    return (
      <Dialog
        open={moreEvents.open}
        onClose={handleCloseMoreEvents}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          style: { 
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          } 
        }}
      >
        <div className="p-4 border-b" style={{ backgroundColor: colors.primary[500], color: 'white' }}>
          <Typography variant="h6" style={{ fontWeight: 600 }}>
            Events on {date}
          </Typography>
          <Typography variant="caption" style={{ opacity: 0.9 }}>
            {moreEvents.data.length} events scheduled
          </Typography>
        </div>
        <DialogContent style={{ padding: 0 }}>
          <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {timeGroups.map((group, i) =>
              group.items.length ? (
                <div key={i} className="mb-4">
                  <div className="px-4 py-2" style={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
                    <Typography className="text-xs font-medium" style={{ letterSpacing: '1px' }}>
                      {group.title}
                    </Typography>
                  </div>
                  <div>
                    {group.items.map((event, idx) => {
                      const bgColor = EVENT_COLORS[Number(event.id) % EVENT_COLORS.length];
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            handleSelectEvent(event);
                            handleCloseMoreEvents();
                          }}
                          className="p-3 cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                          style={{ borderLeft: `4px solid ${bgColor}` }}
                        >
                          <div className="flex items-start">
                            <div className="flex-1 overflow-hidden">
                              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                                {event.title}
                              </Typography>
                              <div className="flex items-center mt-1">
                                <Typography
                                  variant="caption"
                                  className="block mr-3"
                                  style={{ color: colors.grey[500] }}
                                >
                                  {moment(event.start).format("h:mm A")} - {moment(event.end).format("h:mm A")}
                                </Typography>
                                
                                {event.location && (
                                  <Typography
                                    variant="caption"
                                    className="block"
                                    style={{ color: colors.grey[500] }}
                                  >
                                    @ {event.location}
                                  </Typography>
                                )}
                              </div>
                              
                              {event.description && (
                                <Typography
                                  variant="body2"
                                  className="mt-2 line-clamp-2"
                                  style={{ 
                                    color: colors.grey[500],
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {event.description}
                                </Typography>
                              )}
                            </div>
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
        <DialogActions className="p-3">
          <Button 
            onClick={handleCloseMoreEvents} 
            variant="contained" 
            sx={{ 
              borderRadius: "8px", 
              backgroundColor: colors.primary[500],
              '&:hover': { backgroundColor: colors.primary[600] }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

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
            borderRadius: "16px",
          },
        }}
      >
        <div
          className="p-4 text-white"
          style={{
            backgroundColor:
              EVENT_COLORS[Number(selectedEvent.id) % EVENT_COLORS.length],
          }}
        >
          <Typography variant="h6">{selectedEvent.title}</Typography>
        </div>
        <DialogContent className="p-4">
          <div className="space-y-3">
            <div className="bg-gray-100/10 p-3 rounded-lg">
              <Typography variant="subtitle1" fontWeight="bold">
                Date & Time:
              </Typography>
              <Typography variant="body1">
                {moment(selectedEvent.start).format("ddd, MMM D, YYYY")} ·{" "}
                {moment(selectedEvent.start).format("h:mm A")} -{" "}
                {moment(selectedEvent.end).format("h:mm A")}
              </Typography>
            </div>

            {selectedEvent.location && (
              <div className="bg-gray-100/10 p-3 rounded-lg">
                <Typography variant="subtitle1" fontWeight="bold">
                  Location:
                </Typography>
                <Typography variant="body1">
                  {selectedEvent.location}
                </Typography>
              </div>
            )}

            {selectedEvent.description && (
              <div className="bg-gray-100/10 p-3 rounded-lg">
                <Typography variant="subtitle1" fontWeight="bold">
                  Description:
                </Typography>
                <Typography variant="body1">
                  {selectedEvent.description}
                </Typography>
              </div>
            )}

            {selectedEvent.hostedBy && (
              <div className="bg-gray-100/10 p-3 rounded-lg">
                <Typography variant="subtitle1" fontWeight="bold">
                  Hosted By:
                </Typography>
                <Typography variant="body1">
                  Society ID: {selectedEvent.hostedBy}
                </Typography>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="p-3">
          <Button onClick={handleCloseDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box m="30px">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Header title="View All Scheduled Events!" subtitle="" />
        <Button
          variant="contained"
          color="secondary"
          onClick={() => fetchEvents(true)}
          sx={{ borderRadius: "8px" }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      <div
        ref={calendarRef}
        className="bg-white/90 rounded-xl p-6"
        style={{ 
          backgroundColor: colors.primary[400],
          opacity: error ? 0.3 : 1
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .rbc-event { 
            padding: 2px 5px; 
            border-radius: 6px; 
            border: none;
            margin-bottom: 2px;
          }
          .rbc-event:hover { transform: translateY(-1px); box-shadow: 0 3px 5px rgba(0,0,0,0.2); }
          .rbc-month-view { border-radius: 10px; overflow: hidden; }
          .rbc-day-bg:hover { background-color: rgba(0,0,0,0.03); }
          .rbc-today { background-color: rgba(66, 153, 225, 0.08); }
          
          /* Day cell styles */
          .rbc-day-bg {
            position: relative;
            min-height: 100px;
          }
          
          /* Custom plus button */
          .custom-plus-button {
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            color: rgb(37, 99, 235);
            background: rgba(37, 99, 235, 0.1);
            font-weight: 600;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            z-index: 100;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .custom-plus-button:hover {
            background: rgba(37, 99, 235, 0.2);
            transform: translateX(-50%) translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          
          .custom-plus-button:active {
            transform: translateX(-50%) translateY(0);
          }
          
          /* Fix positioning issues */
          .rbc-month-row {
            overflow: visible !important;
          }
          
          .rbc-month-view .rbc-row-content {
            margin-bottom: 25px;
          }
          
          /* Hide default show more buttons */
          .rbc-row-segment a.rbc-show-more {
            display: none !important;
          }
        `,
          }}
        />

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          components={components}
          views={["month", "week", "day", "agenda"]}
          view={currentView}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          popup={false}
          drilldownView={null}
        />
      </div>

      {loading && (
        <Box 
          sx={{
            position: "absolute",
            top: "115%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10
          }}
        >
          <CircularProgress size={50} sx={{ color: colors.primary[500] }} />
        </Box>
      )}

      {renderEventDetailsModal()}
      {renderMoreEventsModal()}
    </Box>
  );
};

export default AdminCalendar;