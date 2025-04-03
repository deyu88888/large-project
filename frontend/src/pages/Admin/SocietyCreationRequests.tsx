import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Box, useTheme, Button, Typography, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { updateRequestStatus } from "../../api/requestApi";
import { apiClient, apiPaths } from "../../api";
import { fetchPendingRequests } from "../../utils/utils";
import { SocietyPreview } from "../../components/SocietyPreview";
import {
  Society,
  ProcessedSociety,
  NotificationState,
  ActionButtonsProps,
  NotificationProps,
  TruncatedCellProps,
  EmptyStateProps,
  DataGridContainerProps,
  SocietyData,
  RejectionDialogProps
} from "../../types/admin/SocietyCreationRequests";
import { mapSocietyRequestToSociety } from "../../utils/mapper";

const processSocietyMembers = (society: Society): ProcessedSociety => {
  return {
    ...society,
    society_members: Array.isArray(society.society_members)
      ? society.society_members.join(", ")
      : String(society.society_members),
  };
};

const processSocieties = (societies: Society[]): ProcessedSociety[] => {
  if (!Array.isArray(societies)) return [];
  return societies.map(processSocietyMembers);
};

const filterSocietiesBySearchTerm = (societies: ProcessedSociety[], searchTerm: string): ProcessedSociety[] => {
  if (!Array.isArray(societies)) return [];
  if (!searchTerm) return societies;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return societies.filter((society) => {
    const searchString = Object.entries(society)
      .map(([key, value]) => String(value))
      .join(" ")
      .toLowerCase();
    return searchString.includes(normalizedSearchTerm);
  });
};

const TruncatedCell: React.FC<TruncatedCellProps> = ({ value }) => {
  return (
    <Typography noWrap title={value}>
      {value}
    </Typography>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ societyId, society, onStatusChange, onView, onReject }) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(society)}
        sx={{ marginRight: "8px" }}
      >
        View
      </Button>
      <Button
        variant="contained"
        color="success"
        onClick={() => onStatusChange(societyId, "Approved")}
        sx={{ marginRight: "8px" }}
      >
        Accept
      </Button>
      <Button 
        variant="contained" 
        color="error" 
        onClick={() => onReject(societyId)}
      >
        Reject
      </Button>
    </Box>
  );
};

const RejectionDialog: React.FC<RejectionDialogProps> = ({ 
  open, 
  societyId, 
  societyName,
  onClose, 
  onConfirm
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  const handleClose = () => {
    setReason("");
    setError(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(societyId, reason);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Reject Society Request
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please provide a reason for rejecting the request for "{societyName}".
        </Typography>
        <TextField
          autoFocus
          label="Rejection Reason"
          fullWidth
          multiline
          rows={4}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (e.target.value.trim()) {
              setError(false);
            }
          }}
          error={error}
          helperText={error ? "A rejection reason is required" : ""}
          sx={{ mt: 1 }}
          placeholder="Please explain why this society request is being rejected..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Reject Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NotificationAlert: React.FC<NotificationProps> = ({ notification, onClose }) => {
  return (
    <Snackbar 
      open={notification.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={notification.severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ colors }) => {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
      <Typography variant="h6" color={colors.grey[100]}>
        No pending society requests found
      </Typography>
    </Box>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({ 
  societies, 
  columns, 
  colors, 
  loading,
  drawer 
}) => {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
      }}
    >
      <Box
        sx={{
          height: "78vh",
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeader": { whiteSpace: "normal", wordBreak: "break-word" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
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
          rows={societies}
          columns={columns}
          slots={{ 
            toolbar: GridToolbar,
            noRowsOverlay: () => <EmptyState colors={colors} />
          }}
          autoHeight
          resizeThrottleMs={0}
          disableRowSelectionOnClick
          loading={loading}
        />
      </Box>
    </Box>
  );
};

const SocietyCreationRequests: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState<SocietyData | null>(null);
  
  // Rejection dialog state
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [societyToReject, setSocietyToReject] = useState<{id: number, name: string} | null>(null);
  
  const fetchSocieties = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST);
      if (Array.isArray(data)) {
        setSocieties(data);
      }
    } catch (error) {
      console.error("Error fetching pending society requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchSocieties();
  }, [fetchSocieties]);
  
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const showNotification = useCallback((message: string, severity: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const updateSocietiesAfterStatusChange = useCallback((societyId: number) => {
    setSocieties(prevSocieties => 
      prevSocieties.filter(society => society.id !== societyId)
    );
  }, []);

  const handleViewSociety = useCallback((society: SocietyData) => {
    setSelectedSociety(society);
    setPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);
  
  const handleOpenRejectDialog = useCallback((societyId: number) => {
    const society = societies.find(s => s.id === societyId);
    if (society) {
      setSocietyToReject({ id: societyId, name: society.name });
      setRejectionDialogOpen(true);
    }
  }, [societies]);
  
  const handleCloseRejectDialog = useCallback(() => {
    setRejectionDialogOpen(false);
    setSocietyToReject(null);
  }, []);

  const handleStatusChange = useCallback(async (id: number, status: "Approved") => {
    try {
      updateSocietiesAfterStatusChange(id);
      
      await updateRequestStatus(id, status, apiPaths.USER.PENDINGSOCIETYREQUEST);
      
      showNotification(
        `Society ${status === "Approved" ? "approved" : "rejected"} successfully.`, 
        'success'
      );
    } catch (error) {
      console.error(`Error updating society status:`, error);
      
      showNotification(
        `Failed to ${status.toLowerCase()} society request.`, 
        'error'
      );
      
      fetchSocieties();
    }
  }, [updateSocietiesAfterStatusChange, showNotification, fetchSocieties]);
  
  const handleRejectWithReason = useCallback(async (id: number, reason: string) => {
    try {
      updateSocietiesAfterStatusChange(id);
      
      // Send rejection with reason to backend
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, {
        approved: false,
        rejection_reason: reason
      });
      
      showNotification("Society rejected successfully.", 'success');
    } catch (error) {
      console.error("Error rejecting society:", error);
      
      showNotification("Failed to reject society request.", 'error');
      fetchSocieties();
    }
  }, [updateSocietiesAfterStatusChange, showNotification, fetchSocieties]);

  const processedSocieties = useMemo(() => 
    processSocieties(societies),
    [societies]
  );

  const filteredSocieties = useMemo(() => 
    filterSocietiesBySearchTerm(processedSocieties, searchTerm || ''),
    [processedSocieties, searchTerm]
  );

  const societyData = useMemo(() => {
    return (filteredSocieties ?? []).map(mapSocietyRequestToSociety);
  }, [filteredSocieties]);

  const columns = useMemo(() => [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    { 
      field: "president", 
      headerName: "President", 
      flex: 1,
      renderCell: (params) => {
        const president = params.value;
        return president ? `${president.first_name} ${president.last_name}` : "Unassigned";
      },
    },
    { field: "category", headerName: "Category", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.4,
      width: 255,
      minWidth: 255,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<any>) => (
        <ActionButtons
          societyId={params.row.id}
          society={params.row}
          onStatusChange={handleStatusChange}
          onView={handleViewSociety}
          onReject={handleOpenRejectDialog}
        />
      ),
    },
  ], [handleStatusChange, handleViewSociety, handleOpenRejectDialog]);

  return (
    <>
      <DataGridContainer 
        societies={processedSocieties}
        columns={columns}
        colors={colors}
        loading={loading}
        drawer={drawer}
      />

      {selectedSociety && (
        <SocietyPreview
          open={previewOpen}
          onClose={handleClosePreview}
          society={mapSocietyRequestToSociety(selectedSociety)} 
          loading={false} 
          joined={0} 
          onJoinSociety={function (societyId: number): void {
            throw new Error("Function not implemented.");
          }}               
        />
      )}
      
      {societyToReject && (
        <RejectionDialog
          open={rejectionDialogOpen}
          societyId={societyToReject.id}
          societyName={societyToReject.name}
          onClose={handleCloseRejectDialog}
          onConfirm={handleRejectWithReason}
        />
      )}

      <NotificationAlert 
        notification={notification}
        onClose={handleCloseNotification}
      />
    </>
  );
};

export default SocietyCreationRequests;