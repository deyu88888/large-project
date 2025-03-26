import React, { useContext, useCallback, useState, useMemo } from "react";
import { 
  Box, 
  useTheme,
  Button, 
  Snackbar,
  Alert 
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { fetchPendingRequests } from "./utils";
import { apiPaths } from "../../api";
import { updateRequestStatus } from "../../api/requestApi";
import { EventPreview } from "../../components/EventPreview";
import type { EventData } from "../../components/EventDetailLayout";
import { Attendee } from "../../types/student/event";

interface Event {
  id: number;
  title: string;
  description: string;
  main_description: string;
  date: string;
  start_time: string;
  duration: string;
  hosted_by: number;
  location: string;
  current_attendees: Attendee[];
  [key: string]: any;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

interface ActionButtonsProps {
  id: number;
  event: Event;
  onStatusChange: (id: number, status: "Approved" | "Rejected") => void;
  onView: (event: Event) => void;
}

interface EventNotificationProps {
  alert: AlertState;
  onClose: () => void;
}

interface DataGridCustomProps {
  events: Event[];
  columns: GridColDef[];
  drawer: boolean;
  colors: ReturnType<typeof tokens>;
}


const filterEventsBySearchTerm = (events: Event[], searchTerm: string): Event[] => {
  if (!searchTerm) return events;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};

const createSuccessAlert = (message: string): AlertState => {
  return {
    open: true,
    message,
    severity: 'success'
  };
};

const createErrorAlert = (message: string): AlertState => {
  return {
    open: true,
    message,
    severity: 'error'
  };
};

const mapToEventData = (event: Event): EventData => {
  return {
    title: event.title || "",
    main_description: event.main_description || "",
    date: event.date || "",
    start_time: event.start_time || "",
    duration: event.duration || "",
    location: event.location || "",
    max_capacity: event.max_capacity || 0,
    hosted_by: event.hosted_by || 0,
    event_id: event.id,
    cover_image_url: event.cover_image || "",
    extra_modules: event.extra_modules || [],
    participant_modules: event.participant_modules || [],
    is_participant: true,
    is_member: false,
    current_attendees: event.current_attendees,
  };
};


const ActionButtons: React.FC<ActionButtonsProps> = ({ id, event, onStatusChange, onView }) => {
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
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={alert.severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
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
          wordBreak: "break-word" 
        },
        "& .MuiDataGrid-virtualScroller": { 
          backgroundColor: colors.primary[400] 
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
    message: '',
    severity: 'success'
  });

  const events = useFetchWebSocket<Event[]>(
    () => fetchPendingRequests(apiPaths.EVENTS.PENDINGEVENTREQUEST),
    'event'
  );
  
  const handleViewEvent = useCallback((event: Event) => {
    const mappedEvent = mapToEventData(event);
    setSelectedEvent(mappedEvent);
    setPreviewOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (id: number, status: "Approved" | "Rejected") => {
    try {
      await updateRequestStatus(id, status, apiPaths.EVENTS.UPDATEENEVENTREQUEST);
      const successMessage = `Event ${status.toLowerCase()} successfully.`;
      setAlert(createSuccessAlert(successMessage));
    } catch (error) {
      console.error(`Error updating event status:`, error);
      const errorMessage = `Failed to ${status.toLowerCase()} event.`;
      setAlert(createErrorAlert(errorMessage));
    }
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  const createColumns = useCallback((): GridColDef[] => [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "start_time", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hosted_by", headerName: "Hosted By", flex: 0.5 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.6,
      width: 250,
      minWidth: 250,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<any, Event>) => (
        <ActionButtons 
          id={params.row.id}
          event={params.row}
          onStatusChange={handleStatusChange}
          onView={handleViewEvent}
        />
      ),
    },
  ], [handleStatusChange, handleViewEvent]);
  
  const filteredEvents = useMemo(() => 
    filterEventsBySearchTerm(events.flat(), searchTerm || ''),
    [events, searchTerm]
  );  

  const columns = useMemo(() => 
    createColumns(),
    [createColumns]
  );

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
      
      <EventNotification 
        alert={alert}
        onClose={handleCloseAlert}
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

export default PendingEventRequest;