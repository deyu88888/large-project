import React from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";

interface EventCalendarProps {
  events: Event[];
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  const localizer = momentLocalizer(moment);

  return (
    <div className="bg-white shadow p-4 rounded">
      <h2 className="text-lg font-bold mb-4">Event Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        className="rounded"
      />
    </div>
  );
};

export default EventCalendar;
