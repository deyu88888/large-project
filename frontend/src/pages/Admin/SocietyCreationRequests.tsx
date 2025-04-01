import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Box, useTheme, Button, Typography, Alert, Snackbar } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { updateRequestStatus } from "../../api/requestApi";
import { apiPaths } from "../../api";
import { fetchPendingRequests } from "./utils";
import {
  Society,
  ProcessedSociety,
  NotificationState,
  ActionButtonsProps,
  NotificationProps,
  TruncatedCellProps,
  EmptyStateProps,
  DataGridContainerProps
} from "../../types/admin/SocietyCreationRequests";

const processSocietyMembers = (society: Society): ProcessedSociety => {
  return {
    ...society,
    society_members: Array.isArray(society.society_members)
      ? society.society_members.join(", ")
      : society.society_members as string,
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

const ActionButtons: React.FC<ActionButtonsProps> = ({ societyId, onStatusChange }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="contained"
        color="success"
        onClick={() => onStatusChange(societyId, "Approved")}
        size="small"
      >
        Accept
      </Button>
      <Button 
        variant="contained" 
        color="error" 
        onClick={() => onStatusChange(societyId, "Rejected")}
        size="small"
      >
        Reject
      </Button>
    </Box>
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
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          loading={loading}
        />
      </Box>
    </Box>
  );
};

const createSocietyColumns = (
  handleStatusChange: (id: number, status: "Approved" | "Rejected") => void
): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    { 
      field: "description", 
      headerName: "Description", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <TruncatedCell value={params.value as string} />
      )
    },
    {      
      field: "society_members",
      headerName: "Members",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <TruncatedCell value={params.value as string} />
      )
    },
    { field: "president", headerName: "President", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { 
      field: "membershipRequirements", 
      headerName: "Membership Requirements", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <TruncatedCell value={params.value as string} />
      )
    },
    { 
      field: "upcomingProjectsOrPlans", 
      headerName: "Upcoming Projects", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <TruncatedCell value={params.value as string} />
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
        <ActionButtons 
          societyId={params.row.id} 
          onStatusChange={handleStatusChange} 
        />
      ),
      flex: 1.6,
    },
  ];
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

  const handleStatusChange = useCallback(async (id: number, status: "Approved" | "Rejected") => {
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

  const processedSocieties = useMemo(() => 
    processSocieties(societies),
    [societies]
  );

  const filteredSocieties = useMemo(() => 
    filterSocietiesBySearchTerm(processedSocieties, searchTerm || ''),
    [processedSocieties, searchTerm]
  );

  const columns = useMemo(() => 
    createSocietyColumns(handleStatusChange),
    [handleStatusChange]
  );

  return (
    <>
      <DataGridContainer 
        societies={filteredSocieties}
        columns={columns}
        colors={colors}
        loading={loading}
        drawer={drawer}
      />

      <NotificationAlert 
        notification={notification}
        onClose={handleCloseNotification}
      />
    </>
  );
};

export default SocietyCreationRequests;