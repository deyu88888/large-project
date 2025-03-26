import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Paper, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";
const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};
const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};
const isFilterType = (value) => {
    return ["upcoming", "previous", "pending", "rejected"].includes(value);
};
const getFilteredEvents = (events, filter, societyId) => {
    const currentDate = new Date();
    const filtered = events.filter((event) => event.hosted_by === societyId);
    switch (filter) {
        case "upcoming":
            return filtered.filter((event) => new Date(`${event.date}T${event.start_time}`) > currentDate && event.status === "Approved");
        case "previous":
            return filtered.filter((event) => new Date(`${event.date}T${event.start_time}`) < currentDate && event.status === "Approved");
        case "pending":
            return filtered.filter((event) => event.status === "Pending");
        case "rejected":
            return filtered.filter((event) => event.status === "Rejected");
        default:
            return [];
    }
};
export default function ManageSocietyEvents() {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { societyId, filter: filterParam } = useParams();
    const numericSocietyId = societyId ? parseInt(societyId, 10) : null;
    const [filter, setFilter] = useState(isFilterType(filterParam) ? filterParam : "upcoming");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const filterOptions = [
        { label: "Upcoming", value: "upcoming", color: colors.blueAccent[500] },
        { label: "Previous", value: "previous", color: colors.greenAccent[500] },
        { label: "Pending Approval", value: "pending", color: colors.redAccent[500] },
        { label: "Rejected", value: "rejected", color: colors.grey[500] },
    ];
    useEffect(() => {
        if (!societyId)
            return;
        if (filter !== filterParam) {
            navigate(`/president-page/${societyId}/manage-society-events/${filter}`, { replace: true });
        }
    }, [filter, filterParam, societyId, navigate]);
    useEffect(() => {
        if (!numericSocietyId) {
            setError("Invalid society ID");
            setLoading(false);
            return;
        }
        fetchEvents(numericSocietyId);
    }, [numericSocietyId, filter]);
    const fetchEvents = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get("/api/events/sorted/", {
                params: { society_id: id },
            });
            setEvents(getFilteredEvents(response.data, filter, id));
        }
        catch (error) {
            setError(`Failed to load ${filter} events. ${error}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEdit = (eventId) => navigate(`/president-page/${societyId}/edit-event/${eventId}`);
    const confirmDelete = (eventId) => {
        setSelectedEventId(eventId);
        setOpenDialog(true);
    };
    const handleConfirmDelete = async () => {
        if (selectedEventId === null)
            return;
        try {
            await apiClient.delete(`/api/events/${selectedEventId}/manage/`);
            setEvents((prev) => prev.filter((e) => e.id !== selectedEventId));
            setSnackbar({ open: true, message: "Event deleted successfully.", severity: "success" });
        }
        catch {
            setSnackbar({ open: true, message: "Failed to delete event.", severity: "error" });
        }
        finally {
            setOpenDialog(false);
            setSelectedEventId(null);
        }
    };
    const isEditable = (event) => {
        if (event.status === "Pending" || event.status === "Rejected")
            return true;
        return new Date(`${event.date}T${event.start_time}`) > new Date();
    };
    const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
    const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
    const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
    const paperHoverBackgroundColor = theme.palette.mode === "dark" ? colors.primary[600] : "#f5f5f5";
    return (_jsxs(Box, { minHeight: "100vh", p: 4, sx: { backgroundColor, color: textColor }, children: [_jsxs(Box, { textAlign: "center", mb: 4, children: [_jsx(Typography, { variant: "h2", fontWeight: "bold", sx: { color: textColor }, children: "Manage Society Events" }), _jsxs(Typography, { variant: "h6", sx: { color: colors.grey[500] }, children: [filter.charAt(0).toUpperCase() + filter.slice(1), " events for Society ", societyId] })] }), _jsx(Box, { display: "flex", justifyContent: "center", mb: 3, children: _jsx(Button, { onClick: () => navigate(`/president-page/${societyId}/create-event`), sx: {
                        backgroundColor: colors.blueAccent[500],
                        color: theme.palette.mode === "dark" ? "#141b2d" : "#ffffff",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        "&:hover": { backgroundColor: colors.blueAccent[600] },
                    }, children: "Create a New Event" }) }), _jsx(Box, { display: "flex", justifyContent: "center", mb: 4, children: _jsx(ToggleButtonGroup, { value: filter, exclusive: true, onChange: (_, newFilter) => newFilter && setFilter(newFilter), sx: { backgroundColor: colors.primary[500], borderRadius: "8px" }, children: filterOptions.map(({ label, value, color }) => (_jsx(ToggleButton, { value: value, sx: {
                            backgroundColor: filter === value ? color : colors.grey[600],
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#141b2d",
                            fontWeight: "bold",
                            "&:hover": { backgroundColor: color, opacity: 0.8 },
                            transition: "0.3s",
                        }, children: label }, value))) }) }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", children: _jsx(CircularProgress, { color: "secondary" }) })) : error ? (_jsx(Typography, { color: colors.redAccent[500], textAlign: "center", children: error })) : events.length === 0 ? (_jsxs(Typography, { textAlign: "center", color: colors.grey[500], children: ["No ", filter, " events found for society ", societyId, "."] })) : (_jsx(Box, { maxWidth: "800px", mx: "auto", children: events.map((event) => (_jsxs(Paper, { elevation: 3, sx: {
                        p: 3,
                        mb: 2,
                        backgroundColor: paperBackgroundColor,
                        color: textColor,
                        borderRadius: "8px",
                        boxShadow: 3,
                        transition: "0.3s",
                        "&:hover": { backgroundColor: paperHoverBackgroundColor },
                    }, children: [_jsx(Typography, { variant: "h5", fontWeight: "bold", children: event.title }), _jsxs(Typography, { children: ["Date: ", formatDate(event.date)] }), _jsxs(Typography, { children: ["Time: ", formatTime(event.start_time)] }), _jsxs(Typography, { children: ["Location: ", event.location] }), _jsxs(Typography, { children: ["Status: ", event.status] }), isEditable(event) && (_jsxs(Box, { mt: 2, display: "flex", gap: 2, children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => handleEdit(event.id), children: "Edit" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => confirmDelete(event.id), children: "Delete" })] }))] }, event.id))) })), _jsxs(Dialog, { open: openDialog, onClose: () => setOpenDialog(false), children: [_jsx(DialogTitle, { children: "Confirm Deletion" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this event?" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setOpenDialog(false), color: "secondary", children: "Cancel" }), _jsx(Button, { onClick: handleConfirmDelete, color: "error", children: "Delete" })] })] }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 3000, onClose: () => setSnackbar({ ...snackbar, open: false }), anchorOrigin: { vertical: 'top', horizontal: 'center' }, children: _jsx(Alert, { severity: snackbar.severity, variant: "filled", onClose: () => setSnackbar({ ...snackbar, open: false }), children: snackbar.message }) })] }));
}
