import React from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Define the event type for the calendar
interface MyCalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

interface EventCalendarProps {
  events: MyCalendarEvent[]; // Events prop passed to the calendar
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  const localizer = momentLocalizer(moment); // Set up moment as the localizer for react-big-calendar

  return (
    <div className="bg-white shadow p-4 rounded">
      <h2 className="text-lg font-bold mb-4">Event Calendar</h2>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        style={{ height: 500 }}
        className="rounded"
      />
    </div>
  );
};

export default EventCalendar;