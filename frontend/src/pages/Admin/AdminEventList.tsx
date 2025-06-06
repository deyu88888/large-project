import React, { useEffect, useState, useContext, useCallback, FC } from "react";
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
  Snackbar
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { EventPreview } from "../../components/EventPreview";
import type { EventData } from "../../types/event/event";
import { mapToEventRequestData } from "../../utils/mapper.ts";
import {
  DeleteDialogProps,
  ActionButtonsProps,
  DataGridContainerProps
} from "../../types/admin/AdminEventList";
import { NotificationState } from "../../types/admin/StudentList.ts";

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
  onConfirm,
  isSubmitting
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
        <Button 
          onClick={onCancel} 
          color="secondary"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={!reason.trim() || isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Confirm"}
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

const AdminEventList: FC = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info"
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
      const mapped = (res.data ?? []).map(mapToEventRequestData);
      setEvents(mapped);
    } catch (error) {
      console.error("Error fetching events:", error);
      setNotification({
        open: true,
        message: `Failed to load events: ${error.response?.data?.message || "Unknown error"}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
    // Make sure to reset the submitting state when closing the dialog
    setIsSubmitting(false);
  }, []);

  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  }, []);

  const handleNotificationClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedEvent || !reason.trim() || isSubmitting) {
      return;
    }

    try {
      // Set submitting state to true immediately to prevent multiple clicks
      setIsSubmitting(true);
      
      await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("event", selectedEvent.eventId),
        data: { reason },
      });
      await fetchEvents();
      setNotification({
        open: true,
        message: `Event "${selectedEvent.title}" was successfully deleted.`,
        severity: "success"
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      console.error("Error response data:", error.response?.data);
      setNotification({
        open: true,
        message: `Failed to delete event: ${error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error"}`,
        severity: "error"
      });
    } finally {
      handleCloseDialog();
    }
  }, [selectedEvent, reason, fetchEvents, handleCloseDialog, isSubmitting]);

  
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
      width: 170,
      minWidth: 170,
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
        isSubmitting={isSubmitting}
      />

      {selectedEvent && (
        <EventPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          eventData={selectedEvent}
        />
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={notification.message}
        ContentProps={{
          sx: {
            backgroundColor: notification.severity === "success" ? "green" : 
                            notification.severity === "error" ? "red" : 
                            notification.severity === "warning" ? "orange" : "blue"
          }
        }}
      />
    </Box>
  );
};

export default AdminEventList;