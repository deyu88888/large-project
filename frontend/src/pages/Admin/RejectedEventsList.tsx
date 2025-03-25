// TODO: description column and action buttons needs better positioning
// come back to refactor

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Event } from '../../types';

// Constants for configuration
const WS_URL = "ws://127.0.0.1:8000/ws/admin/event/";
const RECONNECT_DELAY = 5000;

/**
 * EventListRejected component that displays a list of rejected events
 */
const EventListRejected = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { drawer } = useSettingsStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchTerm } = useContext(SearchContext);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetches rejected events from the API
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(apiPaths.EVENTS.REJECTEDEVENTLIST);
      setEvents(res.data || []);
    } catch (error) {
      console.error("Error fetching rejected events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates and manages WebSocket connection
   */
  const connectWebSocket = useCallback(() => {
    // Clean up existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Create new WebSocket connection
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("WebSocket Connected for Rejected Events List");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Update Received:", data);
        // Re-fetch on any update
        fetchEvents();
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onerror = (event) => {
      console.error("WebSocket Error:", event);
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket Disconnected:", event.reason);
      
      // Set up reconnection with timeout
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, RECONNECT_DELAY);
    };
  }, [fetchEvents]);

  /**
   * Initialize data and WebSocket connection
   */
  useEffect(() => {
    fetchEvents();
    connectWebSocket();
  
    // Cleanup function for component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchEvents, connectWebSocket]);

  /**
   * Filter events based on search term
   */
  const filteredEvents = events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes((searchTerm || "").toLowerCase())
  );

  /**
   * Navigate back to the main events list
   */
  const handleBackToEvents = useCallback(() => {
    navigate("/admin/event-list");
  }, [navigate]);

  /**
   * DataGrid column definitions
   */
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "main_description", headerName: "Description", flex: 2},
    { field: "date", headerName: "Date", flex: 1 },
    { field: "start_time", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hosted_by", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Box
        sx={{
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
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          resizeThrottleMs={0}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 100 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default EventListRejected;