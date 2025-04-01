// Refactored
import React, { useEffect, useState, useContext, FC } from "react";
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
import type { EventData } from "../../types/event/event";
import { mapToEventRequestData } from "../../utils/mapper.ts";
import { DeleteDialogProps, ActionButtonsProps } from "../../types/admin/RejectedEventsList";

const DeleteDialog: FC<DeleteDialogProps> = ({ open, event, reason, onReasonChange, onCancel, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{event ? `Confirm deletion of "${event.title}"` : "Delete Event"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This action can be undone in the Activity Log. <br />
          <strong>Reason required:</strong>
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
        <Button onClick={onCancel} color="secondary">Cancel</Button>
        <Button onClick={onConfirm} color="error" disabled={!reason.trim()}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

const ActionButtons: FC<ActionButtonsProps> = ({ event, onView, onDelete }) => (
  <Box>
    <Button onClick={() => onView(event)} variant="contained" color="primary" sx={{ mr: 1 }}>View</Button>
    <Button onClick={() => onDelete(event)} variant="contained" color="error">Delete</Button>
  </Box>
);

const RejectedEventsList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();

  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reason, setReason] = useState("");

  const fetchRejectedEvents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(apiPaths.EVENTS.REJECTEDEVENTLIST);
      const mapped = (res.data ?? []).map(mapToEventRequestData);
      setEvents(mapped);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedEvents();
  }, []);

  const handleView = (event: EventData) => {
    setPreviewEvent(event);
    setPreviewOpen(true);
  };

  const handleDeleteOpen = (event: EventData) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent || !reason.trim()) return;
    try {
      await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("Event", selectedEvent.eventId),
        data: { reason },
      });
      await fetchRejectedEvents();
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setOpenDialog(false);
      setSelectedEvent(null);
      setReason("");
    }
  };

  const filteredEvents = events.filter((event) =>
    `${event.eventId} ${event.title} ${event.date} ${event.startTime} ${event.duration} ${event.hostedBy} ${event.location}`
      .toLowerCase()
      .includes((searchTerm || "").toLowerCase())
  );

  const columns: GridColDef<EventData>[] = [
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
          event={params.row}
          onView={handleView}
          onDelete={handleDeleteOpen}
        />
      ),
    },
  ];

  return (
    <Box sx={{ height: "calc(100vh - 64px)", maxWidth: drawer ? `calc(100% - 3px)` : "100%" }}>
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
          getRowId={(row) => row.eventId}
          slots={{ toolbar: GridToolbar }}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
        />
      </Box>

      <DeleteDialog
        open={openDialog}
        event={selectedEvent}
        reason={reason}
        onReasonChange={(e) => setReason(e.target.value)}
        onCancel={() => setOpenDialog(false)}
        onConfirm={handleDeleteConfirm}
      />

      {previewEvent && (
        <EventPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          eventData={previewEvent}
        />
      )}
    </Box>
  );
};

export default RejectedEventsList;