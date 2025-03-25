import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  useTheme,
  Snackbar,
  Alert,
  Tooltip,
  Stack
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { ActivityLog } from "../../types";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { fetchPendingRequests } from "./utils";

/**
 * Interface for notification state
 */
interface NotificationState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

/**
 * ActivityLogList component displays a list of activity logs with filtering and actions.
 */
const ActivityLogList: React.FC = () => {
  // State management
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info"
  });
  const [processingAction, setProcessingAction] = useState<number | null>(null);
  
  // Hooks and context
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  /**
   * Shows a notification message
   * @param message - The message to display
   * @param severity - The severity level of the notification
   */
  const showNotification = useCallback((
    message: string, 
    severity: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  /**
   * Closes the notification
   */
  const handleNotificationClose = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  /**
   * Fetches activity logs data from the API
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const logs = await fetchPendingRequests(apiPaths.USER.ACTIVITYLOG);
      setData(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error("Failed to fetch activity logs", error);
      showNotification("Failed to load activity logs", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Filters activity logs based on search term
   */
  const filteredActivityLogs = useMemo(() => 
    data.filter((activityLog) =>
      Object.values(activityLog)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ), 
    [data, searchTerm]
  );

  /**
   * Opens the confirmation dialog
   * @param log - The activity log to be operated on
   */
  const handleOpenDialog = useCallback((log: ActivityLog) => {
    setSelectedLog(log);
    setOpenDialog(true);
  }, []);

  /**
   * Closes the confirmation dialog
   */
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedLog(null);
  }, []);

  /**
   * Handles permanent deletion of an activity log
   */
  const handleDeleteConfirmed = useCallback(async () => {
    if (!selectedLog) return;
    
    try {
      setProcessingAction(selectedLog.id);
      await apiClient.delete(apiPaths.USER.DELETEACTIVITYLOG(selectedLog.id));
      await fetchData();
      showNotification("Log entry permanently deleted", "success");
    } catch (error) {
      console.error("Error deleting log:", error);
      showNotification("Failed to delete log entry", "error");
    } finally {
      setProcessingAction(null);
      handleCloseDialog();
    }
  }, [selectedLog, fetchData, handleCloseDialog, showNotification]);

  /**
   * Handles undoing an action based on activity log
   * @param id - The ID of the activity log
   */
  const handleUndo = useCallback(async (id: number) => {
    try {
      setProcessingAction(id);
      await apiClient.post(apiPaths.USER.UNDO_DELETE(id));
      showNotification("Action undone successfully!", "success");
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error undoing action", error);
      showNotification("Failed to undo action", "error");
    } finally {
      setProcessingAction(null);
    }
  }, [showNotification]);

  /**
   * Formats timestamp for display
   * @param timestamp - The timestamp to format
   */
  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return timestamp;
    }
  }, []);

  const columns: GridColDef[] = useMemo(() => [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "action_type", headerName: "Action Type", flex: 1 },
    { field: "target_type", headerName: "Type", flex: 1 },
    { field: "target_name", headerName: "Name", flex: 1 },
    { field: "performed_by", headerName: "Performed By", flex: 1, 
      renderCell: (params: GridRenderCellParams) => {
        const user = params.row.performed_by;
        if (!user) return "-";
        return `(${user.id}) ${user.first_name} ${user.last_name}`;
      },
    },
    { field: "timestamp", headerName: "Timestamp", flex: 1 },
    { field: "reason", headerName: "Reason", flex: 2 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<any, ActivityLog>) => {
        const isProcessing = processingAction === params.row.id;
        return (
          <Box>
            <Tooltip title="Undo this action">
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleUndo(params.row.id)}
                disabled={isProcessing}
                sx={{ marginRight: "8px" }}
              >
                {isProcessing ? <CircularProgress size={20} thickness={5} /> : "Undo"}
              </Button>
            </Tooltip>
            <Tooltip title="Delete this log entry permanently">
              <Button
                variant="contained"
                color="error"
                onClick={() => handleOpenDialog(params.row)}
                disabled={isProcessing}
              >
                Delete
              </Button>
            </Tooltip>
            </Box>
        );
      },
    }
  ], [formatTimestamp, handleOpenDialog, handleUndo, processingAction]);

  // DataGrid styles
  const dataGridStyles = {
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
      color: `${colors.blueAccent[400]} !important`,
    },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
      color: `${colors.blueAccent[500]} !important`,
    },
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        position: "relative",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Activity Log
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <Box sx={dataGridStyles}>
          <DataGrid
            rows={filteredActivityLogs}
            columns={columns}
            slots={{ toolbar: GridToolbar }}
            resizeThrottleMs={0}
            autoHeight
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: {
                sortModel: [{ field: 'timestamp', sort: 'desc' }],
              },
            }}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50, 100]}
            density="standard"
          />
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: "500px",
            backgroundColor: colors.primary[400],
          }
        }}
      >
        <DialogTitle>
          Confirm Permanent Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete the log entry for{' '}
            <strong>{selectedLog?.action_type}</strong> action on{' '}
            <strong>{selectedLog?.target_type}</strong> named{' '}
            <strong>{selectedLog?.target_name}</strong>?
            <br /><br />
            This action is irreversible and the log entry will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirmed} 
            color="error"
            disabled={processingAction === selectedLog?.id}
          >
            {processingAction === selectedLog?.id ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Delete Permanently"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ActivityLogList;
