import React, { useContext, useCallback, useState, useMemo, useEffect } from "react";
import { Box, useTheme, Button, Snackbar, Alert, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchPendingRequests } from "./utils";
import { apiPaths } from "../../api";
import { updateRequestStatus } from "../../api/requestApi";
import { EventPreview } from "../../components/EventPreview";
import type { EventData, ExtraModule } from "../../types/event/event";
import { mapToEventRequestData } from "../../utils/mapper.ts";
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import { FaSync } from "react-icons/fa";

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface ActionButtonsProps {
  id: number;
  event: EventData;
  onStatusChange: (id: number, status: "Approved" | "Rejected") => void;
  onView: (event: EventData) => void;
}

interface EventNotificationProps {
  alert: AlertState;
  onClose: () => void;
}

interface DataGridCustomProps {
  events: EventData[];
  columns: GridColDef[];
  drawer: boolean;
  colors: ReturnType<typeof tokens>;
  loading: boolean;
}

interface HeaderProps {
  colors: ReturnType<typeof tokens>;
  isConnected: boolean;
  onRefresh: () => void;
}

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

const Header: React.FC<HeaderProps> = ({ colors, isConnected, onRefresh }) => {
  return (
    <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
      <Box display="flex" alignItems="center">
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
        <Typography variant="body2" fontSize="0.75rem" color={colors.grey[300]} mr={2}>
          {isConnected ? 'Live updates' : 'Offline mode'}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FaSync />}
          onClick={onRefresh}
          size="small"
          sx={{ borderRadius: "8px" }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

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
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={alert.severity} variant="filled" sx={{ width: "100%" }}>
        {alert.message}
      </Alert>
    </Snackbar>
  );
};

const EventsDataGrid: React.FC<DataGridCustomProps> = ({ events, columns, colors, loading }) => {
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
        loading={loading}
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

  
  const fetchPendingEventData = async () => {
    try {
      const data = await fetchPendingRequests(apiPaths.EVENTS.PENDINGEVENTREQUEST);
      return data || [];
    } catch (error) {
      console.error("Error fetching pending events:", error);
      return [];
    }
  };

  
  const { 
    data: pendingData, 
    loading, 
    error: wsError, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<any[]>(
    'admin_events', 
    fetchPendingEventData
  );

  
  useEffect(() => {
    if (wsError) {
      setAlert(createErrorAlert(`WebSocket error: ${wsError}`));
    }
  }, [wsError]);

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
        await updateRequestStatus(id, status, apiPaths.EVENTS.UPDATEENEVENTREQUEST);
        setAlert(createSuccessAlert(`Event ${status.toLowerCase()} successfully.`));
        
        refresh();
      } catch (error) {
        console.error(`Error updating event status:`, error);
        setAlert(createErrorAlert(`Failed to ${status.toLowerCase()} event.`));
      }
    },
    [refresh]
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
      minWidth: 250,
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
      <Header 
        colors={colors}
        isConnected={isConnected}
        onRefresh={refresh}
      />

      <EventsDataGrid
        events={filteredEvents}
        columns={columns}
        drawer={drawer}
        colors={colors}
        loading={loading}
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