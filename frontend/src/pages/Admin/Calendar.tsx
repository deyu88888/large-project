import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { formatDate } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Box, List, ListItem, ListItemText, Typography, useTheme } from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date | null;
  end?: Date | null;
}

const eventList: CalendarEvent[] = [
  { id: "1", title: "Meeting with Team", start: "2025-02-05" },
  { id: "2", title: "Project Deadline", start: "2025-02-10" },
  { id: "3", title: "Weekly Check-in", start: "2025-02-12" },
];

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState<CalendarEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<CalendarEvent[]>(eventList);

  const handleDateClick = (selected: any) => {
    const filteredEvents = availableEvents.filter((event) => event.start === selected.dateStr);
    if (filteredEvents.length > 0) {
      const eventTitles = filteredEvents.map((e) => e.title).join("\n");
      const chosenEvent = prompt(`Available events:\n${eventTitles}\n\nEnter the name of the event you want to schedule:`);
      const selectedEvent = filteredEvents.find((e) => e.title === chosenEvent);
      if (selectedEvent) {
        setCurrentEvents((prev) => [...prev, { id: selectedEvent.id, title: selectedEvent.title, start: selectedEvent.start }]);
        setAvailableEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
      }
    } else {
      alert("No available events on this date.");
    }
  };

  const handleEventClick = (selected: any) => {
    if (window.confirm(`Are you sure you want to remove the event '${selected.event.title}'?`)) {
      selected.event.remove();
      setAvailableEvents((prev) => [
        ...prev,
        {
          id: selected.event.id,
          title: selected.event.title,
          start: selected.event.startStr,
        },
      ]);
    }
  };

  return (
    <Box m="20px" display={"flex"} justifyContent={"space-around"}>
      <Header title="Calendar" subtitle="Schedule Available Events" />
      <Box display="flex" justifyContent="space-between">
        <Box
          sx={{
            flex: "1 1 20%",
            backgroundColor: colors.primary[400],
            p: "15px",
            borderRadius: "4px",
          }}
        >
          <Typography variant="h5">Scheduled Events</Typography>
          <List>
            {currentEvents.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: colors.greenAccent[500],
                  margin: "10px 0",
                  borderRadius: "2px",
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={<Typography>Scheduled on: {new Date(event.start).toLocaleDateString()}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            editable={true}
            selectable={true}
            eventsSet={(events) => setCurrentEvents(events)}
            select={handleDateClick}
            eventClick={handleEventClick}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Calendar;