import React, { useContext, useCallback, useState, useEffect, useMemo } from "react";
import { Box, useTheme, Button, Snackbar, Alert } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchPendingRequests } from "../../utils/utils.ts";
import { apiClient } from "../../api";
import { EventPreview } from "../../components/EventPreview";
import type { EventData } from "../../types/event/event";
import { mapToEventRequestData } from "../../utils/mapper.ts";
import {
  AlertState,
  ActionButtonsProps,
  EventNotificationProps,
  DataGridCustomProps
} from "../../types/admin/PendingEventRequest";

const filterEventsBySearchTerm = (
  events: EventData[],
  searchTerm: string
): EventData[] => {
  if (!searchTerm) return events;
  const normalizedSearchTerm = searchTerm.toLowerCase();
  return events.filter((event) => {
    return (
      `${event.eventId} ${event.title} ${event.date} ${event.startTime} ${event.duration} ${event.hostedBy} ${event.location}`
        .toLowerCase()
        .includes(normalizedSearchTerm)
    );
  });
};

const createSuccessAlert = (message: string): AlertState => ({
  open: true,
  message,
  severity: "success",
});

const createErrorAlert = (message: string): AlertState => ({
  open: true,
  message,
  severity: "error",
});

const ActionButtons: React.FC<ActionButtonsProps> = ({
  id,
  event,
  onStatusChange,
  onView,
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
        color="success"
        onClick={() => onStatusChange(id, "Approved")}
        sx={{ marginRight: "8px" }}
      >
        Accept
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => onStatusChange(id, "Rejected")}
      >
        Reject
      </Button>
    </Box>
  );
};

const EventNotification: React.FC<EventNotificationProps> = ({ alert, onClose }) => {
  return (
    <Snackbar
      open={alert.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={alert.severity} variant="filled" sx={{ width: "100%" }}>
        {alert.message}
      </Alert>
    </Snackbar>
  );
};

const EventsDataGrid: React.FC<DataGridCustomProps> = ({ events, columns, colors }) => {
  return (
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
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
          color: `${colors.blueAccent[500]} !important`,
        },
      }}
    >
      <DataGrid
        rows={events}
        columns={columns}
        getRowId={(row) => row.eventId}
        slots={{ toolbar: GridToolbar }}
        resizeThrottleMs={0}
        autoHeight
        disableRowSelectionOnClick
        initialState={{
          pagination: { paginationModel: { pageSize: 100 } },
        }}
      />
    </Box>
  );
};

const PendingEventRequest: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [pendingData, setPendingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Correct API endpoints based on your Django URLs
  const PENDING_EVENT_ENDPOINT = "/api/admin/society/event/pending";
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching pending events from:", PENDING_EVENT_ENDPOINT);
      const data: any = await fetchPendingRequests(PENDING_EVENT_ENDPOINT);
      console.log("Received pending events data:", data);
      setPendingData(data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const events: EventData[] = useMemo(() => {
    return (pendingData ?? []).map(mapToEventRequestData);
  }, [pendingData]);

  const handleViewEvent = useCallback((event: EventData) => {
    setSelectedEvent(event);
    setPreviewOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    async (id: number, status: "Approved" | "Rejected") => {
      try {
        const requestEndpoint = `/api/admin/society/event/request/${id}`;
        console.log(`Updating event ${id} status to ${status}`);
        console.log(`API URL: ${requestEndpoint}`);
        const payload = {
          status: status,
          ...(status === "Rejected" && { rejection_reason: "Event rejected by admin" })
        };
        
        console.log("Sending payload:", payload);
        
        const response = await apiClient.put(requestEndpoint, payload);
        
        console.log("Response from API:", response.data);
        
        setAlert(createSuccessAlert(`Event ${status.toLowerCase()} successfully.`));
        
        await fetchData();
      } catch (error: any) {
        console.error(`Error updating event status:`, error);
        console.error("Error details:", error.response?.data);
        
        setAlert(createErrorAlert(
          `Failed to ${status.toLowerCase()} event. ${error.response?.data?.message || error.message}`
        ));
      }
    },
    [fetchData]
  );

  const handleCloseAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, open: false }));
  }, []);

  const createColumns = useCallback((): GridColDef[] => [
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
      width: 255,
      minWidth: 255,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<EventData>) => (
        <ActionButtons
          id={params.row.eventId}
          event={params.row}
          onStatusChange={handleStatusChange}
          onView={handleViewEvent}
        />
      ),
    },
  ], [handleStatusChange, handleViewEvent]);

  const filteredEvents = useMemo(
    () => filterEventsBySearchTerm(events, searchTerm || ""),
    [events, searchTerm]
  );

  const columns = useMemo(() => createColumns(), [createColumns]);

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <EventsDataGrid
        events={filteredEvents}
        columns={columns}
        drawer={drawer}
        colors={colors}
      />

      <EventNotification alert={alert} onClose={handleCloseAlert} />

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

export default PendingEventRequest;