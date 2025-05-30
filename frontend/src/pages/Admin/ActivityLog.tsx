import React, { useState, useEffect, useContext, useMemo } from "react";
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
import { fetchPendingRequests } from "../../utils/utils";
import { 
  NotificationState, 
  ActivityLogListProps, 
  ProcessingState, 
  ActionButtonsProps, 
  ConfirmDeleteDialogProps, 
  NotificationAlertProps 
} from "../../types/admin/ActivityLog";

const ActionButtons: React.FC<ActionButtonsProps> = ({ row, processing, onUndo, onDelete }) => {
  const isProcessing = processing.id === row.id && processing.isProcessing;
  
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }} >
      <Tooltip title="Undo this action">
        <Button
          variant="contained"
          color="primary"
          onClick={() => onUndo(row.id)}
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
          onClick={() => onDelete(row)}
          disabled={isProcessing}
        >
          Delete
        </Button>
      </Tooltip>
    </Stack>
  );
};

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({ open, log, processing, onClose, onConfirm, colors }) => {
  const isProcessing = processing.id === log?.id && processing.isProcessing;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
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
          <strong>{log?.action_type}</strong> action on{' '}
          <strong>{log?.target_type}</strong> named{' '}
          <strong>{log?.target_name}</strong>?
          <br /><br />
          This action is irreversible and the log entry will be permanently removed.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Delete Permanently"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NotificationAlert: React.FC<NotificationAlertProps> = ({ notification, onClose }) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert 
        onClose={onClose} 
        severity={notification.severity}
        sx={{ width: "100%" }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

const LoadingIndicator: React.FC = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
      <CircularProgress color="secondary" />
    </Box>
  );
};

const ActivityLogList: React.FC<ActivityLogListProps> = () => {
  
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info"
  });
  const [processing, setProcessing] = useState<ProcessingState>({
    id: null,
    isProcessing: false
  });
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);

  const showNotification = (
    message: string, 
    severity: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleNotificationClose = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const setIsProcessing = (id: number | null, isProcessing: boolean) => {
    setProcessing({ id, isProcessing });
  };

  const fetchData = async () => {
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
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleOpenDialog = (log: ActivityLog) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedLog) return;
    
    try {
      setIsProcessing(selectedLog.id, true);
      await apiClient.delete(apiPaths.USER.DELETEACTIVITYLOG(selectedLog.id));
      await fetchData();
      showNotification("Log entry permanently deleted", "success");
    } catch (error) {
      console.error("Error deleting log:", error);
      showNotification("Failed to delete log entry", "error");
    } finally {
      setIsProcessing(null, false);
      handleCloseDialog();
    }
  };

  const handleUndo = async (id: number) => {
    try {
      setIsProcessing(id, true);
      await apiClient.post(apiPaths.USER.UNDO_DELETE(id));
      showNotification("Action undone successfully!", "success");
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error undoing action", error);
      showNotification("Failed to undo action", "error");
    } finally {
      setIsProcessing(null, false);
    }
  };
  
  const filteredActivityLogs = useMemo(() => 
    data.filter((activityLog) =>
      Object.values(activityLog)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ), 
    [data, searchTerm]
  );

  const getColumns = (): GridColDef[] => [
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
      renderCell: (params: GridRenderCellParams<any, ActivityLog>) => (
        <ActionButtons 
          row={params.row} 
          processing={processing}
          onUndo={handleUndo} 
          onDelete={handleOpenDialog} 
        />
      ),
    }
  ];
  
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
      color: `${colors.blueAccent[400]} !important`,
    },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
      color: `${colors.blueAccent[500]} !important`,
    },
  });

  const getContainerStyles = () => ({
    height: "calc(100vh - 64px)",
    maxWidth: drawer ? `calc(100% - 3px)` : "100%",
    position: "relative",
  });

  const getTitleStyles = () => ({
    color: colors.grey[100],
    fontSize: "1.75rem",
    fontWeight: 800,
    marginBottom: "1rem",
  });

  return (
    <Box sx={getContainerStyles()}>
      <Typography variant="h1" sx={getTitleStyles()}>
        Activity Log
      </Typography>
      
      {loading ? (
        <LoadingIndicator />
      ) : (
        <Box sx={getDataGridStyles()}>
          <DataGrid
            rows={filteredActivityLogs}
            columns={getColumns()}
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

      <ConfirmDeleteDialog
        open={openDialog}
        log={selectedLog}
        processing={processing}
        onClose={handleCloseDialog}
        onConfirm={handleDeleteConfirmed}
        colors={colors}
      />

      <NotificationAlert
        notification={notification}
        onClose={handleNotificationClose}
      />
    </Box>
  );
};

export default ActivityLogList;