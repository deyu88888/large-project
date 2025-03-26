import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useContext } from "react";
import { Box, Typography, useTheme, Button, DialogContent, DialogTitle, Dialog, DialogContentText, DialogActions, TextField } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
const Header = ({ colors, theme }) => {
    return (_jsx(Typography, { variant: "h1", sx: {
            color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "1rem",
        }, children: "Admin List" }));
};
const DataGridContainer = ({ filteredAdmins, columns, colors, drawer }) => {
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
    return (_jsx(Box, { sx: containerStyles, children: _jsx(Box, { sx: dataGridStyles, children: _jsx(DataGrid, { rows: filteredAdmins, columns: columns, slots: { toolbar: GridToolbar }, resizeThrottleMs: 0, autoHeight: true, getRowId: (row) => row.id, initialState: {
                    pagination: {
                        paginationModel: { pageSize: 25, page: 0 },
                    },
                }, pageSizeOptions: [5, 10, 25] }) }) }));
};
const DeleteDialog = ({ open, admin, reason, onReasonChange, onClose, onConfirm }) => {
    return (_jsxs(Dialog, { open: open, onClose: onClose, children: [_jsxs(DialogTitle, { children: ["Please confirm that you would like to delete ", admin?.first_name, " ", admin?.last_name, "."] }), _jsxs(DialogContent, { children: [_jsxs(DialogContentText, { children: ["You may undo this action in the Activity Log. ", _jsx("br", {}), _jsx("strong", { children: "Compulsory:" }), " Provide a reason for deleting this admin."] }), _jsx(TextField, { autoFocus: true, margin: "dense", label: "Reason for Deletion", fullWidth: true, variant: "standard", value: reason, onChange: onReasonChange })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, color: "primary", children: "Cancel" }), _jsx(Button, { onClick: onConfirm, color: "error", children: "Confirm" })] })] }));
};
const ActionButtons = ({ adminId, admin, isSuperAdmin, onView, onDelete }) => {
    return (_jsxs(Box, { children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => onView(adminId), sx: { marginRight: "8px" }, children: "View" }), isSuperAdmin && (_jsx(Button, { variant: "contained", color: "error", onClick: () => onDelete(admin), children: "Delete" }))] }));
};
const AdminList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const { user, setUser } = useAuthStore();
    const [admins, setAdmins] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [reason, setReason] = useState('');
    const isSuperAdmin = user?.is_super_admin === true;
    const actionsColumnWidth = isSuperAdmin ? 170 : 85;
    const fetchAdmins = async () => {
        try {
            const res = await apiClient.get(apiPaths.USER.ADMIN);
            const adminUsers = res.data.filter((user) => user.role === "admin");
            setAdmins(adminUsers);
        }
        catch (error) {
            console.error("Error fetching admins:", error);
        }
    };
    const fetchCurrentUser = async () => {
        try {
            const res = await apiClient.get(apiPaths.USER.CURRENT);
            setUser(res.data);
        }
        catch (error) {
            console.error("Error fetching current user:", error);
        }
    };
    useEffect(() => {
        fetchAdmins();
        fetchCurrentUser();
    }, []);
    const getFilteredAdmins = () => {
        return admins.filter((admin) => Object.values(admin)
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
    };
    const handleViewAdmin = (adminId) => {
        navigate(`/admin/view-admin/${adminId}`);
    };
    const handleOpenDialog = (admin) => {
        setSelectedAdmin(admin);
        setOpenDialog(true);
    };
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedAdmin(null);
        setReason('');
    };
    const handleReasonChange = (event) => {
        setReason(event.target.value);
    };
    const handleConfirmDelete = async () => {
        if (selectedAdmin === null)
            return;
        try {
            await apiClient.request({
                method: "DELETE",
                url: apiPaths.USER.DELETE("Admin", selectedAdmin.id),
                data: { reason },
            });
            await fetchAdmins();
        }
        catch (error) {
            console.error("Error deleting admin:", error);
        }
        handleCloseDialog();
    };
    const getColumns = () => [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "username", headerName: "Username", flex: 1 },
        { field: "first_name", headerName: "First Name", flex: 1 },
        { field: "last_name", headerName: "Last Name", flex: 1 },
        { field: "email", headerName: "Email", flex: 1 },
        {
            field: "is_active",
            headerName: "Active",
            renderCell: (params) => (params.row.is_active ? "Yes" : "No"),
            flex: 1,
        },
        { field: "role", headerName: "Role", flex: 1 },
        {
            field: "is_super_admin",
            headerName: "Super Admin",
            renderCell: (params) => (params.row.is_super_admin ? "Yes" : "No"),
            flex: 1,
        },
        {
            field: "actions",
            headerName: "Actions",
            width: actionsColumnWidth,
            minWidth: actionsColumnWidth,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { adminId: params.row.id, admin: params.row, isSuperAdmin: isSuperAdmin, onView: handleViewAdmin, onDelete: handleOpenDialog })),
        },
    ];
    const filteredAdmins = getFilteredAdmins();
    const columns = getColumns();
    return (_jsxs(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: [_jsx(Header, { colors: colors, theme: theme }), _jsx(DataGridContainer, { filteredAdmins: filteredAdmins, columns: columns, colors: colors, drawer: drawer }), _jsx(DeleteDialog, { open: openDialog, admin: selectedAdmin, reason: reason, onReasonChange: handleReasonChange, onClose: handleCloseDialog, onConfirm: handleConfirmDelete })] }));
};
export default AdminList;
