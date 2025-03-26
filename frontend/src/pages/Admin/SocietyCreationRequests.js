import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Box, useTheme, Button, Typography, Alert, Snackbar } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { updateRequestStatus } from "../../api/requestApi";
import { apiPaths } from "../../api";
import { fetchPendingRequests } from "./utils";
const processSocietyMembers = (society) => {
    return {
        ...society,
        society_members: Array.isArray(society.society_members)
            ? society.society_members.join(", ")
            : society.society_members,
    };
};
const processSocieties = (societies) => {
    if (!Array.isArray(societies))
        return [];
    return societies.map(processSocietyMembers);
};
const filterSocietiesBySearchTerm = (societies, searchTerm) => {
    if (!Array.isArray(societies))
        return [];
    if (!searchTerm)
        return societies;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return societies.filter((society) => {
        const searchString = Object.entries(society)
            .map(([key, value]) => String(value))
            .join(" ")
            .toLowerCase();
        return searchString.includes(normalizedSearchTerm);
    });
};
const TruncatedCell = ({ value }) => {
    return (_jsx(Typography, { noWrap: true, title: value, children: value }));
};
const ActionButtons = ({ societyId, onStatusChange }) => {
    return (_jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "contained", color: "success", onClick: () => onStatusChange(societyId, "Approved"), size: "small", children: "Accept" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onStatusChange(societyId, "Rejected"), size: "small", children: "Reject" })] }));
};
const NotificationAlert = ({ notification, onClose }) => {
    return (_jsx(Snackbar, { open: notification.open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { onClose: onClose, severity: notification.severity, variant: "filled", sx: { width: '100%' }, children: notification.message }) }));
};
const EmptyState = ({ colors }) => {
    return (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", children: _jsx(Typography, { variant: "h6", color: colors.grey[100], children: "No pending society requests found" }) }));
};
const DataGridContainer = ({ societies, columns, colors, loading, drawer }) => {
    return (_jsx(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: _jsx(Box, { sx: {
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
            }, children: _jsx(DataGrid, { rows: societies, columns: columns, slots: {
                    toolbar: GridToolbar,
                    noRowsOverlay: () => _jsx(EmptyState, { colors: colors })
                }, autoHeight: true, resizeThrottleMs: 0, initialState: {
                    pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                    },
                }, pageSizeOptions: [5, 10, 25], disableRowSelectionOnClick: true, loading: loading }) }) }));
};
const createSocietyColumns = (handleStatusChange) => {
    return [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "name", headerName: "Name", flex: 1 },
        {
            field: "description",
            headerName: "Description",
            flex: 1,
            renderCell: (params) => (_jsx(TruncatedCell, { value: params.value }))
        },
        {
            field: "society_members",
            headerName: "Members",
            flex: 1,
            renderCell: (params) => (_jsx(TruncatedCell, { value: params.value }))
        },
        { field: "president", headerName: "President", flex: 1 },
        { field: "category", headerName: "Category", flex: 1 },
        {
            field: "membershipRequirements",
            headerName: "Membership Requirements",
            flex: 1,
            renderCell: (params) => (_jsx(TruncatedCell, { value: params.value }))
        },
        {
            field: "upcomingProjectsOrPlans",
            headerName: "Upcoming Projects",
            flex: 1,
            renderCell: (params) => (_jsx(TruncatedCell, { value: params.value }))
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 188,
            minWidth: 188,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { societyId: params.row.id, onStatusChange: handleStatusChange })),
            flex: 1.6,
        },
    ];
};
const PendingSocietyRequest = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [societies, setSocieties] = useState([]);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const fetchedSocieties = useFetchWebSocket(() => fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST), 'society');
    const handleCloseNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);
    const showNotification = useCallback((message, severity) => {
        setNotification({
            open: true,
            message,
            severity
        });
    }, []);
    const updateSocietiesAfterStatusChange = useCallback((societyId) => {
        setSocieties(prevSocieties => prevSocieties.filter(society => society.id !== societyId));
    }, []);
    const handleStatusChange = useCallback(async (id, status) => {
        try {
            updateSocietiesAfterStatusChange(id);
            await updateRequestStatus(id, status, apiPaths.USER.PENDINGSOCIETYREQUEST);
            showNotification(`Society ${status === "Approved" ? "approved" : "rejected"} successfully.`, 'success');
        }
        catch (error) {
            console.error(`Error updating society status:`, error);
            showNotification(`Failed to ${status.toLowerCase()} society request.`, 'error');
            recoverSocietyData();
        }
    }, [updateSocietiesAfterStatusChange, showNotification]);
    const recoverSocietyData = useCallback(async () => {
        const data = await fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST);
        if (Array.isArray(data)) {
            setSocieties(data);
        }
    }, []);
    useEffect(() => {
        if (Array.isArray(fetchedSocieties)) {
            setSocieties(fetchedSocieties);
        }
    }, [fetchedSocieties]);
    const processedSocieties = useMemo(() => processSocieties(societies), [societies]);
    const filteredSocieties = useMemo(() => filterSocietiesBySearchTerm(processedSocieties, searchTerm || ''), [processedSocieties, searchTerm]);
    const columns = useMemo(() => createSocietyColumns(handleStatusChange), [handleStatusChange]);
    return (_jsxs(_Fragment, { children: [_jsx(DataGridContainer, { societies: filteredSocieties, columns: columns, colors: colors, loading: societies.length === 0, drawer: drawer }), _jsx(NotificationAlert, { notification: notification, onClose: handleCloseNotification })] }));
};
export default PendingSocietyRequest;
