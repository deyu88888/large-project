import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
/**
 * SocietyListRejected Component
 * Displays a list of rejected societies with real-time updates via WebSocket
 */
const SocietyListRejected = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [societies, setSocieties] = useState([]);
    const ws = useRef(null);
    const { drawer } = useSettingsStore();
    const { searchTerm } = useContext(SearchContext);
    const WEBSOCKET_URL = "ws:;
    const RECONNECT_TIMEOUT = 5000;
    /**
     * Fetches the list of rejected societies from the API
     */
    const fetchSocieties = useCallback(async () => {
        try {
            const res = await apiClient.get(apiPaths.USER.REJECTEDSOCIETY);
            setSocieties(res.data);
        }
        catch (error) {
            console.error("Error fetching rejected societies:", error);
        }
    }, []);
    /**
     * Establishes WebSocket connection for real-time updates
     */
    const connectWebSocket = useCallback(() => {
        ws.current = new WebSocket(WEBSOCKET_URL);
        ws.current.onopen = () => {
            console.log("WebSocket Connected for Rejected Society List");
        };
        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket Update Received:", data);
                fetchSocieties();
            }
            catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };
        ws.current.onerror = (event) => {
            console.error("WebSocket Error:", event);
        };
        ws.current.onclose = (event) => {
            console.log("WebSocket Disconnected:", event.reason);
            setTimeout(() => {
                connectWebSocket();
            }, RECONNECT_TIMEOUT);
        };
    }, [fetchSocieties]);
    useEffect(() => {
        fetchSocieties();
        connectWebSocket();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [fetchSocieties, connectWebSocket]);
    const columns = [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "name", headerName: "Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
        { field: "category", headerName: "Category", flex: 1 },
        { field: "membershipRequirements", headerName: "Membership Requirements", flex: 1 },
    ];
    const filteredSocieties = useMemo(() => societies.filter((society) => Object.values(society)
        .join(" ")
        .toLowerCase()
        .includes((searchTerm || '').toLowerCase())), [societies, searchTerm]);
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
                    color: `${colors.greenAccent[200]} !important`,
                },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                    color: `${colors.blueAccent[500]} !important`,
                },
            }, children: _jsx(DataGrid, { rows: filteredSocieties, columns: columns, slots: { toolbar: GridToolbar }, autoHeight: true, resizeThrottleMs: 0, initialState: {
                    pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                    },
                }, pageSizeOptions: [5, 10, 25], loading: societies.length === 0, disableRowSelectionOnClick: true }) }) }));
};
export default SocietyListRejected;
