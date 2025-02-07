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
    <div className="relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

export default EventCalendar;