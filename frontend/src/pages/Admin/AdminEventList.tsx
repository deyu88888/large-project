import React, { useEffect, useState, useContext, useRef, useCallback, FC } from "react";
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
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Event } from '../../types';

// Constants
const WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/admin/event/";
const RECONNECT_TIMEOUT = 5000;

// Types and Interfaces
interface DeleteDialogProps {
  open: boolean;
  event: Event | null;
  reason: string;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

interface ActionButtonsProps {
  eventId: string;
  event: Event;
  onView: (id: string) => void;
  onDelete: (event: Event) => void;
}

interface DataGridContainerProps {
  filteredEvents: Event[];
  columns: GridColDef[];
  loading: boolean;
  colors: any;
}

// Action Buttons Component
const ActionButtons: FC<ActionButtonsProps> = ({
  eventId,
  event,
  onView,
  onDelete
}) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(eventId)}
        sx={{ marginRight: "8px" }}
      >
        View
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => onDelete(event)}
      >
        Delete
      </Button>
    </Box>
  );
};

// Delete Confirmation Dialog Component
const DeleteDialog: FC<DeleteDialogProps> = ({
  open,
  event,
  reason,
  onReasonChange,
  onCancel,
  onConfirm
}) => {
  const title = event ? `Please confirm that you would like to delete ${event.title}.` : 'Confirm Deletion';

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
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
          onChange={onReasonChange}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={!reason.trim()}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// DataGrid Container Component
const DataGridContainer: FC<DataGridContainerProps> = ({
  filteredEvents,
  columns,
  loading,
  colors
}) => {
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

  return (
    <Box sx={getDataGridStyles()}>
      <DataGrid
        rows={filteredEvents}
        columns={columns}
        slots={{ toolbar: GridToolbar }}
        loading={loading}
        resizeThrottleMs={0}
        autoHeight
      />
    </Box>
  );
};

// WebSocket Management Functions
const createWebSocket = (url: string, onOpen: () => void, onMessage: (data: any) => void, onError: (event: Event) => void, onClose: (event: CloseEvent) => void): WebSocket => {
  const socket = new WebSocket(url);
  socket.onopen = onOpen;
  socket.onmessage = onMessage;
  socket.onerror = onError;
  socket.onclose = onClose;
  return socket;
};

const parseWebSocketMessage = (event: MessageEvent): any => {
  try {
    return JSON.parse(event.data);
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
    return null;
  }
};

// Main component
const EventList: FC = () => {
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

  // Data fetching function
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

  // WebSocket event handlers
  const handleSocketOpen = useCallback(() => {
    console.log("WebSocket Connected for Event List");
  }, []);

  const handleSocketMessage = useCallback((event: MessageEvent) => {
    const data = parseWebSocketMessage(event);
    if (data) {
      console.log("WebSocket Update Received:", data);
      fetchEvents();
    }
  }, [fetchEvents]);

  const handleSocketError = useCallback((event: Event) => {
    console.error("WebSocket Error:", event);
  }, []);

  const handleSocketClose = useCallback((event: CloseEvent) => {
    console.log("WebSocket Disconnected:", event.reason);
    setTimeout(() => connectWebSocket(), RECONNECT_TIMEOUT);
  }, []);

  // WebSocket connection function
  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    ws.current = createWebSocket(
      WEBSOCKET_URL,
      handleSocketOpen,
      handleSocketMessage,
      handleSocketError,
      handleSocketClose
    );
  }, [handleSocketOpen, handleSocketMessage, handleSocketError, handleSocketClose]);

  // Initialize data and WebSocket
  useEffect(() => {
    fetchEvents();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [fetchEvents, connectWebSocket]);

  // Event handlers
  const handleViewEvent = useCallback((eventId: string) => {
    navigate(`/admin/view-event/${eventId}`);
  }, [navigate]);

  const handleOpenDialog = useCallback((event: Event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setReason('');
  }, []);

  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      handleCloseDialog();
    }
  }, [selectedEvent, reason, fetchEvents, handleCloseDialog]);

  // Filter events based on search term
  const getFilteredEvents = useCallback(() => {
    return events.filter((event) =>
      Object.values(event)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  // Column definitions
  const getColumns = useCallback((): GridColDef[] => [
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
      renderCell: (params: GridRenderCellParams) => (
        <ActionButtons
          eventId={params.row.id}
          event={params.row}
          onView={handleViewEvent}
          onDelete={handleOpenDialog}
        />
      ),
    },
  ], [handleViewEvent, handleOpenDialog]);

  const getContainerStyle = useCallback(() => ({
    height: "calc(100vh - 64px)", // Full height minus AppBar height
    maxWidth: drawer ? `calc(100% - 3px)` : "100%",
  }), [drawer]);

  const filteredEvents = getFilteredEvents();
  const columns = getColumns();

  return (
    <Box sx={getContainerStyle()}>
      <DataGridContainer 
        filteredEvents={filteredEvents}
        columns={columns}
        loading={loading}
        colors={colors}
      />
      
      <DeleteDialog
        open={openDialog}
        event={selectedEvent}
        reason={reason}
        onReasonChange={handleReasonChange}
        onCancel={handleCloseDialog}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default EventList;