import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, memo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Box, CircularProgress, Typography, useTheme, Dialog, DialogContent, DialogActions, Button, Alert, Tooltip } from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme/theme";
import { getAllEvents } from "../../api";
import "react-big-calendar/lib/css/react-big-calendar.css";
const EVENT_COLORS = ["#6c5ce7", "#00cec9", "#fd79a8", "#fdcb6e", "#e17055", "#0984e3", "#00b894"];
const localizer = momentLocalizer(moment);
const CustomEvent = memo(({ event }) => (_jsxs("div", { className: "p-1 overflow-hidden text-ellipsis", children: [_jsx("strong", { className: "block text-sm whitespace-nowrap overflow-hidden text-ellipsis", children: event.title }), _jsxs("span", { className: "block text-xs whitespace-nowrap", children: [moment(event.start).format("LT"), " - ", moment(event.end).format("LT")] })] })));
const formatEvents = (data) => {
    if (!Array.isArray(data))
        return [];
    return data.map(event => {
        try {
            let start = event.start ? new Date(event.start) :
                event.date && event.startTime ? new Date(`${event.date}T${event.startTime}`) :
                    event.startDate ? new Date(event.startDate) :
                        event.start_date ? new Date(event.start_date) :
                            event.event_date ? new Date(event.event_date) :
                                event.created_at ? new Date(event.created_at) :
                                    event.updated_at ? new Date(event.updated_at) : new Date();
            if (isNaN(start.getTime()))
                start = new Date();
            let end = event.end ? new Date(event.end) :
                event.endDate ? new Date(event.endDate) :
                    event.end_date ? new Date(event.end_date) :
                        new Date(start.getTime() + 3600000);
            return {
                id: event.id || Math.random().toString(36).slice(2, 9),
                title: event.title || event.name || 'Untitled Event',
                start,
                end,
                description: event.description || '',
                location: event.location || event.venue || '',
                hostedBy: event.hostedBy || event.society_id || event.organizer || ''
            };
        }
        catch {
            return null;
        }
    }).filter(Boolean);
};
const AdminCalendar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [moreEvents, setMoreEvents] = useState({ open: false, data: [] });
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const data = await getAllEvents();
                setEvents(formatEvents(data || []));
            }
            catch (err) {
                setError("Failed to load events. Please try again.");
            }
            finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);
    const handleSelectEvent = useCallback(event => {
        setSelectedEvent(event);
        setDialogOpen(true);
    }, []);
    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setSelectedEvent(null);
    }, []);
    const handleShowMore = useCallback(events => {
        setMoreEvents({ open: true, data: events });
    }, []);
    const handleCloseMoreEvents = useCallback(() => {
        setMoreEvents(prev => ({ ...prev, open: false }));
    }, []);
    const eventStyleGetter = useCallback(event => ({
        style: {
            backgroundColor: EVENT_COLORS[Number(event.id) % EVENT_COLORS.length],
            borderRadius: "8px",
            color: "white",
            border: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.25)"
        }
    }), []);
    const components = {
        event: CustomEvent,
        eventWrapper: ({ event, children }) => (_jsx(Tooltip, { title: `${event.title}: ${moment(event.start).format('LT')} - ${moment(event.end).format('LT')}`, placement: "top", children: _jsx("div", { children: children }) })),
        showMore: ({ events }) => (_jsxs("button", { type: "button", onClick: e => {
                e.stopPropagation();
                handleShowMore(events);
            }, className: "text-xs text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-full w-full text-center", children: ["+", events.length, " more"] }))
    };
    const renderMoreEventsModal = () => {
        if (!moreEvents.data.length)
            return null;
        const sorted = [...moreEvents.data].sort((a, b) => a.start.getTime() - b.start.getTime());
        const date = moreEvents.data[0]?.start ? moment(moreEvents.data[0].start).format('MMM D, YYYY') : '';
        const timeGroups = [
            { title: "MORNING", items: sorted.filter(e => e.start.getHours() < 12) },
            { title: "AFTERNOON", items: sorted.filter(e => e.start.getHours() >= 12 && e.start.getHours() < 17) },
            { title: "EVENING", items: sorted.filter(e => e.start.getHours() >= 17) }
        ];
        return (_jsxs(Dialog, { open: moreEvents.open, onClose: handleCloseMoreEvents, maxWidth: "sm", fullWidth: true, PaperProps: { style: { borderRadius: '12px' } }, children: [_jsx("div", { className: "p-3 border-b", children: _jsxs(Typography, { variant: "h6", children: [moreEvents.data.length, " Events on ", date] }) }), _jsx(DialogContent, { children: _jsx("div", { className: "max-h-96 overflow-y-auto", children: timeGroups.map((group, i) => group.items.length ? (_jsxs("div", { className: "mb-3", children: [_jsx(Typography, { className: "text-xs font-medium opacity-75 mb-1", children: group.title }), _jsx("div", { className: "space-y-1", children: group.items.map((event, idx) => {
                                        const bgColor = EVENT_COLORS[Number(event.id) % EVENT_COLORS.length];
                                        return (_jsxs("div", { onClick: () => {
                                                handleSelectEvent(event);
                                                handleCloseMoreEvents();
                                            }, className: "p-2 rounded-md cursor-pointer hover:bg-opacity-70 flex items-center", style: { backgroundColor: `${bgColor}15` }, children: [_jsx("div", { className: "w-2 h-full min-h-8 rounded-sm mr-2", style: { backgroundColor: bgColor } }), _jsxs("div", { className: "flex-1 overflow-hidden", children: [_jsx(Typography, { variant: "subtitle2", noWrap: true, children: event.title }), _jsxs(Typography, { variant: "caption", className: "block opacity-75", children: [moment(event.start).format('h:mm A'), " - ", moment(event.end).format('h:mm A')] })] })] }, idx));
                                    }) })] }, i)) : null) }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: handleCloseMoreEvents, children: "Close" }) })] }));
    };
    const renderEventDetailsModal = () => {
        if (!selectedEvent)
            return null;
        return (_jsxs(Dialog, { open: dialogOpen, onClose: handleCloseDialog, maxWidth: "sm", fullWidth: true, PaperProps: {
                style: {
                    backgroundColor: colors.primary[400],
                    color: colors.grey[100],
                    borderRadius: '16px'
                }
            }, children: [_jsx("div", { className: "p-4 text-white", style: {
                        backgroundColor: EVENT_COLORS[Number(selectedEvent.id) % EVENT_COLORS.length]
                    }, children: _jsx(Typography, { variant: "h6", children: selectedEvent.title }) }), _jsx(DialogContent, { className: "p-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "bg-gray-100/10 p-3 rounded-lg", children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: "Date & Time:" }), _jsxs(Typography, { variant: "body1", children: [moment(selectedEvent.start).format('ddd, MMM D, YYYY'), " \u00B7", moment(selectedEvent.start).format('h:mm A'), " -", moment(selectedEvent.end).format('h:mm A')] })] }), selectedEvent.location && (_jsxs("div", { className: "bg-gray-100/10 p-3 rounded-lg", children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: "Location:" }), _jsx(Typography, { variant: "body1", children: selectedEvent.location })] })), selectedEvent.description && (_jsxs("div", { className: "bg-gray-100/10 p-3 rounded-lg", children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: "Description:" }), _jsx(Typography, { variant: "body1", children: selectedEvent.description })] })), selectedEvent.hostedBy && (_jsxs("div", { className: "bg-gray-100/10 p-3 rounded-lg", children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: "Hosted By:" }), _jsxs(Typography, { variant: "body1", children: ["Society ID: ", selectedEvent.hostedBy] })] }))] }) }), _jsx(DialogActions, { className: "p-3", children: _jsx(Button, { onClick: handleCloseDialog, variant: "contained", children: "Close" }) })] }));
    };
    if (loading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { m: "20px", children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Header, { title: "Admin Calendar", subtitle: "View All Events" }), _jsx(Button, { variant: "contained", color: "secondary", onClick: () => window.location.reload(), sx: { borderRadius: '8px' }, children: "Refresh" })] }), error && (_jsx(Alert, { severity: "error", sx: { mb: 3, borderRadius: '8px' }, children: error })), _jsxs("div", { className: "bg-white/90 rounded-xl p-6", style: { backgroundColor: colors.primary[400] }, children: [_jsx("style", { dangerouslySetInnerHTML: { __html: `
          .rbc-event { padding: 2px 5px; border-radius: 6px; border: none; }
          .rbc-event:hover { transform: translateY(-1px); box-shadow: 0 3px 5px rgba(0,0,0,0.2); }
          .rbc-month-view { border-radius: 10px; overflow: hidden; }
          .rbc-day-bg:hover { background-color: rgba(0,0,0,0.03); }
          .rbc-today { background-color: rgba(66, 153, 225, 0.08); }
        ` } }), _jsx(Calendar, { localizer: localizer, events: events, startAccessor: "start", endAccessor: "end", style: { height: 600 }, eventPropGetter: eventStyleGetter, components: components, views: ["month", "week", "day", "agenda"], min: new Date().setHours(6, 0, 0), max: new Date().setHours(23, 0, 0), onSelectEvent: handleSelectEvent, eventLimit: 5, popup: false, drilldownView: "day" })] }), renderEventDetailsModal(), renderMoreEventsModal()] }));
};
export default AdminCalendar;
