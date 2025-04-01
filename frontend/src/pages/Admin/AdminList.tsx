import React, { useState, useEffect, useContext, FC } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Button, 
  DialogContent, 
  DialogTitle, 
  Dialog, 
  DialogContentText, 
  DialogActions, 
  TextField, 
  Snackbar
} from "@mui/material";
import { DataGrid, GridToolbar, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import {
  AdminUser,
  DeleteDialogProps,
  HeaderProps,
  DataGridContainerProps,
  ActionButtonsProps
} from "../../types/admin/AdminList";
import { NotificationState } from "../../types/admin/StudentList";


const Header: FC<HeaderProps> = ({ colors, theme }) => {
  return (
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
  );
};


const DataGridContainer: FC<DataGridContainerProps> = ({ 
  filteredAdmins, 
  columns, 
  colors,
  drawer
}) => {
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

  const containerStyles = {
    height: "calc(100vh - 64px)",
    maxWidth: drawer ? `calc(100% - 3px)` : "100%",
  };

  return (
    <Box sx={containerStyles}>
      <Box sx={dataGridStyles}>
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
    </Box>
  );
};


const DeleteDialog: FC<DeleteDialogProps> = ({ 
  open, 
  admin, 
  reason, 
  onReasonChange, 
  onClose, 
  onConfirm 
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Please confirm that you would like to delete {admin?.first_name} {admin?.last_name}.
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
          onChange={onReasonChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const ActionButtons: FC<ActionButtonsProps> = ({ 
  adminId, 
  admin, 
  isSuperAdmin, 
  onView, 
  onDelete 
}) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(adminId)}
        sx={{ marginRight: "8px" }}
      >
        View
      </Button>
      {isSuperAdmin && (
        <Button
          variant="contained"
          color="error"
          onClick={() => onDelete(admin)}
        >
          Delete
        </Button>
      )}
    </Box>
  );
};


const AdminList: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const { user, setUser } = useAuthStore();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info"
  });
  
  const isSuperAdmin = user?.is_super_admin === true;
  const actionsColumnWidth = isSuperAdmin ? 170 : 85;

  const fetchAdmins = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.ADMIN);
      const adminUsers = res.data.filter((user: any) => user.role === "admin");
      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };
  
  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.CURRENT);
      setUser(res.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCurrentUser();
  }, []);

  const getFilteredAdmins = () => {
    return admins.filter((admin) =>
      Object.values(admin)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  };
  
  const handleViewAdmin = (adminId: string) => {
    navigate(`/admin/view-admin/${adminId}`);
  };

  const handleOpenDialog = (admin: AdminUser) => {
    if (admin.id === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    setSelectedAdmin(admin);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAdmin(null);
    setReason('');
  };

  const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  };

  const handleNotificationClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleConfirmDelete = async () => {
    if (selectedAdmin === null) return;
    
    if (!reason.trim()) {
      alert("Please provide a reason for deletion");
      return;
    }
    
    try {
      await apiClient.delete(
        apiPaths.USER.DELETE("Admin", selectedAdmin.id),
        { 
          data: { reason: reason.trim() }  
        }
      );
      
      await fetchAdmins();
      setNotification({
        open: true,
        message: `Admin ${selectedAdmin.first_name} ${selectedAdmin.last_name} was successfully deleted.`,
        severity: "success"
      });
      handleCloseDialog();
    } catch (error) {
      console.error("Error deleting admin:", error);
      
      if (error.response) {
        console.error("Response data:", error.response.data);
        
        if (error.response.data && error.response.data.error) {
          alert(`Error: ${error.response.data.error}`);
        } else {
          alert("Failed to delete admin. Please try again.");
        }
      } else {
        alert("Error deleting admin. Please try again.");
      }
    }
  };
  
  const getColumns = (): GridColDef[] => [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      renderCell: (params: GridRenderCellParams) => (params.row.is_active ? "Yes" : "No"),
      flex: 1,
    },
    { field: "role", headerName: "Role", flex: 1 },
    {
      field: "is_super_admin",
      headerName: "Super Admin",
      renderCell: (params: GridRenderCellParams) => (params.row.is_super_admin ? "Yes" : "No"),
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: actionsColumnWidth,
      minWidth: actionsColumnWidth,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButtons
          adminId={params.row.id}
          admin={params.row}
          isSuperAdmin={isSuperAdmin}
          onView={handleViewAdmin}
          onDelete={handleOpenDialog}
        />
      ),
    },
  ];
  
  const filteredAdmins = getFilteredAdmins();
  const columns = getColumns();

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Header colors={colors} theme={theme} />
      
      <DataGridContainer 
        filteredAdmins={filteredAdmins}
        columns={columns}
        colors={colors}
        drawer={drawer}
      />
      
      <DeleteDialog
        open={openDialog}
        admin={selectedAdmin}
        reason={reason}
        onReasonChange={handleReasonChange}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
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
    </Box>
  );
};

export default AdminList;