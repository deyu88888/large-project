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
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { EventPreview } from "../../components/EventPreview";
import type { EventData } from "../../types/event/event";
import { mapToEventRequestData } from "../../utils/mapper.ts";
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import { FaSync } from "react-icons/fa";

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

const EventList: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [reason, setReason] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  
  const fetchEvents = async () => {
    try {
      const res = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
      const mapped = (res.data ?? []).map(mapToEventRequestData);
      return mapped;
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  };

  
  const { 
    data: events, 
    loading, 
    error, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<EventData[]>(
    'admin_events', 
    fetchEvents
  );

  
  useEffect(() => {
    if (error) {
      console.error(`WebSocket error: ${error}`);
    }
  }, [error]);

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
      
      
      await refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      handleCloseDialog();
    }
  }, [selectedEvent, reason, refresh, handleCloseDialog]);

  const getFilteredEvents = useCallback(() => {
    
    if (!events || !Array.isArray(events)) return [];
    
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
      {/* Header with connection status and refresh button */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" mr={2}>
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? colors.greenAccent[500] : colors.orangeAccent[500],
              mr: 1
            }}
          />
          <Typography variant="body2" fontSize="0.75rem" color={colors.grey[300]}>
            {isConnected ? 'Live updates' : 'Offline mode'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FaSync />}
          onClick={refresh}
          size="small"
          sx={{ borderRadius: "8px" }}
        >
          Refresh Events
        </Button>
      </Box>

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