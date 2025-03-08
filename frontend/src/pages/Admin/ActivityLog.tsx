import React, { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api.ts";

interface ActivityLog {
  id: number;
  action_type: string;
  target_type: string;
  target_name: string;
  performed_by: string;
  timestamp: string;
  expiration_date?: string;
  description?: string;
}

const ActivityLog: React.FC = () => {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  
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

  const columns: GridColDef[] = [
    { field: "action_type", headerName: "Action Type", flex: 1 },
    { field: "target_type", headerName: "Target Type", flex: 1 },
    { field: "target_name", headerName: "Target Name", flex: 1 },
    { field: "performed_by", headerName: "Performed By", flex: 1 },
    { field: "timestamp", headerName: "Timestamp", flex: 1 },
    { field: "description", headerName: "Description", flex: 2 },
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
      await apiClient.post(`/api/undo-delete/${id}`);
      alert("Action undone successfully!");
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error undoing action", error);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h2" textAlign="center" mb={4}>
        Activity Log
      </Typography>
      {loading ? (
        <CircularProgress color="secondary" />
      ) : (
        <Paper>
          <DataGrid rows={data} columns={columns} autoHeight />
        </Paper>
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

export default ActivityLog;