import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Button, CircularProgress, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api.ts";
import { ActivityLog } from "../../types.ts"
import { tokens } from "../../theme/theme.ts";
import { useSettingsStore } from "../../stores/settings-store.ts";
import { SearchContext } from "../../components/layout/SearchContext";


const ActivityLogList: React.FC = () => {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore(); 
  const { searchTerm } = useContext(SearchContext);

  
    const fetchData = async () => {
      try {
        const response = await apiClient.get(apiPaths.USER.ACTIVITYLOG);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

useEffect(() => {
    fetchData();
  }, []);

  const filteredActivityLogs = data.filter((activityLog) =>
    Object.values(activityLog)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );       

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "action_type", headerName: "Action Type", flex: 1 },
    { field: "target_type", headerName: "Type", flex: 1 },
    { field: "target_name", headerName: "Name", flex: 1 },
    { field: "performed_by", headerName: "Performed By", flex: 1 },
    { field: "timestamp", headerName: "Timestamp", flex: 1 },
    { field: "reason", headerName: "Reason", flex: 2 },
    {
        field: "actions",
        headerName: "Actions",
        width: 170,
        minWidth: 170,
        sortable: false,
        filterable: false,
        renderCell: (params: any) => {
            return (
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleUndo(params.row.id)}
                  sx={{ marginRight: "8px" }}
                >
                  Undo
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
      }
    ];

    const handleOpenDialog = (log: ActivityLog) => {
        setSelectedLog(log);
        setOpenDialog(true);
      };
    
      const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLog(null);
      };
  
      const handleDeleteConfirmed = async () => {
        if (selectedLog !== null) {
          try {
            await apiClient.delete(apiPaths.USER.DELETEACTIVITYLOG(selectedLog.id));
            fetchData();
          } catch (error) {
            console.error("Error deleting log:", error);
          }
          handleCloseDialog();
        }
      };

      const handleUndo = async (id: number) => {
        try {
          await apiClient.post(apiPaths.USER.UNDO_DELETE(id));
          alert("Action undone successfully!");
          setData((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
          console.error("Error undoing action", error);
        }
      };
      

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
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
        Activity Log
      </Typography>
      {loading ? (
        <CircularProgress color="secondary" />
      ) : (
        <Box sx={{ height: "78vh",
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
        rows={filteredActivityLogs}
        columns={columns}
        slots={{ toolbar: GridToolbar }}
        resizeThrottleMs={0}
        autoHeight
      />
    </Box>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Please confirm that you would like to permanently delete {selectedLog?.action_type} {selectedLog?.target_type}.</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is irreversible. Proceed with caution.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirmed} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivityLogList;