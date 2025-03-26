import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { Box, Typography, useTheme, Button, DialogContent, DialogTitle, Dialog, DialogContentText, DialogActions, TextField } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { useNavigate } from "react-router-dom";
const WS_URL = "ws:";
const RECONNECT_DELAY = 5000;
const filterSocietiesBySearchTerm = (societies, searchTerm) => {
    if (!searchTerm)
        return societies;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return societies.filter((society) => Object.values(society)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm));
};
const fetchSocietyList = async () => {
    const res = await apiClient.get(apiPaths.USER.SOCIETY);
    return res.data;
};
const deleteSociety = async (societyId, reason) => {
    await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("Society", societyId),
        data: { reason },
    });
};
const setupWebSocketHandlers = (socket, onMessage) => {
    socket.onopen = () => {
        console.log("WebSocket Connected for Society List");
    };
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("WebSocket Update Received:", data);
            onMessage();
        }
        catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onerror = (event) => {
        console.error("WebSocket Error:", event);
    };
};
const createWebSocketConnection = (url, onMessage, onClose) => {
    const socket = new WebSocket(url);
    setupWebSocketHandlers(socket, onMessage);
    socket.onclose = (event) => {
        console.log("WebSocket Disconnected:", event.reason);
        onClose();
    };
    return socket;
};
const PresidentCell = ({ president }) => {
    return (_jsx(Typography, { children: president ? `${president.first_name} ${president.last_name}` : "N/A" }));
};
const MembersCell = ({ members }) => {
    return (_jsx(Typography, { children: Array.isArray(members) ? members.length : "0" }));
};
const ActionButtons = ({ societyId, onView, onDelete, society }) => {
    return (_jsxs(Box, { children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => onView(societyId.toString()), sx: { marginRight: "8px" }, children: "View" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onDelete(society), children: "Delete" })] }));
};
const DataGridContainer = ({ societies, columns, colors, drawer }) => {
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
            }, children: _jsx(DataGrid, { rows: societies, columns: columns, slots: { toolbar: GridToolbar }, autoHeight: true, resizeThrottleMs: 0 }) }) }));
};
const DeleteDialog = ({ state, onClose, onReasonChange, onConfirm }) => {
    const { open, reason, selectedSociety } = state;
    const isConfirmDisabled = !reason.trim();
    return (_jsxs(Dialog, { open: open, onClose: onClose, children: [_jsxs(DialogTitle, { children: ["Please confirm that you would like to delete ", selectedSociety?.name, "."] }), _jsxs(DialogContent, { children: [_jsxs(DialogContentText, { children: ["You may undo this action in the Activity Log. ", _jsx("br", {}), _jsx("strong", { children: "Compulsory:" }), " Provide a reason for deleting this student."] }), _jsx(TextField, { autoFocus: true, label: "Reason for Deletion", fullWidth: true, variant: "standard", value: reason, onChange: onReasonChange })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, color: "primary", children: "Cancel" }), _jsx(Button, { onClick: onConfirm, color: "error", disabled: isConfirmDisabled, children: "Confirm" })] })] }));
};
const createSocietyColumns = (handleViewSociety, handleOpenDialog) => {
    return [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "name", headerName: "Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
        {
            field: "president",
            headerName: "President",
            flex: 0.8,
            renderCell: (params) => (_jsx(PresidentCell, { president: params.value })),
        },
        {
            field: "society_members",
            headerName: "Members",
            flex: 0.5,
            renderCell: (params) => (_jsx(MembersCell, { members: params.value })),
        },
        { field: "approved_by", headerName: "Approved By", flex: 0.5 },
        { field: "category", headerName: "Category", flex: 1.3 },
        {
            field: "actions",
            headerName: "Actions",
            width: 170,
            minWidth: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { societyId: params.row.id, society: params.row, onView: handleViewSociety, onDelete: handleOpenDialog })),
        },
    ];
};
/**
 * SocietyList Component
 * Displays a list of societies with options to view details or delete
 */
const SocietyList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { drawer } = useSettingsStore();
    const { searchTerm } = useContext(SearchContext);
    const ws = useRef(null);
    const [societies, setSocieties] = useState([]);
    const [dialogState, setDialogState] = useState({
        open: false,
        reason: '',
        selectedSociety: null
    });
    const loadSocieties = useCallback(async () => {
        try {
            const data = await fetchSocietyList();
            setSocieties(data);
        }
        catch (error) {
            console.error("Error fetching societies:", error);
        }
    }, []);
    const handleWebSocketMessage = useCallback(() => {
        loadSocieties();
    }, [loadSocieties]);
    const reconnectWebSocket = useCallback(() => {
        setTimeout(() => {
            connectWebSocket();
        }, RECONNECT_DELAY);
    }, []);
    const connectWebSocket = useCallback(() => {
        if (ws.current) {
            ws.current.close();
        }
        ws.current = createWebSocketConnection(WS_URL, handleWebSocketMessage, reconnectWebSocket);
    }, [handleWebSocketMessage, reconnectWebSocket]);
    useEffect(() => {
        loadSocieties();
        connectWebSocket();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connectWebSocket, loadSocieties]);
    const handleViewSociety = useCallback((societyId) => {
        navigate(`/admin/view-society/${societyId}`);
    }, [navigate]);
    const handleOpenDialog = useCallback((society) => {
        setDialogState({
            open: true,
            reason: '',
            selectedSociety: society
        });
    }, []);
    const handleCloseDialog = useCallback(() => {
        setDialogState({
            open: false,
            reason: '',
            selectedSociety: null
        });
    }, []);
    const handleReasonChange = useCallback((event) => {
        setDialogState(prev => ({
            ...prev,
            reason: event.target.value
        }));
    }, []);
    const handleDeleteConfirmed = useCallback(async () => {
        const { selectedSociety, reason } = dialogState;
        if (!selectedSociety)
            return;
        try {
            await deleteSociety(selectedSociety.id, reason);
            loadSocieties();
        }
        catch (error) {
            console.error("Error deleting society:", error);
        }
        handleCloseDialog();
    }, [dialogState, loadSocieties, handleCloseDialog]);
    const filteredSocieties = useMemo(() => filterSocietiesBySearchTerm(societies, searchTerm || ''), [societies, searchTerm]);
    const columns = useMemo(() => createSocietyColumns(handleViewSociety, handleOpenDialog), [handleViewSociety, handleOpenDialog]);
    return (_jsxs(_Fragment, { children: [_jsx(DataGridContainer, { societies: filteredSocieties, columns: columns, colors: colors, drawer: drawer }), _jsx(DeleteDialog, { state: dialogState, onClose: handleCloseDialog, onReasonChange: handleReasonChange, onConfirm: handleDeleteConfirmed })] }));
};
export default SocietyList;
