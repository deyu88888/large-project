import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { getAllEvents } from "../../api";
import { useNavigate } from "react-router-dom";
import { useTheme, Box, Typography, Paper, Button, Tabs, Tab, CircularProgress, styled, Snackbar, Alert, } from "@mui/material";
import { tokens } from "../../theme/theme";
import { FaCalendarAlt, FaBell, FaUsers, FaUserPlus, FaCogs, FaRegClock, FaNewspaper, FaTrophy, // 1) Add trophy icon import
 } from "react-icons/fa";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import StudentCalendar from "./StudentCalendar";
import SocietyNewsFeed from "./SocietyNewsFeed";
import AwardCard from "../../components/AwardCard";
const CustomTabs = styled(Tabs)(({ theme, activecolor }) => ({
    "& .MuiTabs-indicator": {
        backgroundColor: activecolor,
    },
}));
const StudentDashboard = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const [societies, setSocieties] = useState([]);
    const [events, setEvents] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [awards, setAwards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);
    const { user } = useAuthStore();
    const [student, setStudent] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("error");
    // 2) Add a color for Awards (purpleAccent) and shift the existing color array
    const tabColors = [
        colours.greenAccent?.[500] || "#4CAF50",
        colours.blueAccent?.[500] || "#2196F3",
        colours.redAccent?.[500] || "#F44336",
        colours.purpleAccent?.[500] || "#9C27B0", // New color for Awards tab
        colours.orangeAccent?.[500] || "#FF9800",
    ];
    const allSocieties = useMemo(() => {
        const allSocs = [...societies];
        if (student?.president_of &&
            !allSocs.some((s) => s.id === student.president_of)) {
            allSocs.push({
                id: student.president_of,
                name: student?.president_of_society_name || `Society ${student.president_of}`,
                is_president: true,
            });
        }
        if (student?.vice_president_of_society &&
            !allSocs.some((s) => s.id === student.vice_president_of_society)) {
            allSocs.push({
                id: student.vice_president_of_society,
                name: student?.vice_president_of_society_name ||
                    `Society ${student.vice_president_of_society}`,
                is_vice_president: true,
            });
        }
        return allSocs;
    }, [societies, student]);
    useEffect(() => {
        const callFetchData = async () => {
            await fetchData();
        };
        callFetchData();
    }, [user?.id]);
    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    async function fetchData() {
        setLoading(true);
        try {
            const studentResponse = await apiClient.get("api/user/current");
            setStudent(studentResponse.data);
            console.log("Student data:", studentResponse.data);
            const societiesResponse = await apiClient.get("/api/society/joined");
            setSocieties(societiesResponse.data || []);
            const allEvents = await getAllEvents();
            const transformed = allEvents
                .filter((ev) => ev.status === "Approved")
                .map((ev) => ({
                id: ev.id,
                title: ev.title,
                description: ev.description || "",
                date: ev.date,
                startTime: ev.start_time,
                duration: ev.duration,
                location: ev.location || "",
                hostedBy: ev.hosted_by,
                societyName: ev.societyName || "",
                current_attendees: ev.current_attendees,
                status: ev.status,
            }));
            setEvents(transformed);
            const notificationsResponse = await apiClient.get("/api/notifications/");
            setNotifications(notificationsResponse.data || []);
            const awardsResponse = await apiClient.get("/api/awards/students/");
            setAwards(awardsResponse.data || []);
        }
        catch (error) {
            console.error("Error fetching data:", error);
            const errorMessage = error.response?.data?.error || "An error occurred while fetching data.";
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
        finally {
            setLoading(false);
        }
    }
    const joinSociety = async (societyId) => {
        try {
            await apiClient.post(`/api/society/join/${societyId}`);
            setSnackbarMessage("Successfully joined the society");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            fetchData();
        }
        catch (error) {
            console.error("Error joining society:", error);
            const errorMessage = error.response?.data?.error ||
                "An error occurred while trying to join the society.";
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };
    const handleLeaveSociety = async (societyId) => {
        try {
            await apiClient.delete(`/api/society/leave/${societyId}/`);
            setSnackbarMessage("Successfully left the society");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            fetchData();
        }
        catch (error) {
            console.error("Error leaving society:", error);
            const errorMessage = error.response?.data?.error ||
                "An error occurred while trying to leave the society.";
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };
    async function handleRSVP(eventId, isAttending) {
        try {
            if (isAttending) {
                await apiClient.post("/api/events/rsvp/", { event_id: eventId });
                setSnackbarMessage("Successfully RSVP'd to the event");
            }
            else {
                await apiClient.delete("/api/events/rsvp/", {
                    data: { event_id: eventId },
                });
                setSnackbarMessage("Successfully cancelled your RSVP");
            }
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            fetchData();
        }
        catch (error) {
            console.error("Error updating RSVP:", error);
            const errorMessage = error.response?.data?.error ||
                "An error occurred while updating your RSVP.";
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    }
    async function markNotificationAsRead(id) {
        try {
            const response = await apiClient.patch(`/api/notifications/${id}`, {
                is_read: true,
            });
            if (response.status === 200) {
                setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
                setSnackbarMessage("Notification marked as read");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
            }
            else {
                setSnackbarMessage("Failed to mark notification as read");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        }
        catch (error) {
            console.error("Error marking notification as read:", error);
            const errorMessage = error.response?.data?.error ||
                "An error occurred while marking the notification as read.";
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    }
    function handleTabChange(event, newValue) {
        setActiveTab(newValue);
    }
    function toggleCalendar() {
        setShowCalendar(!showCalendar);
    }
    function getMyEventsCount() {
        const mySocietyIds = allSocieties.map((s) => s.id);
        return events.filter((e) => mySocietiesIncludes(e.hostedBy, mySocietyIds)).length;
    }
    function mySocietiesIncludes(hostedBy, mySocietyIds) {
        return mySocietyIds.includes(hostedBy);
    }
    if (loading) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: colours.primary[400], children: _jsx(CircularProgress, { size: 48, style: { color: colours.grey[100] } }) }));
    }
    return (_jsxs(Box, { minHeight: "100vh", bgcolor: colours.primary[500], py: 8, children: [_jsxs(Box, { maxWidth: "1920px", mx: "auto", px: 4, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, children: [_jsx(Typography, { variant: "h4", sx: { color: colours.grey[100] }, children: "Dashboard" }), _jsx(Box, { display: "flex", gap: 2, children: (student?.is_president === true ||
                                    student?.is_vice_president === true ||
                                    student?.is_event_manager === true) && (_jsxs(Button, { variant: "contained", onClick: () => {
                                        if (student?.is_president) {
                                            navigate(`/president-page/${student.president_of}`);
                                        }
                                        else if (student?.is_vice_president) {
                                            navigate(`/president-page/${student.vice_president_of_society}`);
                                        }
                                        else if (student?.is_event_manager) {
                                            navigate(`/president-page/${student.event_manager_of_society}/manage-society-events`);
                                        }
                                    }, sx: {
                                        backgroundColor: colours.greenAccent[500],
                                        color: colours.grey[100],
                                    }, children: [_jsx(FaCogs, { style: { marginRight: 4 } }), student?.is_event_manager ? "Manage Society Events" : "Manage My Society"] })) })] }), _jsxs(Box, { display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 3, mb: 4, children: [_jsx(StatCard, { icon: _jsx(FaUsers, { size: 24 }), title: "My Societies", value: allSocieties.length, color: colours.greenAccent[500] }), _jsx(StatCard, { icon: _jsx(FaCalendarAlt, { size: 24 }), title: "Society Events", value: getMyEventsCount(), color: colours.blueAccent[500] }), _jsx(StatCard, { icon: _jsx(FaBell, { size: 24 }), title: "Unread Notifications", value: notifications.filter((n) => !n.is_read).length, color: colours.redAccent[500] }), _jsx(StatCard, { icon: _jsx(FaTrophy, { size: 24 }), title: "My Awards", value: awards.length, color: colours.purpleAccent?.[500] || "#9C27B0" })] }), _jsxs(Paper, { elevation: 3, sx: {
                            backgroundColor: colours.primary[400],
                            border: `1px solid ${colours.grey[800]}`,
                        }, children: [_jsxs(CustomTabs, { value: activeTab, onChange: handleTabChange, textColor: "inherit", activecolor: tabColors[activeTab], variant: "fullWidth", children: [_jsx(Tab, { label: "Societies" }), _jsx(Tab, { label: "Events" }), _jsx(Tab, { label: "Notifications" }), _jsx(Tab, { label: "Awards", icon: _jsx(FaTrophy, {}), iconPosition: "start" }), _jsx(Tab, { label: "Society News", icon: _jsx(FaNewspaper, {}), iconPosition: "start" })] }), _jsxs(Box, { p: 3, children: [activeTab === 0 && (_jsx(Box, { display: "grid", gridTemplateColumns: {
                                            xs: "1fr",
                                            md: "repeat(2, 1fr)",
                                            lg: "repeat(3, 1fr)",
                                        }, gap: 3, children: allSocieties.length > 0 ? (allSocieties.map((society) => (_jsxs(Paper, { elevation: 2, sx: {
                                                backgroundColor: colours.primary[400],
                                                border: `1px solid ${colours.grey[800]}`,
                                                p: 2,
                                            }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", sx: { color: colours.grey[100] }, children: society.name }), society.is_president && (_jsx(Box, { px: 1, py: 0.5, borderRadius: "4px", bgcolor: colours.greenAccent[500], color: colours.primary[500], children: _jsx(Typography, { variant: "caption", children: "President" }) })), society.is_vice_president && (_jsx(Box, { px: 1, py: 0.5, borderRadius: "4px", bgcolor: colours.blueAccent[500], color: colours.primary[500], children: _jsx(Typography, { variant: "caption", children: "Vice President" }) })), society.is_event_manager && (_jsx(Box, { px: 1, py: 0.5, borderRadius: "4px", bgcolor: colours.blueAccent[500], color: colours.primary[500], children: _jsx(Typography, { variant: "caption", children: "Event Manager" }) }))] }), !(society.is_president || society.is_vice_president) && (_jsx(Button, { fullWidth: true, variant: "contained", onClick: () => handleLeaveSociety(society.id), sx: {
                                                        backgroundColor: colours.redAccent[500],
                                                        color: colours.grey[100],
                                                    }, children: "Leave Society" }))] }, society.id)))) : (_jsx(Box, { gridColumn: { xs: "1", md: "1 / span 2", lg: "1 / span 3" }, p: 4, textAlign: "center", children: _jsx(Typography, { variant: "body1", sx: { color: colours.grey[300] }, children: "You are not a member of any societies yet" }) })) })), activeTab === 1 && (_jsxs(Box, { display: "grid", gridTemplateColumns: {
                                            xs: "1fr",
                                            md: "repeat(2, 1fr)",
                                            lg: "repeat(3, 1fr)",
                                        }, gap: 3, children: [events
                                                .filter((e) => allSocieties.some((s) => s.id === e.hostedBy))
                                                .filter((e) => !e.current_attendees?.some((attendee) => attendee.id === user?.id))
                                                .map((event) => {
                                                return (_jsxs(Paper, { elevation: 2, sx: {
                                                        backgroundColor: colours.primary[400],
                                                        border: `1px solid ${colours.grey[800]}`,
                                                        p: 2,
                                                    }, children: [_jsx(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", sx: { color: colours.grey[100] }, children: event.title }), _jsxs(Box, { display: "flex", alignItems: "center", mt: 1, children: [_jsx(FaRegClock, { style: { marginRight: 8, color: colours.grey[300] } }), _jsxs(Typography, { variant: "body2", sx: { color: colours.grey[300] }, children: [event.date, " ", event.startTime && `at ${event.startTime}`] })] }), event.location && (_jsxs(Typography, { variant: "body2", sx: { color: colours.grey[300], mt: 1 }, children: ["Location: ", event.location] })), _jsxs(Typography, { variant: "body2", sx: { color: colours.grey[300], mt: 1 }, children: ["Hosted by:", " ", allSocieties.find((s) => s.id === event.hostedBy)?.name ||
                                                                                event.societyName ||
                                                                                `Society ${event.hostedBy}`] })] }) }), _jsx(Button, { fullWidth: true, variant: "contained", onClick: () => handleRSVP(event.id, true), sx: {
                                                                backgroundColor: colours.blueAccent[500],
                                                                color: colours.grey[100],
                                                            }, children: "RSVP Now" })] }, event.id));
                                            }), events
                                                .filter((e) => allSocieties.some((s) => s.id === e.hostedBy))
                                                .filter((e) => !e.current_attendees?.some((attendee) => attendee.id === user?.id)).length === 0 && (_jsx(Box, { gridColumn: { xs: "1", md: "1 / span 2", lg: "1 / span 3" }, p: 4, textAlign: "center", children: _jsx(Typography, { variant: "body1", sx: { color: colours.grey[300] }, children: "No events from your societies" }) }))] })), activeTab === 2 && (_jsx(Box, { children: notifications.length === 0 ? (_jsx(Typography, { variant: "body1", align: "center", sx: { color: colours.grey[300], py: 4 }, children: "No notifications" })) : (_jsx("div", { className: "space-y-6", children: notifications.map((notification) => (_jsx(Paper, { elevation: 2, sx: {
                                                    backgroundColor: notification.is_read
                                                        ? colours.primary[400]
                                                        : colours.blueAccent[700],
                                                    border: `1px solid ${notification.is_read
                                                        ? colours.grey[300]
                                                        : colours.blueAccent[400]}`,
                                                    p: 2,
                                                    mb: 2,
                                                }, children: _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Typography, { variant: "body1", sx: {
                                                                color: colours.grey[100],
                                                                fontSize: "1rem",
                                                            }, children: [_jsx("b", { children: notification.header }), _jsx("p", { children: notification.body })] }), _jsx(Box, { sx: { display: "flex", gap: "1rem" }, children: notification.is_read ? (_jsx(Typography, { sx: {
                                                                    color: colours.greenAccent[500],
                                                                    fontSize: "0.875rem",
                                                                    fontWeight: 500,
                                                                }, children: "Read" })) : (_jsx(Button, { variant: "text", size: "small", onClick: () => markNotificationAsRead(notification.id), sx: {
                                                                    color: colours.blueAccent[400],
                                                                    fontSize: "0.875rem",
                                                                    fontWeight: 500,
                                                                    textDecoration: "underline",
                                                                    padding: 0,
                                                                    minWidth: 0,
                                                                }, children: "Mark as Read" })) })] }) }, notification.id))) })) })), activeTab === 3 && (_jsx(Box, { children: awards.length === 0 ? (_jsx(Typography, { variant: "body1", align: "center", sx: { color: colours.grey[300], py: 4 }, children: "You haven't earned any awards yet" })) : (_jsx(Box, { display: "grid", gridTemplateColumns: {
                                                xs: "1fr",
                                                md: "repeat(2, 1fr)",
                                                lg: "repeat(3, 1fr)",
                                            }, gap: 3, children: awards.map((award) => (_jsx(AwardCard, { award: award }, award.id))) })) })), activeTab === 4 && (_jsx(Box, { children: _jsx(SocietyNewsFeed, {}) }))] })] }), !(student?.is_president === true ||
                        student?.is_vice_president === true ||
                        student?.is_event_manager === true) && (_jsx(Box, { display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(1, 1fr)" }, gap: 3, mt: 4, children: _jsxs(Paper, { elevation: 3, sx: {
                                backgroundColor: colours.primary[400],
                                border: `1px solid ${colours.grey[800]}`,
                                p: 2,
                            }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(FaUserPlus, { size: 24, style: { marginRight: 8, color: colours.blueAccent[500] } }), _jsx(Typography, { variant: "h6", sx: { color: colours.grey[100] }, children: "Start a Society" })] }), _jsx(Typography, { variant: "body2", sx: { color: colours.grey[300], mb: 2 }, children: "Have an idea for a new society? Share your passion and bring others together!" }), _jsx(Button, { variant: "contained", fullWidth: true, onClick: () => navigate("/student/start-society"), sx: {
                                        backgroundColor: colours.blueAccent[500],
                                        color: colours.grey[100],
                                    }, children: "Create New Society" })] }) })), _jsx(Box, { mt: 4, children: _jsxs(Paper, { elevation: 3, sx: {
                                backgroundColor: colours.primary[400],
                                border: `1px solid ${colours.grey[800]}`,
                                p: 3,
                                mb: 4,
                            }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(FaCalendarAlt, { size: 24, style: { marginRight: 8, color: colours.blueAccent[500] } }), _jsx(Typography, { variant: "h6", sx: { color: colours.grey[100] }, children: "My Society Events Calendar" })] }), _jsx(Button, { variant: "outlined", onClick: toggleCalendar, sx: {
                                                color: colours.grey[100],
                                                borderColor: colours.grey[700],
                                            }, children: showCalendar ? "Hide Calendar" : "Show Calendar" })] }), student?.is_event_manager && (_jsxs(Button, { variant: "contained", onClick: () => {
                                        if (student?.event_manager_of_society) {
                                            navigate(`/president-page/${student.event_manager_of_society}/manage-society-events`);
                                        }
                                        else {
                                            console.error("No society ID found for event manager");
                                        }
                                    }, sx: {
                                        backgroundColor: colours.redAccent[500],
                                        color: colours.grey[100],
                                        mb: 2,
                                    }, children: [_jsx(FaCalendarAlt, { style: { marginRight: 4 } }), "Manage Society Events"] })), showCalendar ? (_jsx(StudentCalendar, { societies: allSocieties, userEvents: events })) : (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", p: 4, bgcolor: colours.primary[500], borderRadius: "8px", children: _jsx(Typography, { variant: "body1", sx: { color: colours.grey[300] }, children: "Click \"Show Calendar\" to view your societies' events" }) }))] }) })] }), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 6000, onClose: handleSnackbarClose, anchorOrigin: { vertical: "top", horizontal: "center" }, children: _jsx(Alert, { onClose: handleSnackbarClose, severity: snackbarSeverity, sx: { width: "100%" }, children: snackbarMessage }) })] }));
};
const StatCard = ({ icon, title, value, color }) => {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    return (_jsxs(Paper, { elevation: 3, sx: {
            backgroundColor: colours.primary[400],
            border: `1px solid ${colours.grey[800]}`,
            p: 2,
        }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "subtitle1", sx: { color: colours.grey[300] }, children: title }), _jsx(Box, { sx: { color }, children: icon })] }), _jsx(Typography, { variant: "h4", sx: { color: colours.grey[100] }, children: value })] }));
};
export default StudentDashboard;
