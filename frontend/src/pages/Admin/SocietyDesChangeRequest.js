import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { Box, useTheme, Button } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchPendingDescriptions } from "./fetchPendingDescriptions";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { SearchContext } from "../../components/layout/SearchContext";
const transformDescriptionForDisplay = (description) => {
    return {
        ...description,
        society: description.society?.name || '',
        requested_by: description.requested_by?.username || '',
    };
};
const filterDescriptionsBySearchTerm = (descriptions, searchTerm) => {
    if (!searchTerm)
        return descriptions;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return descriptions.filter((description) => {
        const searchString = Object.entries(description)
            .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
            .join(" ")
            .toLowerCase();
        return searchString.includes(normalizedSearchTerm);
    });
};
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};
const acceptDescription = async (id) => {
    await apiClient.put(`${apiPaths.USER.PENDINGDESCRIPTIONREQUEST}/${id}`, { status: "Approved" });
};
const rejectDescription = async (id) => {
    await apiClient.put(`${apiPaths.USER.PENDINGDESCRIPTIONREQUEST}/${id}`, { status: "Rejected" });
};
const fetchDescriptionRequests = async () => {
    const res = await apiClient.get(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
    return res.data;
};
const ActionButtons = ({ id, onAccept, onReject }) => {
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", color: "success", onClick: () => onAccept(id), sx: { marginRight: 1 }, children: "Accept" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onReject(id), children: "Reject" })] }));
};
const DataGridContainer = ({ descriptions, columns, colors, drawer }) => {
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
            }, children: _jsx(DataGrid, { rows: descriptions, columns: columns, slots: { toolbar: GridToolbar }, autoHeight: true, resizeThrottleMs: 0, disableRowSelectionOnClick: true }) }) }));
};
const createDescriptionColumns = (onAccept, onReject) => {
    return [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "society", headerName: "Society", flex: 1 },
        { field: "requested_by", headerName: "Requested By", flex: 1 },
        { field: "new_description", headerName: "New Description", flex: 2 },
        {
            field: "created_at",
            headerName: "Requested At",
            flex: 1,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1.6,
            renderCell: (params) => (_jsx(ActionButtons, { id: params.row.id, onAccept: onAccept, onReject: onReject })),
        },
    ];
};
const PendingDescriptionRequest = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [requests, setRequests] = useState([]);
    const descriptions = useFetchWebSocket(fetchPendingDescriptions, 'description');
    useEffect(() => {
        loadDescriptionRequests();
    }, []);
    const loadDescriptionRequests = async () => {
        try {
            const data = await fetchDescriptionRequests();
            setRequests(data);
        }
        catch (error) {
            console.error("Error fetching description requests:", error);
        }
    };
    const handleAccept = useCallback(async (id) => {
        try {
            await acceptDescription(id);
        }
        catch (error) {
            console.error("Error accepting description:", error);
        }
    }, []);
    const handleReject = useCallback(async (id) => {
        try {
            await rejectDescription(id);
        }
        catch (error) {
            console.error("Error rejecting description:", error);
        }
    }, []);
    const processedDescriptions = useMemo(() => {
        if (!Array.isArray(descriptions))
            return [];
        const filteredData = filterDescriptionsBySearchTerm(descriptions, searchTerm || '');
        return filteredData.map(transformDescriptionForDisplay);
    }, [descriptions, searchTerm]);
    const columns = useMemo(() => createDescriptionColumns(handleAccept, handleReject), [handleAccept, handleReject]);
    return (_jsx(DataGridContainer, { descriptions: processedDescriptions, columns: columns, colors: colors, drawer: drawer }));
};
export default PendingDescriptionRequest;
