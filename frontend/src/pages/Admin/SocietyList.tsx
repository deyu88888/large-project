import { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { Box, 
  Typography, 
  useTheme, 
  Button, 
  DialogContent,
  DialogTitle, 
  Dialog, 
  DialogContentText, 
  DialogActions, 
  TextField } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types';
import { useNavigate } from "react-router-dom";

/**
 * SocietyList Component
 * Displays a list of societies with options to view details or delete
 */
const SocietyList: React.FC = () => {
  // Hooks
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const ws = useRef<WebSocket | null>(null);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  
  // State
  const [societies, setSocieties] = useState<Society[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [reason, setReason] = useState<string>('');

  /**
   * Fetch societies from API
   */
  const fetchSocieties = useCallback(async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.SOCIETY);
      setSocieties(res.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  }, []);

  /**
   * Set up WebSocket connection for real-time updates
   */
  const connectWebSocket = useCallback(() => {
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws/admin/society/");

    ws.current.onopen = () => {
      console.log("WebSocket Connected for Society List");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Update Received:", data);
        fetchSocieties();
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onerror = (event) => {
      console.error("WebSocket Error:", event);
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket Disconnected:", event.reason);
      setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
  }, [fetchSocieties]);

  // Initialize data and WebSocket connection
  useEffect(() => {
    fetchSocieties();
    connectWebSocket();

    // Cleanup WebSocket on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket, fetchSocieties]);

  /**
   * Handle navigation to society detail view
   */
  const handleViewSociety = useCallback((societyId: string) => {
    navigate(`/admin/view-society/${societyId}`);
  }, [navigate]);

  /**
   * Open dialog for society deletion confirmation
   */
  const handleOpenDialog = useCallback((society: Society) => {
    setSelectedSociety(society);
    setOpenDialog(true);
  }, []);

  /**
   * Close dialog and reset state
   */
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedSociety(null);
    setReason('');
  }, []);

  /**
   * Process society deletion with reason
   */
  const handleDeleteConfirmed = useCallback(async (reason: string) => {
    if (selectedSociety !== null) {
      try {
        await apiClient.request({
          method: "DELETE",
          url: apiPaths.USER.DELETE("Society", selectedSociety.id),
          data: { reason: reason },
        });
        fetchSocieties();
      } catch (error) {
        console.error("Error deleting society:", error);
      }
      handleCloseDialog();
    }
  }, [selectedSociety, fetchSocieties, handleCloseDialog]);

  /**
   * Handle changes to deletion reason input
   */
  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  }, []);

  /**
   * Handle delete confirmation button click
   */
  const handleConfirmDelete = useCallback(() => {
    handleDeleteConfirmed(reason);
  }, [reason, handleDeleteConfirmed]);

  /**
   * Filter societies based on search term
   */
  const filteredSocieties = useMemo(
    () =>
      societies.filter((society) =>
        Object.values(society)
          .join(" ")
          .toLowerCase()
          .includes((searchTerm || '').toLowerCase())
      ),
    [societies, searchTerm]
  );

  /**
   * Column definitions for the DataGrid
   */
  const columns: GridColDef[] = useMemo(() => [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "president",
      headerName: "President",
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) => {
        const pres = params.row.president;
        return pres ? `${pres.first_name} ${pres.last_name}` : "N/A";
      },
    },
    {
      field: "society_members",
      headerName: "Members",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams) => {
        const members = params.row.society_members;
        return Array.isArray(members) ? members.length : "0";
      },
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
      renderCell: (params: GridRenderCellParams) => {
        const societyId = params.row.id;
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewSociety(societyId)}
              sx={{ marginRight: "8px" }}
            >
              View
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleOpenDialog(params.row)}
            >
              Delete
            </Button>
          </Box>
        );
      },
    },
  ], [handleViewSociety, handleOpenDialog]);

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
          rows={filteredSocieties}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          resizeThrottleMs={0}
        />
      </Box>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
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
            onChange={handleReasonChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            disabled={!reason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocietyList;