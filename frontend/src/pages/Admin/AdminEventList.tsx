import React, { useEffect, useState, useContext, useRef, useCallback, FC } from "react";
import {
  Box,
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
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { EventPreview } from "../../components/EventPreview";
import type { EventData, ExtraModule } from "../../types/event/event";
import { getWebSocketUrl } from "../../utils/websocket";
import {mapToEventRequestData} from "../../utils/mapper.ts";


const WEBSOCKET_URL = getWebSocketUrl()
const RECONNECT_TIMEOUT = 5000;

interface DeleteDialogProps {
  open: boolean;
  event: EventData | null;
  reason: string;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

interface ActionButtonsProps {
  eventId: number;
  event: EventData;
  onView: (event: EventData) => void;
  onDelete: (event: EventData) => void;
}

interface DataGridContainerProps {
  filteredEvents: EventData[];
  columns: GridColDef[];
  loading: boolean;
  colors: any;
}

const ActionButtons: FC<ActionButtonsProps> = ({
  event,
  onView,
  onDelete
}) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(event)}
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
        getRowId={(row) => row.eventId}
        slots={{ toolbar: GridToolbar }}
        loading={loading}
        resizeThrottleMs={0}
        autoHeight
      />
    </Box>
  );
};

const createWebSocket = (
  url: string,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onError: (event: globalThis.Event) => void,
  onClose: (event: CloseEvent) => void
): WebSocket => {
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

const EventList: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
      const mapped = (res.data ?? []).map(mapToEventRequestData);
      setEvents(mapped);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
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

  const handleSocketError = useCallback((event: EventData) => {
    console.error("WebSocket Error:", event);
  }, []);

  const handleSocketClose = useCallback((event: CloseEvent) => {
    console.log("WebSocket Disconnected:", event.reason);
    setTimeout(() => connectWebSocket(), RECONNECT_TIMEOUT);
  }, []);

  
  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    ws.current = createWebSocket(
      WEBSOCKET_URL,
      handleSocketOpen,
      handleSocketMessage,
      handleSocketError as any,
      handleSocketClose
    );
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

  const handleViewEvent = useCallback((event: EventData) => {
    setSelectedEvent(event);
    setPreviewOpen(true);
  }, []);

  const handleOpenDialog = useCallback((event: EventData) => {
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
        url: apiPaths.USER.DELETE("Event", selectedEvent.eventId),
        data: { reason },
      });
      await fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      handleCloseDialog();
    }
  }, [selectedEvent, reason, fetchEvents, handleCloseDialog]);

  
  const getFilteredEvents = useCallback(() => {
    return events.filter((event) =>
      Object.values(event)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  
  const getColumns = useCallback((): GridColDef[] => [
    { field: "eventId", headerName: "ID", flex: 0.3 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "date", headerName: "Date", flex: 0.7 },
    { field: "startTime", headerName: "Start Time", flex: 0.7 },
    { field: "duration", headerName: "Duration", flex: 0.7 },
    { field: "hostedBy", headerName: "Hosted By", flex: 0.7 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.4,
      minWidth: 250,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<EventData>) => (
        <ActionButtons
          eventId={params.row.eventId}
          event={params.row}
          onView={handleViewEvent}
          onDelete={handleOpenDialog}
        />
      ),
    },
  ], [handleViewEvent, handleOpenDialog]);


  const getContainerStyle = useCallback(() => ({
    height: "calc(100vh - 64px)", 
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

      {selectedEvent && (
        <EventPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          eventData={selectedEvent}
        />
      )}
    </Box>
  );
};

export default EventList;