import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useCallback, useState, useMemo } from "react";
import { Box, useTheme, Button, Snackbar, Alert } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { fetchPendingRequests } from "./utils";
import { apiPaths } from "../../api";
import { updateRequestStatus } from "../../api/requestApi";
import { EventPreview } from "../../components/EventPreview";
const filterEventsBySearchTerm = (events, searchTerm) => {
    if (!searchTerm)
        return events;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return events.filter((event) => Object.values(event)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm));
};
const createSuccessAlert = (message) => {
    return {
        open: true,
        message,
        severity: 'success'
    };
};
const createErrorAlert = (message) => {
    return {
        open: true,
        message,
        severity: 'error'
    };
};
const mapToEventData = (event) => {
    return {
        title: event.title || "",
        mainDescription: event.main_description || "",
        date: event.date || "",
        startTime: event.start_time || "",
        duration: event.duration || "",
        location: event.location || "",
        maxCapacity: event.max_capacity || 0,
        hostedBy: event.hosted_by || 0,
        eventId: event.id,
        coverImageUrl: event.cover_image || "",
        extraModules: event.extra_modules || [],
        participantModules: event.participant_modules || [],
        isParticipant: true,
        isMember: false
    };
};
const ActionButtons = ({ id, event, onStatusChange, onView }) => {
    return (_jsxs(Box, { children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => onView(event), sx: { marginRight: "8px" }, children: "View" }), _jsx(Button, { variant: "contained", color: "success", onClick: () => onStatusChange(id, "Approved"), sx: { marginRight: "8px" }, children: "Accept" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onStatusChange(id, "Rejected"), children: "Reject" })] }));
};
const EventNotification = ({ alert, onClose }) => {
    return (_jsx(Snackbar, { open: alert.open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { onClose: onClose, severity: alert.severity, variant: "filled", sx: { width: '100%' }, children: alert.message }) }));
};
const EventsDataGrid = ({ events, columns, drawer, colors }) => {
    return (_jsx(Box, { sx: {
            height: "78vh",
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .MuiDataGrid-columnHeaders": {
                backgroundColor: colors.blueAccent[700],
                borderBottom: "none",
            },
            "& .MuiDataGrid-columnHeader": {
                whiteSpace: "normal",
                wordBreak: "break-word"
            },
            "& .MuiDataGrid-virtualScroller": {
                backgroundColor: colors.primary[400]
            },
            "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                backgroundColor: colors.blueAccent[700],
            },
            "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                color: `${colors.blueAccent[500]} !important`,
            },
        }, children: _jsx(DataGrid, { rows: events, columns: columns, slots: { toolbar: GridToolbar }, resizeThrottleMs: 0, autoHeight: true, disableRowSelectionOnClick: true, initialState: {
                pagination: { paginationModel: { pageSize: 100 } },
            } }) }));
};
const PendingEventRequest = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const events = useFetchWebSocket(() => fetchPendingRequests(apiPaths.EVENTS.PENDINGEVENTREQUEST), 'event');
    const handleViewEvent = useCallback((event) => {
        const mappedEvent = mapToEventData(event);
        setSelectedEvent(mappedEvent);
        setPreviewOpen(true);
    }, []);
    const handleStatusChange = useCallback(async (id, status) => {
        try {
            await updateRequestStatus(id, status, apiPaths.EVENTS.UPDATEENEVENTREQUEST);
            const successMessage = `Event ${status.toLowerCase()} successfully.`;
            setAlert(createSuccessAlert(successMessage));
        }
        catch (error) {
            console.error(`Error updating event status:`, error);
            const errorMessage = `Failed to ${status.toLowerCase()} event.`;
            setAlert(createErrorAlert(errorMessage));
        }
    }, []);
    const handleCloseAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, open: false }));
    }, []);
    const createColumns = useCallback(() => [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "title", headerName: "Title", flex: 1 },
        { field: "date", headerName: "Date", flex: 1 },
        { field: "start_time", headerName: "Start Time", flex: 1 },
        { field: "duration", headerName: "Duration", flex: 1 },
        { field: "hosted_by", headerName: "Hosted By", flex: 0.5 },
        { field: "location", headerName: "Location", flex: 1 },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1.6,
            width: 250,
            minWidth: 250,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { id: params.row.id, event: params.row, onStatusChange: handleStatusChange, onView: handleViewEvent })),
        },
    ], [handleStatusChange, handleViewEvent]);
    const filteredEvents = useMemo(() => filterEventsBySearchTerm(events, searchTerm || ''), [events, searchTerm]);
    const columns = useMemo(() => createColumns(), [createColumns]);
    return (_jsxs(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: [_jsx(EventsDataGrid, { events: filteredEvents, columns: columns, drawer: drawer, colors: colors }), _jsx(EventNotification, { alert: alert, onClose: handleCloseAlert }), selectedEvent && (_jsx(EventPreview, { open: previewOpen, onClose: () => setPreviewOpen(false), eventData: selectedEvent }))] }));
};
export default PendingEventRequest;
