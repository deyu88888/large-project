import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useContext, useCallback } from "react";
import { Box, useTheme, Button, Alert, Snackbar } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { SocietyPreview } from "../../components/SocietyPreview";
import { EventPreview } from "../../components/EventPreview";
const fetchPendingSocietyDetailRequests = async () => {
    try {
        const response = await apiClient.get(apiPaths.SOCIETY.DETAIL_REQUEST);
        return response.data.filter((request) => request.intent === "UpdateSoc" && !request.approved);
    }
    catch (error) {
        console.error("Error fetching society detail requests:", error);
        return [];
    }
};
const PendingSocietyDetailRequests = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [openPreview, setOpenPreview] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailRequests, setDetailRequests] = useState([]);
    const fetchData = async () => {
        const data = await fetchPendingSocietyDetailRequests();
        setDetailRequests(data);
    };
    useEffect(() => {
        fetchData();
    }, []);
    const filteredDetailRequests = Array.isArray(detailRequests)
        ? detailRequests.filter((request) => {
            const searchString = Object.entries(request)
                .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
                .join(" ")
                .toLowerCase();
            return searchString.includes(searchTerm.toLowerCase());
        }).map((request) => ({
            ...request,
            society: request.society?.name,
            requested_by: request.from_student?.username,
        }))
        : [];
    const handlePreview = (id) => {
    };
    const handlePreviewClose = () => {
        setOpenPreview(false);
        setSelectedRequest(null);
    };
    const handleAccept = async (id) => {
        try {
            await apiClient.put(`${apiPaths.SOCIETY.DETAIL_REQUEST}${id}/`, { status: "Approved" });
            setDetailRequests((prev) => prev.filter((request) => request.id !== id));
            setAlert({
                open: true,
                message: `Society detail request approved successfully.`,
                severity: 'success'
            });
        }
        catch (error) {
            console.error("Error accepting society detail request:", error);
            setAlert({
                open: true,
                message: `Failed to approve society detail request.`,
                severity: 'error'
            });
        }
    };
    const handleReject = async (id) => {
        try {
            await apiClient.put(`${apiPaths.SOCIETY.DETAIL_REQUEST}${id}/`, { status: "Rejected" });
            setDetailRequests((prev) => prev.filter((request) => request.id !== id));
            setAlert({
                open: true,
                message: `Society detail request rejected successfully.`,
                severity: 'success'
            });
        }
        catch (error) {
            console.error("Error rejecting society detail request:", error);
            setAlert({
                open: true,
                message: `Failed to reject society detail request.`,
                severity: 'error'
            });
        }
    };
    // State for alerts/notifications
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const handleCloseAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, open: false }));
    }, []);
    const columns = [
        { field: "id", headerName: "ID", flex: 0.3 },
        {
            field: "from_student",
            headerName: "Requested By",
            flex: 0.5,
        },
        {
            field: "name",
            headerName: "New Name",
            flex: 1,
            renderCell: (params) => params.row.name || "No name change",
        },
        {
            field: "description",
            headerName: "New Description",
            flex: 2,
            renderCell: (params) => params.row.description || "No description change",
        },
        {
            field: "requested_at",
            headerName: "Requested At",
            flex: 1,
            renderCell: (params) => {
                const date = new Date(params.row.requested_at);
                return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 285,
            minWidth: 285,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => handlePreview(params.row.id), sx: { marginRight: 1 }, children: "Preview" }), _jsx(Button, { variant: "contained", color: "success", onClick: () => handleAccept(params.row.id), sx: { marginRight: 1 }, children: "Accept" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => handleReject(params.row.id), children: "Reject" })] })),
            flex: 1.6,
        },
    ];
    return (_jsxs(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: [_jsx(Box, { sx: {
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
                }, children: _jsx(DataGrid, { rows: filteredDetailRequests, columns: columns, slots: { toolbar: GridToolbar }, autoHeight: true, resizeThrottleMs: 0, disableRowSelectionOnClick: true }) }), selectedRequest && (_jsx(SocietyPreview, { open: openPreview, onClose: handlePreviewClose, society: {
                    ...selectedRequest,
                    id: selectedRequest.id,
                    from_student: {
                        first_name: selectedRequest.name?.split(' ')[0] || 'Society',
                        last_name: selectedRequest.name?.split(' ')[1] || 'Admin',
                        username: 'admin',
                    },
                    icon: selectedRequest.icon || selectedRequest.icon,
                    joined: 0,
                }, loading: false, joined: 0, onJoinSociety: function (societyId) {
                    throw new Error("Function not implemented.");
                } })), _jsx(Snackbar, { open: alert.open, autoHideDuration: 6000, onClose: handleCloseAlert, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { onClose: handleCloseAlert, severity: alert.severity, variant: "filled", sx: { width: '100%' }, children: alert.message }) }), selectedRequest && (_jsx(EventPreview, { open: previewOpen, onClose: () => setPreviewOpen(false), eventData: selectedRequest }))] }));
};
export default PendingSocietyDetailRequests;
