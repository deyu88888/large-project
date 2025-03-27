import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types';
import { getWebSocketUrl } from "../../utils/websocket";

/**
 * SocietyListRejected Component
 * Displays a list of rejected societies with real-time updates via WebSocket
 */
const SocietyListRejected: React.FC = () => {
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [societies, setSocieties] = useState<Society[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  const WEBSOCKET_URL = getWebSocketUrl()
  const RECONNECT_TIMEOUT = 5000;
  
  /**
   * Fetches the list of rejected societies from the API
   */
  const fetchSocieties = useCallback(async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.REJECTEDSOCIETY);
      setSocieties(res.data);
    } catch (error) {
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
      } catch (error) {
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

  
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "membershipRequirements", headerName: "Membership Requirements", flex: 1 },
  ];

  
  const filteredSocieties = useMemo(
    () =>
      societies.filter((society) =>
        Object.values(society)
          .join(" ")
          .toLowerCase()
          .includes((searchTerm || '').toLowerCase())
      ),
    [societies, searchTerm]
  );

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
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
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
        }}
      >
        <DataGrid
          rows={filteredSocieties}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          resizeThrottleMs={0}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          loading={societies.length === 0}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default SocietyListRejected;