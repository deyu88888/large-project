import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme, Box, Typography, Paper, Button, CircularProgress, Grid } from "@mui/material";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { FaRegClock, FaMapMarkerAlt } from "react-icons/fa";
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
//   status: string;
// }
const ViewSocietyEvents = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const { user } = useAuthStore();
    const { society_id, event_type } = useParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [societyName, setSocietyName] = useState("");
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchEvents();
    }, [society_id, event_type]);
    const fetchEvents = async () => {
        if (!society_id) {
            setError("Society ID is missing");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // First fetch society info to get the name
            try {
                const societyResponse = await apiClient.get(`/api/societies/${society_id}`);
                if (societyResponse.data && societyResponse.data.name) {
                    setSocietyName(societyResponse.data.name);
                }
            }
            catch (error) {
                console.error("Error fetching society info:", error);
                // Continue anyway as this is not critical
            }
            // Main events request
            let endpoint = `/api/events?society_id=${society_id}`;
            // Apply filtering based on event_type
            if (event_type === "upcoming-events") {
                endpoint += "&filter=upcoming";
            }
            else if (event_type === "previous-events") {
                endpoint += "&filter=previous";
            }
            else if (event_type === "pending-events") {
                endpoint += "&filter=pending";
            }
            const response = await apiClient.get(endpoint);
            // If we got data back but it's empty
            if (response.data && Array.isArray(response.data) && response.data.length === 0) {
                setEvents([]);
            }
            // If we got actual event data
            else if (response.data && Array.isArray(response.data)) {
                setEvents(response.data);
            }
            // Fallback to the getAllEvents approach used in the dashboard
            else {
                const allEventsResponse = await apiClient.get("/api/events/");
                if (allEventsResponse.data) {
                    const filteredEvents = allEventsResponse.data.filter((event) => event.hosted_by === parseInt(society_id) &&
                        ((event_type === "pending-events" && event.status === "Pending") ||
                            (event_type === "upcoming-events" && event.status === "Approved" && isUpcoming(event.date)) ||
                            (event_type === "previous-events" && event.status === "Approved" && !isUpcoming(event.date)) ||
                            (!event_type)));
                    setEvents(filteredEvents);
                }
            }
        }
        catch (error) {
            console.error("Error fetching events:", error);
            setError("Failed to load events. Please try again later.");
        }
        finally {
            setLoading(false);
        }
    };
    const isUpcoming = (dateStr) => {
        const eventDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    };
    const handleRSVP = async (eventId, isAttending) => {
        try {
            if (isAttending) {
                await apiClient.post("/api/events/rsvp", { event_id: eventId });
            }
            else {
                await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
            }
            // Refresh events after RSVP change
            fetchEvents();
        }
        catch (error) {
            console.error("Error updating RSVP:", error);
        }
    };
    const getPageTitle = () => {
        let title = "";
        if (event_type === "upcoming-events")
            title = "Upcoming Events";
        else if (event_type === "previous-events")
            title = "Previous Events";
        else if (event_type === "pending-events")
            title = "Pending Approval Events";
        else
            title = "All Events";
        if (societyName) {
            return `${societyName} - ${title}`;
        }
        return title;
    };
    return (_jsx(Box, { minHeight: "100vh", bgcolor: colours.primary[500], py: 8, children: _jsxs(Box, { maxWidth: "1920px", mx: "auto", px: 4, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, children: [_jsx(Typography, { variant: "h4", sx: { color: colours.grey[100] }, children: getPageTitle() }), _jsx(Button, { variant: "contained", onClick: () => navigate(-1), sx: {
                                backgroundColor: colours.blueAccent[500],
                                color: colours.grey[100],
                            }, children: "Back" })] }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", py: 8, children: _jsx(CircularProgress, { size: 48, style: { color: colours.grey[100] } }) })) : error ? (_jsx(Paper, { elevation: 3, sx: {
                        backgroundColor: colours.primary[400],
                        border: `1px solid ${colours.grey[800]}`,
                        p: 3,
                    }, children: _jsx(Typography, { variant: "h6", sx: { color: colours.redAccent[500], textAlign: "center" }, children: error }) })) : events.length === 0 ? (_jsx(Paper, { elevation: 3, sx: {
                        backgroundColor: colours.primary[400],
                        border: `1px solid ${colours.grey[800]}`,
                        p: 3,
                    }, children: _jsx(Typography, { variant: "h6", sx: { color: colours.grey[300], textAlign: "center" }, children: "No events found." }) })) : (_jsx(Grid, { container: true, spacing: 3, children: events.map((event) => (_jsx(Grid, { item: true, xs: 12, md: 6, lg: 4, children: _jsxs(Paper, { elevation: 2, sx: {
                                backgroundColor: colours.primary[400],
                                border: `1px solid ${colours.grey[800]}`,
                                p: 2,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }, children: [_jsxs(Box, { flex: "1", children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", sx: { color: colours.grey[100] }, children: event.title }), _jsx(Box, { px: 1, py: 0.5, borderRadius: "4px", bgcolor: event.status === "Approved"
                                                        ? colours.greenAccent[500]
                                                        : event.status === "Pending"
                                                            ? colours.orangeAccent[500] || colours.yellowAccent[500]
                                                            : colours.redAccent[500], color: colours.primary[500], children: _jsx(Typography, { variant: "caption", children: event.status }) })] }), event.description && (_jsx(Typography, { variant: "body2", sx: {
                                                color: colours.grey[300],
                                                mb: 2,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: "vertical",
                                            }, children: event.description })), _jsxs(Box, { display: "flex", alignItems: "center", mt: 1, children: [_jsx(FaRegClock, { style: { marginRight: 8, color: colours.grey[300] } }), _jsxs(Typography, { variant: "body2", sx: { color: colours.grey[300] }, children: [event.date, " ", event.start_time && `at ${event.start_time}`, event.duration && ` (${event.duration})`] })] }), event.location && (_jsxs(Box, { display: "flex", alignItems: "center", mt: 1, children: [_jsx(FaMapMarkerAlt, { style: { marginRight: 8, color: colours.grey[300] } }), _jsx(Typography, { variant: "body2", sx: { color: colours.grey[300] }, children: event.location })] }))] }), event.status === "Approved" && event.rsvp !== undefined && isUpcoming(event.date) && (_jsx(Button, { fullWidth: true, variant: "contained", onClick: () => handleRSVP(event.id, !event.rsvp), sx: {
                                        mt: 2,
                                        backgroundColor: event.rsvp
                                            ? colours.grey[700]
                                            : colours.blueAccent[500],
                                        color: colours.grey[100],
                                    }, children: event.rsvp ? "Cancel RSVP" : "RSVP Now" }))] }) }, event.id))) }))] }) }));
};
export default ViewSocietyEvents;
