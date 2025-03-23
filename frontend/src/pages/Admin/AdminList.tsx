// not refactored since 'view admin' and 'delete admin' are not working

import React, { useState, useEffect, useContext } from "react";
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
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";

const AdminList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const { user, setUser } = useAuthStore();
  const isSuperAdmin = user?.is_super_admin === true;
  const actionsColumnWidth = isSuperAdmin ? 170 : 85;

  const getData = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.ADMIN);
      const adminUsers = res.data.filter((user: any) => user.role === "admin");
      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.CURRENT);
      setUser(res.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  useEffect(() => {
    getData();
    getCurrentUser();
  }, []);

  // Filter admins based on search term (if provided)
  const filteredAdmins = admins.filter((admin) =>
    Object.values(admin)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      renderCell: (params: any) => (params.row.is_active ? "Yes" : "No"),
      flex: 1,
    },
    { field: "role", headerName: "Role", flex: 1 },
    {
      field: "is_super_admin",
      headerName: "Super Admin",
      renderCell: (params: any) => (params.row.is_super_admin ? "Yes" : "No"),
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: actionsColumnWidth,
      minWidth: actionsColumnWidth,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => {
        const adminId = params.row.id;
        const isSuperAdmin = user?.is_super_admin === true;
        
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewAdmin(adminId)}
              sx={{ marginRight: "8px" }}
            >
              View
            </Button>
            {isSuperAdmin && (
              <Button
                variant="contained"
                color="error"
                onClick={() => handleOpenDialog(params.row)}
              >
                Delete
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  const handleViewAdmin = (adminId: string) => {
    navigate(`/admin/view-admin/${adminId}`);
  };

  const handleOpenDialog = (admin: any) => {
    setSelectedAdmin(admin);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAdmin(null);
    setReason('');
  };

  const handleDeleteConfirmed = async (reason: string) => {
    if (selectedAdmin !== null) {
      try {
        await apiClient.request({
          method: "DELETE",
          url: apiPaths.USER.DELETE("Admin", selectedAdmin.id),
          data: { reason: reason },
        });
        getData();
      } catch (error) {
        console.error("Error deleting admin:", error);
      }
      handleCloseDialog();
    }
  };

  const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  };

  const handleConfirmDelete = () => {
    handleDeleteConfirmed(reason);
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
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
        Admin List
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
          rows={filteredAdmins}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          resizeThrottleMs={0}
          autoHeight
          getRowId={(row) => row.id}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          Please confirm that you would like to delete {selectedAdmin?.first_name} {selectedAdmin?.last_name}.
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You may undo this action in the Activity Log. <br />
            <strong>Compulsory:</strong> Provide a reason for deleting this admin.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
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
          <Button onClick={handleConfirmDelete} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminList;