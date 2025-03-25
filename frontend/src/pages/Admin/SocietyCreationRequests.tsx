import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Box, useTheme, Button, Typography, Alert, Snackbar } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { updateRequestStatus } from "../../api/requestApi";
import { apiPaths } from "../../api";
import { fetchPendingRequests } from "./utils";

/**
 * Interface for Society data
 */
interface Society {
  id: number;
  name: string;
  description: string;
  president: string;
  society_members: string[] | string;
  category: string;
  membershipRequirements: string;
  upcomingProjectsOrPlans: string;
  [key: string]: any;
}

/**
 * PendingSocietyRequest Component
 * Displays and manages pending society requests that need approval or rejection
 */
const PendingSocietyRequest: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  // State for societies and notifications
  const [societies, setSocieties] = useState<Society[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch societies using WebSocket hook
  const fetchedSocieties = useFetchWebSocket<Society[]>(
    () => fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST), 
    'society'
  );
  
  // Update societies state when data from WebSocket changes
  useEffect(() => {
    if (Array.isArray(fetchedSocieties)) {
      setSocieties(fetchedSocieties);
    }
  }, [fetchedSocieties]);

  /**
   * Close notification handler
   */
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * Handle status change (approve/reject)
   */
  const handleStatusChange = useCallback(async (id: number, status: "Approved" | "Rejected") => {
    try {
      // Optimistically update UI
      const updatedSocieties = societies.filter(society => society.id !== id);
      setSocieties(updatedSocieties);
      
      // Send request to API
      await updateRequestStatus(id, status, apiPaths.USER.PENDINGSOCIETYREQUEST);
      
      // Show success notification
      setNotification({
        open: true,
        message: `Society ${status === "Approved" ? "approved" : "rejected"} successfully.`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Error updating society status:`, error);
      
      // Show error notification
      setNotification({
        open: true,
        message: `Failed to ${status.toLowerCase()} society request.`,
        severity: 'error'
      });
      
      // Refetch data to restore state
      const data = await fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST);
      if (Array.isArray(data)) {
        setSocieties(data);
      }
    }
  }, [societies]);

  /**
   * Process society data to prepare for display
   */
  const processedSocieties = useMemo(() => {
    if (!Array.isArray(societies)) return [];
    
    return societies.map((society) => ({
      ...society,
      society_members: Array.isArray(society.society_members) 
        ? society.society_members.join(", ") 
        : society.society_members,
    }));
  }, [societies]);

  /**
   * Filter societies based on search term
   */
  const filteredSocieties = useMemo(() => {
    if (!Array.isArray(processedSocieties)) return [];
    
    return processedSocieties.filter((society) => {
      const searchString = Object.entries(society)
        .map(([key, value]) => String(value))
        .join(" ")
        .toLowerCase();
      return searchString.includes((searchTerm || '').toLowerCase());
    });
  }, [processedSocieties, searchTerm]);

  /**
   * Column definitions for DataGrid
   */
  const columns: GridColDef[] = useMemo(() => [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    { 
      field: "description", 
      headerName: "Description", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap title={params.value as string}>
          {params.value}
        </Typography>
      )
    },
    {      
      field: "society_members",
      headerName: "Members",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap title={params.value as string}>
          {params.value}
        </Typography>
      )
    },
    { field: "president", headerName: "President", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { 
      field: "membershipRequirements", 
      headerName: "Membership Requirements", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap title={params.value as string}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: "upcomingProjectsOrPlans", 
      headerName: "Upcoming Projects", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography noWrap title={params.value as string}>
          {params.value}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 188,
      minWidth: 188,
      sortable: false,
      filterable: false, 
      renderCell: (params: GridRenderCellParams<any, Society>) => (
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
      flex: 1.6,
    },
  ], [handleStatusChange]);

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
          rows={filteredSocieties}
          columns={columns}
          slots={{ 
            toolbar: GridToolbar,
            noRowsOverlay: () => (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography variant="h6" color={colors.grey[100]}>
                  No pending society requests found
                </Typography>
              </Box>
            ),
          }}
          autoHeight
          resizeThrottleMs={0}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          loading={societies.length === 0}
        />
      </Box>

      {/* Notification for operations */}
      <Snackbar 
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingSocietyRequest;