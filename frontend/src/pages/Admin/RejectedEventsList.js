import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
const WS_URL = "ws:;
const RECONNECT_DELAY = 5000;
const filterEventsBySearchTerm = (events, searchTerm) => {
    if (!searchTerm)
        return events;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return events.filter((event) => Object.values(event)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm));
};
const createEventColumns = () => {
    return [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "title", headerName: "Title", flex: 1 },
        { field: "main_description", headerName: "Description", flex: 2 },
        { field: "date", headerName: "Date", flex: 1 },
        { field: "start_time", headerName: "Start Time", flex: 1 },
        { field: "duration", headerName: "Duration", flex: 1 },
        { field: "hosted_by", headerName: "Hosted By", flex: 1 },
        { field: "location", headerName: "Location", flex: 1 },
    ];
};
const fetchRejectedEvents = async () => {
    try {
        const res = await apiClient.get(apiPaths.EVENTS.REJECTEDEVENTLIST);
        return res.data || [];
    }
    catch (error) {
        console.error("Error fetching rejected events:", error);
        return [];
    }
};
const closeWebSocket = (ws) => {
    if (ws.current) {
        ws.current.close();
    }
};
const clearReconnectTimeout = (timeoutRef) => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
};
const setupWebSocketOnOpen = (ws) => {
    ws.onopen = () => {
        console.log("WebSocket Connected for Rejected Events List");
    };
};
const setupWebSocketOnMessage = (ws, onUpdate) => {
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("WebSocket Update Received:", data);
            onUpdate();
        }
        catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
};
const setupWebSocketOnError = (ws) => {
    ws.onerror = (event) => {
        console.error("WebSocket Error:", event);
    };
};
const setupWebSocketOnClose = (ws, reconnectFn, reconnectTimeoutRef) => {
    ws.onclose = (event) => {
        console.log("WebSocket Disconnected:", event.reason);
        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectFn();
        }, RECONNECT_DELAY);
    };
};
const EventsDataGrid = ({ events, columns, colors }) => {
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
        }, children: _jsx(DataGrid, { rows: events, columns: columns, slots: { toolbar: GridToolbar }, resizeThrottleMs: 0, autoHeight: true, disableRowSelectionOnClick: true, initialState: {
                pagination: { paginationModel: { pageSize: 100 } },
            } }) }));
};
/**
 * EventListRejected component that displays a list of rejected events
 */
const EventListRejected = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { drawer } = useSettingsStore();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { searchTerm } = useContext(SearchContext);
    const ws = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const loadEvents = useCallback(async () => {
        setLoading(true);
        const data = await fetchRejectedEvents();
        setEvents(data);
        setLoading(false);
    }, []);
    const connectWebSocket = useCallback(() => {
        closeWebSocket(ws);
        clearReconnectTimeout(reconnectTimeoutRef);
        ws.current = new WebSocket(WS_URL);
        if (ws.current) {
            setupWebSocketOnOpen(ws.current);
            setupWebSocketOnMessage(ws.current, loadEvents);
            setupWebSocketOnError(ws.current);
            setupWebSocketOnClose(ws.current, connectWebSocket, reconnectTimeoutRef);
        }
    }, [loadEvents]);
    useEffect(() => {
        loadEvents();
        connectWebSocket();
        return () => {
            closeWebSocket(ws);
            clearReconnectTimeout(reconnectTimeoutRef);
        };
    }, [loadEvents, connectWebSocket]);
    const handleBackToEvents = useCallback(() => {
        navigate("/admin/event-list");
    }, [navigate]);
    const filteredEvents = filterEventsBySearchTerm(events, searchTerm || "");
    const columns = createEventColumns();
    return (_jsx(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: _jsx(EventsDataGrid, { events: filteredEvents, columns: columns, colors: colors }) }));
};
export default EventListRejected;
