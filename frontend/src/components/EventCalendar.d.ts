import React from "react";
import { Event } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
interface EventCalendarProps {
    events: Event[];
}
declare const EventCalendar: React.FC<EventCalendarProps>;
export default EventCalendar;
