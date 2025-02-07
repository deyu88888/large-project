import React from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";

interface EventCalendarProps {
  events: Event[];
}

const localizer = momentLocalizer(moment);

// Custom style getter for events
const eventStyleGetter = (
  _event: Event,
  start: Date,
  end: Date,
  _isSelected: boolean
) => {
  const backgroundColor = "#6c5ce7"; // A refined purple hue
  const style = {
    backgroundColor,
    borderRadius: "8px",
    opacity: 0.9,
    color: "white",
    border: "1px solid #fff",
    padding: "2px 4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
  };
  return { style };
};

// Custom event component for a modern look
const CustomEvent: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <div className="p-1">
      <strong className="block text-sm">{event.title}</strong>
      <span className="text-xs">
        {moment(event.start).format("LT")} – {moment(event.end).format("LT")}
      </span>
    </div>
  );
};

const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  return (
    <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          className="rounded-lg"
          // Apply custom styles to events (including overlapping ones)
          eventPropGetter={eventStyleGetter}
          // Use the custom event component for rendering events
          components={{
            event: CustomEvent,
            agenda: {
              event: CustomEvent,
            },
          }}
          // Enable multiple views including the agenda
          views={["month", "week", "day", "agenda"]}
          // Use "no-overlap" algorithm to prevent messy overlaps in week/day views
          dayLayoutAlgorithm="no-overlap"
          messages={{
            agenda: "Agenda",
          }}
        />
      </div>
    </div>
  );
};

export default EventCalendar;