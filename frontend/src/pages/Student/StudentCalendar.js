import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import { Box, CircularProgress, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Alert, IconButton } from "@mui/material";
import { FaCalendarCheck, FaCalendarTimes, FaMapMarkerAlt, FaUsers, FaInfoCircle, FaSync } from "react-icons/fa";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import "react-big-calendar/lib/css/react-big-calendar.css";
const localizer = momentLocalizer(moment);
// interface SocietyData {
//   id: number;
//   name: string;
// }
// interface EventData {
//   id: number;
//   title: string;
//   description?: string;
//   date: string;
//   start_time: string;
//   duration: string;
//   location?: string;
//   hosted_by: number;
//   societyName?: string;
//   rsvp?: boolean;
// }
// interface CalendarEvent {
//   id: number;
//   title: string;
//   start: Date;
//   end: Date;
//   description: string;
//   location: string;
//   societyId: number;
//   societyName: string;
//   rsvp: boolean;
// }
// interface StudentCalendarProps {
//   societies?: SocietyData[];
//   userEvents?: EventData[];
//   timezone?: string;
// }
function StudentCalendar({ societies = [], userEvents, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, }) {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const societyIds = useMemo(() => societies.map(s => s.id), [societies]);
    useEffect(() => {
        if (!userEvents)
            return;
        setLoading(true);
        try {
            const filtered = userEvents.filter(e => societyIds.includes(e.hosted_by));
            transformEvents(filtered);
        }
        catch (err) {
            console.error("Error transforming userEvents:", err);
            setError("Failed to load events. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }, [userEvents, societyIds]);
    useEffect(() => {
        if (userEvents)
            return;
        fetchEvents();
    }, [userEvents, societyIds]);
    async function fetchEvents() {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get("/api/events/");
            if (!response.data) {
                throw new Error("No data received from API");
            }
            const filtered = response.data.filter(e => societyIds.includes(e.hosted_by));
            transformEvents(filtered);
        }
        catch (err) {
            console.error("Error fetching events:", err);
            setError("Failed to load events. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }
    function transformEvents(eventsData) {
        const formatted = eventsData.map(event => {
            const startDate = parseDateTime(event.date, event.start_time, timezone);
            const endDate = calculateEndTime(startDate, event.duration);
            const society = societies.find(s => s.id === event.hosted_by);
            const societyName = society ? society.name : event.societyName || `Society ${event.hosted_by}`;
            return {
                id: event.id,
                title: event.title,
                start: startDate,
                end: endDate,
                description: event.description || "",
                location: event.location || "",
                societyId: event.hosted_by,
                societyName,
                rsvp: event.rsvp || false,
            };
        });
        setEvents(formatted);
    }
    function parseDateTime(dateStr, timeStr, tz) {
        if (!dateStr || !timeStr) {
            throw new Error("Invalid date or time");
        }
        const dateTime = moment.tz(`${dateStr}T${timeStr}`, tz);
        return dateTime.toDate();
    }
    function calculateEndTime(startDate, durationStr) {
        const endDate = new Date(startDate);
        const hourRegex = /(\d+(?:\.\d+)?)\s*(?:hour|hr|h)s?/i;
        const minuteRegex = /(\d+(?:\.\d+)?)\s*(?:minute|min|m)s?/i;
        let hours = 0;
        let minutes = 0;
        const hourMatch = durationStr.match(hourRegex);
        if (hourMatch && hourMatch[1]) {
            hours = parseFloat(hourMatch[1]);
        }
        const minuteMatch = durationStr.match(minuteRegex);
        if (minuteMatch && minuteMatch[1]) {
            minutes = parseFloat(minuteMatch[1]);
        }
        if (!hourMatch && !minuteMatch) {
            const numericValue = parseFloat(durationStr);
            if (!isNaN(numericValue)) {
                hours = numericValue;
            }
            else {
                hours = 1;
            }
        }
        endDate.setHours(endDate.getHours() + Math.floor(hours));
        endDate.setMinutes(endDate.getMinutes() + Math.round((hours % 1) * 60) + minutes);
        return endDate;
    }
    async function handleRSVP(eventId, isAttending) {
        try {
            setRsvpLoading(true);
            if (isAttending) {
                await apiClient.post("/api/events/rsvp", { event_id: eventId });
            }
            else {
                await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
            }
            setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, rsvp: isAttending } : e)));
            if (selectedEvent && selectedEvent.id === eventId) {
                setSelectedEvent({ ...selectedEvent, rsvp: isAttending });
            }
        }
        catch (error) {
            console.error("Error updating RSVP:", error);
            setError("Failed to update RSVP status. Please try again.");
        }
        finally {
            setRsvpLoading(false);
        }
    }
    function eventStyleGetter(event) {
        const colorOptions = [
            "#6c5ce7",
            "#00cec9",
            "#fd79a8",
            "#fdcb6e",
            "#e17055",
            "#0984e3",
            "#00b894",
        ];
        const colorIndex = Math.abs(event.societyId % colorOptions.length);
        const backgroundColor = colorOptions[colorIndex];
        return {
            style: {
                backgroundColor,
                borderRadius: "8px",
                opacity: 0.9,
                color: "white",
                border: event.rsvp ? "2px solid #00ff00" : "1px solid #fff",
                padding: "2px 4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
            },
        };
    }
    function CustomEvent({ event }) {
        const start = moment(event.start);
        const end = moment(event.end);
        return (_jsxs("div", { className: "p-1", children: [_jsx("strong", { className: "block text-sm", children: event.title }), _jsxs("span", { className: "block text-xs", children: [start.format("LT"), " - ", end.format("LT"), event.rsvp && (_jsxs("span", { className: "ml-2", children: [_jsx(FaCalendarCheck, { size: 10, style: { display: "inline", marginRight: "2px" } }), "RSVP"] }))] })] }));
    }
    function handleSelectEvent(event) {
        setSelectedEvent(event);
        setOpenDialog(true);
    }
    function handleCloseDialog() {
        setOpenDialog(false);
        setSelectedEvent(null);
    }
    const minTime = new Date();
    minTime.setHours(6, 0, 0);
    const maxTime = new Date();
    maxTime.setHours(23, 0, 0);
    const memoizedEvents = useMemo(() => events, [events]);
    return (_jsxs(_Fragment, { children: [error && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, onClose: () => setError(null), children: error })), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "500px", children: _jsx(CircularProgress, { size: 40, sx: { color: colours.blueAccent[500] }, role: "progressbar" }) })) : (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", sx: { color: colours.grey[100] }, children: "My Society Events" }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "caption", sx: { color: colours.grey[300], mr: 2 }, children: ["Timezone: ", timezone] }), _jsx(IconButton, { onClick: fetchEvents, disabled: loading, sx: { color: colours.blueAccent[500] }, title: "Refresh events", children: _jsx(FaSync, {}) })] })] }), memoizedEvents.length === 0 ? (_jsx(Typography, { variant: "body1", align: "center", sx: { color: colours.grey[300], py: 4 }, children: "No events from your societies" })) : (_jsx("div", { className: "relative p-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:shadow-3xl", children: _jsx("div", { className: "bg-white/90 backdrop-blur-sm rounded-3xl p-6", style: { backgroundColor: colours.primary[400] }, children: _jsx(Calendar, { localizer: localizer, events: memoizedEvents, startAccessor: "start", endAccessor: "end", style: { height: 600 }, className: "rounded-lg", eventPropGetter: eventStyleGetter, components: {
                                    event: CustomEvent,
                                    agenda: { event: CustomEvent },
                                }, views: ["month", "week", "day", "agenda"], dayLayoutAlgorithm: "no-overlap", min: minTime, max: maxTime, messages: {
                                    agenda: "Agenda",
                                    noEventsInRange: "No events in this date range from your societies",
                                }, formats: {
                                    eventTimeRangeFormat: () => "",
                                }, onSelectEvent: handleSelectEvent, popup: true, culture: navigator.language }) }) }))] })), _jsx(Dialog, { open: openDialog, onClose: handleCloseDialog, maxWidth: "sm", fullWidth: true, PaperProps: {
                    style: {
                        backgroundColor: colours.primary[400],
                        color: colours.grey[100],
                        borderRadius: "12px",
                    },
                }, children: selectedEvent && (_jsxs(_Fragment, { children: [_jsxs(DialogTitle, { style: {
                                backgroundColor: eventStyleGetter(selectedEvent).style.backgroundColor,
                                color: "#ffffff",
                                borderTopLeftRadius: "12px",
                                borderTopRightRadius: "12px",
                            }, children: [selectedEvent.title, selectedEvent.rsvp && (_jsx(Chip, { icon: _jsx(FaCalendarCheck, { size: 14 }), label: "You're going", size: "small", color: "success", sx: { ml: 2, backgroundColor: "rgba(0,255,0,0.2)" } }))] }), _jsxs(DialogContent, { dividers: true, children: [_jsxs(Box, { mb: 2, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", display: "flex", alignItems: "center", children: [_jsx(FaInfoCircle, { style: { marginRight: "8px" } }), "When:"] }), _jsx(Typography, { variant: "body1", children: moment(selectedEvent.start).format("dddd, MMMM Do YYYY") }), _jsxs(Typography, { variant: "body2", children: [moment(selectedEvent.start).format("h:mm A"), " - ", moment(selectedEvent.end).format("h:mm A"), " ", _jsxs(Typography, { variant: "caption", component: "span", color: "text.secondary", children: ["(", timezone, ")"] })] })] }), selectedEvent.location && (_jsxs(Box, { mb: 2, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", display: "flex", alignItems: "center", children: [_jsx(FaMapMarkerAlt, { style: { marginRight: "8px" } }), "Location:"] }), _jsx(Typography, { variant: "body1", children: selectedEvent.location })] })), selectedEvent.societyName && (_jsxs(Box, { mb: 2, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", display: "flex", alignItems: "center", children: [_jsx(FaUsers, { style: { marginRight: "8px" } }), "Hosted By:"] }), _jsx(Typography, { variant: "body1", children: selectedEvent.societyName })] })), selectedEvent.description && (_jsxs(Box, { mb: 2, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", display: "flex", alignItems: "center", children: [_jsx(FaInfoCircle, { style: { marginRight: "8px" } }), "Description:"] }), _jsx(Typography, { variant: "body1", children: selectedEvent.description })] }))] }), _jsxs(DialogActions, { sx: { p: 2, display: "flex", justifyContent: "space-between" }, children: [_jsx(Button, { onClick: handleCloseDialog, color: "inherit", children: "Close" }), _jsx(Button, { variant: "contained", startIcon: selectedEvent.rsvp ? _jsx(FaCalendarTimes, {}) : _jsx(FaCalendarCheck, {}), onClick: () => handleRSVP(selectedEvent.id, !selectedEvent.rsvp), disabled: rsvpLoading, color: selectedEvent.rsvp ? "error" : "primary", sx: {
                                        backgroundColor: selectedEvent.rsvp ? colours.redAccent[500] : colours.blueAccent[500],
                                        "&:hover": {
                                            backgroundColor: selectedEvent.rsvp
                                                ? colours.redAccent[600]
                                                : colours.blueAccent[600],
                                        },
                                    }, children: rsvpLoading
                                        ? "Updating..."
                                        : selectedEvent.rsvp
                                            ? "Cancel RSVP"
                                            : "RSVP to Event" })] })] })) })] }));
}
export default StudentCalendar;
