import React from "react";
import { useTheme } from "@mui/material/styles";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";

interface EventCalendarProps {
  events: Event[];
}

const localizer = momentLocalizer(moment);

const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  // Access the MUI theme
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Set background colors based on theme mode
  const bgColor = isDarkMode ? "#141b2d" : "#ffffff"; // Dark mode: navy, Light mode: white
  const calendarBg = isDarkMode ? "#1e293b" : "#f8fafc"; // Dark: slate, Light: soft gray
  const textColor = isDarkMode ? "#ffffff" : "#000000"; // White text in dark mode, black in light mode
  const eventBgColor = isDarkMode ? "#6c5ce7" : "#4f46e5"; // Purple for both, different shades
  const eventTextColor = "#ffffff"; // Keep event text white for readability

  // Custom event styles
  const eventStyleGetter = (
    _event: Event,
    start: Date,
    end: Date,
    _isSelected: boolean
  ) => {
    const duration = (end.getTime() - start.getTime()) / 60000;

    const style = {
      backgroundColor: eventBgColor,
      color: eventTextColor,
      borderRadius: "8px",
      opacity: 0.9,
      border: `1px solid ${textColor}`,
      padding: "2px 4px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
      minHeight: duration <= 0 ? 30 : undefined, // Ensure minimum height for very short events
    };
    return { style };
  };

  // Custom event component for displaying title & time
  const CustomEvent: React.FC<{ event: Event }> = ({ event }) => {
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

  // Define the visible time range for the day view.
  const minTime = new Date();
  minTime.setHours(8, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(23, 0, 0);

  return (
    <div
      className="relative p-1 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="rounded-3xl p-6"
        style={{
          backgroundColor: calendarBg,
          color: textColor,
          boxShadow: isDarkMode ? "0 4px 10px rgba(0,0,0,0.6)" : "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, color: textColor }}
          className="rounded-lg"
          eventPropGetter={eventStyleGetter} // Apply event styles
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
        />
      </div>
    </div>
  );
};

export default EventCalendar;
