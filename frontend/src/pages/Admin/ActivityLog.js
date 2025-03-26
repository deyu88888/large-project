import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useContext, useMemo } from "react";
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, useTheme, Snackbar, Alert, Tooltip, Stack } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { fetchPendingRequests } from "./utils";
const ActionButtons = ({ row, processing, onUndo, onDelete }) => {
    const isProcessing = processing.id === row.id && processing.isProcessing;
    return (_jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Tooltip, { title: "Undo this action", children: _jsx(Button, { variant: "contained", color: "primary", onClick: () => onUndo(row.id), disabled: isProcessing, size: "small", children: isProcessing ? _jsx(CircularProgress, { size: 20, thickness: 5 }) : "Undo" }) }), _jsx(Tooltip, { title: "Delete this log entry permanently", children: _jsx(Button, { variant: "contained", color: "error", onClick: () => onDelete(row), disabled: isProcessing, size: "small", children: "Delete" }) })] }));
};
const ConfirmDeleteDialog = ({ open, log, processing, onClose, onConfirm, colors }) => {
    const isProcessing = processing.id === log?.id && processing.isProcessing;
    return (_jsxs(Dialog, { open: open, onClose: onClose, PaperProps: {
            sx: {
                width: "100%",
                maxWidth: "500px",
                backgroundColor: colors.primary[400],
            }
        }, children: [_jsx(DialogTitle, { children: "Confirm Permanent Deletion" }), _jsx(DialogContent, { children: _jsxs(DialogContentText, { children: ["Are you sure you want to permanently delete the log entry for", ' ', _jsx("strong", { children: log?.action_type }), " action on", ' ', _jsx("strong", { children: log?.target_type }), " named", ' ', _jsx("strong", { children: log?.target_name }), "?", _jsx("br", {}), _jsx("br", {}), "This action is irreversible and the log entry will be permanently removed."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, color: "primary", children: "Cancel" }), _jsx(Button, { onClick: onConfirm, color: "error", disabled: isProcessing, children: isProcessing ? (_jsx(CircularProgress, { size: 24, color: "inherit" })) : ("Delete Permanently") })] })] }));
};
const NotificationAlert = ({ notification, onClose }) => {
    return (_jsx(Snackbar, { open: notification.open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: "bottom", horizontal: "center" }, children: _jsx(Alert, { onClose: onClose, severity: notification.severity, sx: { width: "100%" }, children: notification.message }) }));
};
const LoadingIndicator = () => {
    return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", children: _jsx(CircularProgress, { color: "secondary" }) }));
};
const ActivityLogList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "info"
    });
    const [processing, setProcessing] = useState({
        id: null,
        isProcessing: false
    });
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { drawer } = useSettingsStore();
    const { searchTerm } = useContext(SearchContext);
    const formatTimestamp = (timestamp) => {
        try {
            return new Date(timestamp).toLocaleString();
        }
        catch (error) {
            return timestamp;
        }
    };
    const showNotification = (message, severity = "info") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    };
    const handleNotificationClose = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };
    const setIsProcessing = (id, isProcessing) => {
        setProcessing({ id, isProcessing });
    };
    const fetchData = async () => {
        try {
            setLoading(true);
            const logs = await fetchPendingRequests(apiPaths.USER.ACTIVITYLOG);
            setData(Array.isArray(logs) ? logs : []);
        }
        catch (error) {
            console.error("Failed to fetch activity logs", error);
            showNotification("Failed to load activity logs", "error");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleOpenDialog = (log) => {
        setSelectedLog(log);
        setOpenDialog(true);
    };
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLog(null);
    };
    const handleDeleteConfirmed = async () => {
        if (!selectedLog)
            return;
        try {
            setIsProcessing(selectedLog.id, true);
            await apiClient.delete(apiPaths.USER.DELETEACTIVITYLOG(selectedLog.id));
            await fetchData();
            showNotification("Log entry permanently deleted", "success");
        }
        catch (error) {
            console.error("Error deleting log:", error);
            showNotification("Failed to delete log entry", "error");
        }
        finally {
            setIsProcessing(null, false);
            handleCloseDialog();
        }
    };
    const handleUndo = async (id) => {
        try {
            setIsProcessing(id, true);
            await apiClient.post(apiPaths.USER.UNDO_DELETE(id));
            showNotification("Action undone successfully!", "success");
            setData((prev) => prev.filter((item) => item.id !== id));
        }
        catch (error) {
            console.error("Error undoing action", error);
            showNotification("Failed to undo action", "error");
        }
        finally {
            setIsProcessing(null, false);
        }
    };
    const filteredActivityLogs = useMemo(() => data.filter((activityLog) => Object.values(activityLog)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())), [data, searchTerm]);
    // Using the refactored code from local branch
    const getColumns = () => [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "action_type", headerName: "Action Type", flex: 1 },
        { field: "target_type", headerName: "Type", flex: 1 },
        { field: "target_name", headerName: "Name", flex: 1 },
        { field: "performed_by", headerName: "Performed By", flex: 1,
            renderCell: (params) => {
                const user = params.row.performed_by;
                if (!user)
                    return "-";
                return `(${user.id}) ${user.first_name} ${user.last_name}`;
            },
        },
        { field: "timestamp", headerName: "Timestamp", flex: 1 },
        { field: "reason", headerName: "Reason", flex: 2 },
        {
            field: "actions",
            headerName: "Actions",
            width: 170,
            minWidth: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { row: params.row, processing: processing, onUndo: handleUndo, onDelete: handleOpenDialog })),
        }
    ];
    const getDataGridStyles = () => ({
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
    });
    const getContainerStyles = () => ({
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        position: "relative",
    });
    const getTitleStyles = () => ({
        color: colors.grey[100],
        fontSize: "1.75rem",
        fontWeight: 800,
        marginBottom: "1rem",
    });
    return (_jsxs(Box, { sx: getContainerStyles(), children: [_jsx(Typography, { variant: "h1", sx: getTitleStyles(), children: "Activity Log" }), loading ? (_jsx(LoadingIndicator, {})) : (_jsx(Box, { sx: getDataGridStyles(), children: _jsx(DataGrid, { rows: filteredActivityLogs, columns: getColumns(), slots: { toolbar: GridToolbar }, resizeThrottleMs: 0, autoHeight: true, initialState: {
                        pagination: { paginationModel: { pageSize: 25 } },
                        sorting: {
                            sortModel: [{ field: 'timestamp', sort: 'desc' }],
                        },
                    }, disableRowSelectionOnClick: true, pageSizeOptions: [10, 25, 50, 100], density: "standard" }) })), _jsx(ConfirmDeleteDialog, { open: openDialog, log: selectedLog, processing: processing, onClose: handleCloseDialog, onConfirm: handleDeleteConfirmed, colors: colors }), _jsx(NotificationAlert, { notification: notification, onClose: handleNotificationClose })] }));
};
export default ActivityLogList;
