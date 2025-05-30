import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Box, 
  Typography, 
  useTheme, 
  Button, 
  DialogContent,
  DialogTitle, 
  Dialog, 
  DialogContentText, 
  DialogActions, 
  TextField, 
  Snackbar} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types';
import { useNavigate } from "react-router-dom";
import {
  SocietyDialogState,
  ActionButtonsProps,
  DataGridContainerProps,
  DeleteDialogProps,
  PresidentCellProps,
  MembersCellProps
} from "../../types/admin/SocietyList";
import { NotificationState } from "../../types/admin/StudentList";

const filterSocietiesBySearchTerm = (societies: Society[], searchTerm: string): Society[] => {
  if (!searchTerm) return societies;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return societies.filter((society) =>
    Object.values(society)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};

const fetchSocietyList = async (): Promise<Society[]> => {
  const res = await apiClient.get(apiPaths.USER.SOCIETY);
  return res.data;
};

const deleteSociety = async (societyId: number | string, reason: string): Promise<void> => {
  await apiClient.request({
    method: "DELETE",
    url: apiPaths.USER.DELETE("Society", Number(societyId)),
    data: { reason },
  });
};

const PresidentCell: React.FC<PresidentCellProps> = ({ president }) => {
  return (
    <Typography>
      {president ? `${president.first_name} ${president.last_name}` : "N/A"}
    </Typography>
  );
};

const MembersCell: React.FC<MembersCellProps> = ({ members }) => {
  return (
    <Typography>
      {Array.isArray(members) ? members.length : "0"}
    </Typography>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  societyId, 
  onView, 
  onDelete,
  society
}) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(societyId.toString())}
        sx={{ marginRight: "8px" }}
      >
        View
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => onDelete(society)}
      >
        Delete
      </Button>
    </Box>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({ 
  societies, 
  columns, 
  colors, 
  drawer 
}) => {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
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
        }}
      >
        <DataGrid
          rows={societies}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          resizeThrottleMs={0}
        />
      </Box>
    </Box>
  );
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({ 
  state, 
  onClose, 
  onReasonChange, 
  onConfirm 
}) => {
  const { open, reason, selectedSociety } = state;
  const isConfirmDisabled = !reason.trim();
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Please confirm that you would like to delete {selectedSociety?.name}.
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You may undo this action in the Activity Log. <br />
          <strong>Compulsory:</strong> Provide a reason for deleting this student.
        </DialogContentText>
        <TextField
          autoFocus
          label="Reason for Deletion"
          fullWidth
          variant="standard"
          value={reason}
          onChange={onReasonChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={isConfirmDisabled}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const createSocietyColumns = (
  handleViewSociety: (id: string) => void,
  handleOpenDialog: (society: Society) => void
): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "president",
      headerName: "President",
      flex: 0.8,
      renderCell: (params) => `${params.value.first_name} ${params.value.last_name}`,
    },
    {
      field: "society_members",
      headerName: "Members",
      flex: 0.5,
      renderCell: (params) => `${params.value.length}`,
    },
    { field: "approved_by", headerName: "Approved By", flex: 0.5 },
    { field: "category", headerName: "Category", flex: 1.3 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButtons 
          societyId={params.row.id}
          society={params.row}
          onView={handleViewSociety}
          onDelete={handleOpenDialog}
        />
      ),
    },
  ];
};

/**
 * SocietyList Component
 * Displays a list of societies with options to view details or delete
 */
const SocietyList: React.FC = () => {
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info"
  });
  const [societies, setSocieties] = useState<Society[]>([]);
  const [dialogState, setDialogState] = useState<SocietyDialogState>({
    open: false,
    reason: '',
    selectedSociety: null
  });

  const loadSocieties = useCallback(async () => {
    try {
      const data = await fetchSocietyList();
      setSocieties(data);
    } catch (error) {
      console.error("Error fetching societies:", error);
      setNotification({
        open: true,
        message: `Failed to load societies: ${error.response?.data?.message || "Unknown error"}`,
        severity: "error"
      });
    }
  }, []);

  useEffect(() => {
    loadSocieties();
  }, [loadSocieties]);

  const handleViewSociety = useCallback((societyId: string) => {
    navigate(`/admin/view-society/${societyId}`);
  }, [navigate]);

  const handleOpenDialog = useCallback((society: Society) => {
    setDialogState({
      open: true,
      reason: '',
      selectedSociety: society
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState({
      open: false,
      reason: '',
      selectedSociety: null
    });
  }, []);

  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDialogState(prev => ({
      ...prev,
      reason: event.target.value
    }));
  }, []);

  const handleNotificationClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    const { selectedSociety, reason } = dialogState;
    
    if (!selectedSociety) return;
    
    try {
      await deleteSociety(selectedSociety.id, reason);
      setNotification({
        open: true,
        message: `Society "${selectedSociety.name}" was successfully deleted.`,
        severity: "success"
      });
      loadSocieties();
    } catch (error) {
      console.error("Error deleting society:", error);
      setNotification({
        open: true,
        message: `Failed to delete society: ${error.response?.data?.message || "Unknown error"}`,
        severity: "error"
      });
    }
    
    handleCloseDialog();
  }, [dialogState, loadSocieties, handleCloseDialog]);

  const filteredSocieties = useMemo(() => 
    filterSocietiesBySearchTerm(societies, searchTerm || ''),
    [societies, searchTerm]
  );

  const columns = useMemo(() => 
    createSocietyColumns(handleViewSociety, handleOpenDialog),
    [handleViewSociety, handleOpenDialog]
  );

  return (
    <>
      <DataGridContainer 
        societies={filteredSocieties}
        columns={columns}
        colors={colors}
        drawer={drawer}
      />
      
      <DeleteDialog 
        state={dialogState}
        onClose={handleCloseDialog}
        onReasonChange={handleReasonChange}
        onConfirm={handleDeleteConfirmed}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={notification.message}
        ContentProps={{
          sx: {
            backgroundColor: notification.severity === "success" ? "green" : 
                            notification.severity === "error" ? "red" : 
                            notification.severity === "warning" ? "orange" : "blue"
          }
        }}
      />
    </>
  );
};

export default SocietyList;