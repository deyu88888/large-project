import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { Box, useTheme, Button, DialogTitle, DialogContent, DialogContentText, Dialog, DialogActions, TextField } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { EventPreview } from "../../components/EventPreview";
const WEBSOCKET_URL = "ws:";
const RECONNECT_TIMEOUT = 5000;
function mapToEventData(raw) {
    return {
        title: raw.title || "",
        mainDescription: raw.main_description || "",
        date: raw.date || "",
        startTime: raw.start_time || "",
        duration: raw.duration || "",
        location: raw.location || "",
        maxCapacity: raw.max_capacity || 0,
        hostedBy: raw.hosted_by || 0,
        eventId: raw.id,
        coverImageUrl: raw.cover_image || "",
        extraModules: raw.extra_modules || [],
        participantModules: raw.participant_modules || [],
        isParticipant: false,
        isMember: false,
    };
}
const ActionButtons = ({ eventId, event, onView, onDelete }) => {
    return (_jsxs(Box, { children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => onView(event), sx: { marginRight: "8px" }, children: "View" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onDelete(event), children: "Delete" })] }));
};
const DeleteDialog = ({ open, event, reason, onReasonChange, onCancel, onConfirm }) => {
    const title = event ? `Please confirm that you would like to delete ${event.title}.` : 'Confirm Deletion';
    return (_jsxs(Dialog, { open: open, onClose: onCancel, children: [_jsx(DialogTitle, { children: title }), _jsxs(DialogContent, { children: [_jsxs(DialogContentText, { children: ["You may undo this action in the Activity Log. ", _jsx("br", {}), _jsx("strong", { children: "Compulsory:" }), " Provide a reason for deleting this event."] }), _jsx(TextField, { autoFocus: true, margin: "dense", label: "Reason for Deletion", fullWidth: true, variant: "standard", value: reason, onChange: onReasonChange, required: true })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onCancel, color: "primary", children: "Cancel" }), _jsx(Button, { onClick: onConfirm, color: "error", disabled: !reason.trim(), children: "Confirm" })] })] }));
};
const DataGridContainer = ({ filteredEvents, columns, loading, colors }) => {
    const getDataGridStyles = () => ({
        height: "78vh",
        "& .MuiDataGrid-root": { border: "none" },
        "& .MuiDataGrid-cell": { borderBottom: "none" },
        "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
        },
        "& .MuiDataGrid-columnHeader": {
            whiteSpace: "normal",
            wordBreak: "break-word",
        },
        "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
        },
        "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
        },
        "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
        },
    });
    return (_jsx(Box, { sx: getDataGridStyles(), children: _jsx(DataGrid, { rows: filteredEvents, columns: columns, slots: { toolbar: GridToolbar }, loading: loading, resizeThrottleMs: 0, autoHeight: true }) }));
};
const createWebSocket = (url, onOpen, onMessage, onError, onClose) => {
    const socket = new WebSocket(url);
    socket.onopen = onOpen;
    socket.onmessage = onMessage;
    socket.onerror = onError;
    socket.onclose = onClose;
    return socket;
};
const parseWebSocketMessage = (event) => {
    try {
        return JSON.parse(event.data);
    }
    catch (error) {
        console.error("Error parsing WebSocket message:", error);
        return null;
    }
};
const EventList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { drawer } = useSettingsStore();
    const { searchTerm } = useContext(SearchContext);
    const [events, setEvents] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [previewEvent, setPreviewEvent] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const ws = useRef(null);
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
            setEvents(res.data || []);
        }
        catch (error) {
            console.error("Error fetching events:", error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const handleSocketOpen = useCallback(() => {
        console.log("WebSocket Connected for Event List");
    }, []);
    const handleSocketMessage = useCallback((event) => {
        const data = parseWebSocketMessage(event);
        if (data) {
            console.log("WebSocket Update Received:", data);
            fetchEvents();
        }
    }, [fetchEvents]);
    const handleSocketError = useCallback((event) => {
        console.error("WebSocket Error:", event);
    }, []);
    const handleSocketClose = useCallback((event) => {
        console.log("WebSocket Disconnected:", event.reason);
        setTimeout(() => connectWebSocket(), RECONNECT_TIMEOUT);
    }, []);
    const connectWebSocket = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            return;
        }
        ws.current = createWebSocket(WEBSOCKET_URL, handleSocketOpen, handleSocketMessage, handleSocketError, handleSocketClose);
    }, [handleSocketOpen, handleSocketMessage, handleSocketError, handleSocketClose]);
    useEffect(() => {
        fetchEvents();
        connectWebSocket();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [fetchEvents, connectWebSocket]);
    const handleViewEvent = useCallback((event) => {
        const data = mapToEventData(event);
        setPreviewEvent(data);
        setPreviewOpen(true);
    }, []);
    const handleOpenDialog = useCallback((event) => {
        setSelectedEvent(event);
        setOpenDialog(true);
    }, []);
    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
        setSelectedEvent(null);
        setReason('');
    }, []);
    const handleReasonChange = useCallback((event) => {
        setReason(event.target.value);
    }, []);
    const handleConfirmDelete = useCallback(async () => {
        if (!selectedEvent || !reason.trim()) {
            return;
        }
        try {
            await apiClient.request({
                method: "DELETE",
                url: apiPaths.USER.DELETE("Event", selectedEvent.id),
                data: { reason },
            });
            await fetchEvents();
        }
        catch (error) {
            console.error("Error deleting event:", error);
        }
        finally {
            handleCloseDialog();
        }
    }, [selectedEvent, reason, fetchEvents, handleCloseDialog]);
    const getFilteredEvents = useCallback(() => {
        return events.filter((event) => Object.values(event)
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
    }, [events, searchTerm]);
    const getColumns = useCallback(() => [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "title", headerName: "Title", flex: 1 },
        { field: "main_description", headerName: "Description", flex: 2 },
        { field: "date", headerName: "Date", flex: 1 },
        { field: "start_time", headerName: "Start Time", flex: 1 },
        { field: "duration", headerName: "Duration", flex: 1 },
        { field: "hosted_by", headerName: "Hosted By", flex: 0.5 },
        { field: "location", headerName: "Location", flex: 1 },
        {
            field: "actions",
            headerName: "Actions",
            width: 170,
            minWidth: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { eventId: params.row.id, event: params.row, onView: handleViewEvent, onDelete: handleOpenDialog })),
        },
    ], [handleViewEvent, handleOpenDialog]);
    const getContainerStyle = useCallback(() => ({
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
    }), [drawer]);
    const filteredEvents = getFilteredEvents();
    const columns = getColumns();
    return (_jsxs(Box, { sx: getContainerStyle(), children: [_jsx(DataGridContainer, { filteredEvents: filteredEvents, columns: columns, loading: loading, colors: colors }), _jsx(DeleteDialog, { open: openDialog, event: selectedEvent, reason: reason, onReasonChange: handleReasonChange, onCancel: handleCloseDialog, onConfirm: handleConfirmDelete }), previewEvent && (_jsx(EventPreview, { open: previewOpen, onClose: () => setPreviewOpen(false), eventData: previewEvent }))] }));
};
export default EventList;
