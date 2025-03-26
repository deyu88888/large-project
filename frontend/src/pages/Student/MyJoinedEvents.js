import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { CircularProgress } from "@mui/material";
import EventCard from "../../components/EventCard";
const MyJoinedEvents = () => {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await apiClient.get("/api/events/joined/");
                setEvents(response.data || []);
            }
            catch (error) {
                console.error("Error fetching joined events:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);
    const handleViewEvent = (eventId) => {
        navigate(`/student/event/${eventId}`);
    };
    return (_jsx("div", { style: {
            padding: "2rem",
            backgroundColor: isLight ? "#fcfcfc" : colours.primary[500],
            minHeight: "100vh",
        }, children: _jsxs("div", { style: { maxWidth: "1400px", margin: "0 auto" }, children: [_jsxs("header", { style: { textAlign: "center", marginBottom: "2rem" }, children: [_jsx("h1", { style: {
                                color: colours.grey[100],
                                fontSize: "2.25rem",
                                fontWeight: 700,
                            }, children: "My Events" }), _jsx("p", { style: { color: colours.grey[300], fontSize: "1.125rem" }, children: "Events you've RSVP'd to" })] }), loading ? (_jsxs("div", { style: { textAlign: "center", padding: "3rem" }, children: [_jsx(CircularProgress, {}), _jsx("p", { style: { color: colours.grey[300], marginTop: "1rem" }, children: "Loading events..." })] })) : events.length === 0 ? (_jsx("div", { style: { textAlign: "center", padding: "3rem" }, children: _jsx("p", { style: { color: colours.grey[300] }, children: "You haven\u2019t joined any events yet." }) })) : (_jsx("div", { style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "1.5rem",
                    }, children: events.map((event) => (_jsx(EventCard, { event: event, followingsAttending: [], isLight: isLight, colors: colours, onViewEvent: handleViewEvent }, event.id))) }))] }) }));
};
export default MyJoinedEvents;
