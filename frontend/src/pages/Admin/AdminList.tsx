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
  TextField 
} from "@mui/material";
import { DataGrid, GridToolbar, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";


interface AdminUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role: string;
  is_super_admin: boolean;
  [key: string]: any;
}

interface User {
  is_super_admin?: boolean;
  [key: string]: any;
}

interface DeleteDialogProps {
  open: boolean;
  admin: AdminUser | null;
  reason: string;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onConfirm: () => void;
}

interface HeaderProps {
  colors: any;
  theme: any;
}

interface DataGridContainerProps {
  filteredAdmins: AdminUser[];
  columns: GridColDef[];
  colors: any;
  drawer: boolean;
}

interface ActionButtonsProps {
  adminId: string;
  admin: AdminUser;
  isSuperAdmin: boolean;
  onView: (id: string) => void;
  onDelete: (admin: AdminUser) => void;
}


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
        <Button onClick={onClose} color="primary">
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

  const handleConfirmDelete = async () => {
    if (selectedAdmin === null) return;
    
    try {
      await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("Admin", selectedAdmin.id),
        data: { reason },
      });
      await fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
    handleCloseDialog();
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
    </Box>
  );
};

export default AdminList;