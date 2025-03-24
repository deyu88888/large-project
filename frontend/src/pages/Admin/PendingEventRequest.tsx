import React, { useContext, useCallback, useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
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

// Define interfaces for type safety
interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: string;
  hostedBy: string;
  location: string;
  [key: string]: any; // Allow for additional properties
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

/**
 * PendingEventRequest Component
 * Displays and manages pending event requests that need approval or rejection
 */
const PendingEventRequest: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  // State for alerts/notifications
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch pending event requests using WebSocket
  const events = useFetchWebSocket<Event[]>(
    () => fetchPendingRequests(apiPaths.EVENTS.PENDINGEVENTREQUEST),
    'event'
  );

  // Filter events based on search term - memoized for performance
  const filteredEvents = useMemo(() => 
    events.filter((event) =>
      Object.values(event)
        .join(" ")
        .toLowerCase()
        .includes((searchTerm || '').toLowerCase())
    ),
    [events, searchTerm]
  );

  // Handle status change (approve/reject)
  const handleStatusChange = useCallback(async (id: number, status: "Approved" | "Rejected") => {
    try {
      await updateRequestStatus(id, status, apiPaths.EVENTS.UPDATEENEVENTREQUEST);
      setAlert({
        open: true,
        message: `Event ${status.toLowerCase()} successfully.`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Error updating event status:`, error);
      setAlert({
        open: true,
        message: `Failed to ${status.toLowerCase()} event.`,
        severity: 'error'
      });
    }
  }, []);

  // Close alert handler
  const handleCloseAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  // Column definitions
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "title", headerName: "Title", flex: 1 },
    { 
      field: "description", 
      headerName: "Description", 
      flex: 2,
      renderCell: (params) => (
        <Typography noWrap title={params.value}>
          {params.value}
        </Typography>
      ) 
    },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "startTime", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hostedBy", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.6,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<any, Event>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusChange(params.row.id, "Approved")}
            size="small"
          >
            Accept
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => handleStatusChange(params.row.id, "Rejected")}
            size="small"
          >
            Reject
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        p: 2
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Pending Event Requests
      </Typography>
      
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
          rows={filteredEvents}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          disableRowSelectionOnClick
          resizeThrottleMs={0}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          loading={events.length === 0}
        />
      </Box>
      
      {/* Alert for success/failure messages */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingEventRequest;