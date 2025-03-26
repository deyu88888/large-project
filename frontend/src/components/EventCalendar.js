import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
const localizer = momentLocalizer(moment);
// Custom style getter for events
const eventStyleGetter = (_event, start, end, _isSelected) => {
    const backgroundColor = "#6c5ce7"; // A refined purple hue
    // Calculate the duration in minutes
    const duration = (end.getTime() - start.getTime()) / 60000;
    const style = {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "1px solid #fff",
        padding: "2px 4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
        // For very short (or zero duration) events, enforce a minimum height
        minHeight: duration <= 0 ? 30 : undefined,
    };
    return { style };
};
// Custom event component that displays the event title on the first line
// and the start and end times on the second line.
const CustomEvent = ({ event }) => {
    const start = moment(event.start);
    const end = moment(event.end);
    return (_jsxs("div", { className: "p-1", children: [_jsx("strong", { className: "block text-sm", children: event.title }), _jsxs("span", { className: "block text-xs", children: [start.format("LT"), " - ", end.format("LT")] })] }));
};
const EventCalendar = ({ events }) => {
    // Define the visible time range for the day view.
    const minTime = new Date();
    minTime.setHours(8, 0, 0);
    const maxTime = new Date();
    maxTime.setHours(23, 0, 0);
    return (_jsx("div", { className: "relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl", children: _jsx("div", { className: "bg-white/90 backdrop-blur-sm rounded-3xl p-6", children: _jsx(Calendar, { localizer: localizer, events: events, startAccessor: "start", endAccessor: "end", style: { height: 600 }, className: "rounded-lg", 
                // Apply custom styles to events (including overlapping ones)
                eventPropGetter: eventStyleGetter, 
                // Use the custom event component for rendering events
                components: {
                    event: CustomEvent,
                    agenda: { event: CustomEvent },
                }, 
                // Enable multiple views including the agenda
                views: ["month", "week", "day", "agenda"], 
                // Use "no-overlap" algorithm to prevent messy overlaps in week/day views
                dayLayoutAlgorithm: "no-overlap", 
                // Set the visible time range for the day view
                min: minTime, max: maxTime, messages: { agenda: "Agenda" }, 
                // Override the default time range formatting to prevent duplicate time display
                formats: {
                    eventTimeRangeFormat: () => "",
                } }) }) }));
};
export default EventCalendar;
