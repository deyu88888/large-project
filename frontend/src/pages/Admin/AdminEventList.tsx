import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Dialog,
  DialogActions,
  TextField
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Event } from '../../types';

const WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/admin/event/";
const RECONNECT_TIMEOUT = 5000;

/**
 * EventList component displays a list of approved events with filtering and actions
 */
const EventList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);

  // State management
  const [events, setEvents] = useState<Event[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);

  /**
   * Fetch events from the API
   */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
      setEvents(res.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connect to WebSocket for real-time updates
   */
  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("WebSocket Connected for Event List");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Update Received:", data);
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
      setTimeout(connectWebSocket, RECONNECT_TIMEOUT);
    };
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [fetchEvents, connectWebSocket]);

  /**
   * Navigate to view event details
   */
  const handleViewEvent = (eventId: string) => {
    navigate(`/admin/view-event/${eventId}`);
  };

  /**
   * Open confirmation dialog for event deletion
   */
  const handleOpenDialog = (event: Event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  /**
   * Close confirmation dialog
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setReason('');
  };

  /**
   * Handle deletion confirmation
   */
  const handleDeleteConfirmed = async (deletionReason: string) => {
    if (!selectedEvent || !deletionReason.trim()) {
      return;
    }

    try {
      await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("Event", selectedEvent.id),
        data: { reason: deletionReason },
      });
      await fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      handleCloseDialog();
    }
  };

  /**
   * Update reason state on input change
   */
  const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  };

  /**
   * Initiate event deletion
   */
  const handleConfirmDelete = () => {
    handleDeleteConfirmed(reason);
  };

  /**
   * Filter events based on search term
   */
  const filteredEvents = events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  /**
   * Column definitions for DataGrid
   */
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "startTime", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hostedBy", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const eventId = params.row.id;
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewEvent(eventId)}
              sx={{ marginRight: "8px" }}
            >
              View
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleOpenDialog(params.row)}
            >
              Delete
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)", // Full height minus AppBar height
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
          loading={loading}
          resizeThrottleMs={0}
          autoHeight
        />
      </Box>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedEvent ? `Please confirm that you would like to delete ${selectedEvent.title}.` : 'Confirm Deletion'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You may undo this action in the Activity Log. <br />
            <strong>Compulsory:</strong> Provide a reason for deleting this event.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Deletion"
            fullWidth
            variant="standard"
            value={reason}
            onChange={handleReasonChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            disabled={!reason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventList;