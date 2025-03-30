import React, { useState, useContext, useMemo, useCallback, useEffect } from "react";
import { Box, useTheme, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types';
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import { FaSync } from "react-icons/fa";

interface HeaderProps {
  colors: any;
  isConnected: boolean;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ colors, isConnected, onRefresh }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
        }}
      >
        Rejected Societies
      </Typography>
      
      <Box display="flex" alignItems="center">
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? colors.greenAccent[500] : colors.orangeAccent[500],
            mr: 1
          }}
        />
        <Typography variant="body2" fontSize="0.75rem" color={colors.grey[300]} mr={2}>
          {isConnected ? 'Live updates' : 'Offline mode'}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FaSync />}
          onClick={onRefresh}
          size="small"
          sx={{ borderRadius: "8px" }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

/**
 * SocietyListRejected Component
 * Displays a list of rejected societies with real-time updates via WebSocket
 */
const SocietyListRejected: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);

  
  const fetchRejectedSocieties = useCallback(async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.REJECTEDSOCIETY);
      return res.data;
    } catch (error) {
      console.error("Error fetching rejected societies:", error);
      return [];
    }
  }, []);

  
  const { 
    data: societies, 
    loading, 
    error, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<Society[]>(
    'admin_societies', 
    fetchRejectedSocieties
  );

  
  useEffect(() => {
    if (error) {
      console.error(`WebSocket error: ${error}`);
    }
  }, [error]);
  
  
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "membershipRequirements", headerName: "Membership Requirements", flex: 1 },
  ];

  const filteredSocieties = useMemo(
    () => {
      
      if (!societies || !Array.isArray(societies)) return [];
      
      return societies.filter((society) =>
        Object.values(society)
          .join(" ")
          .toLowerCase()
          .includes((searchTerm || '').toLowerCase())
      );
    },
    [societies, searchTerm]
  );

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Header 
        colors={colors}
        isConnected={isConnected}
        onRefresh={refresh}
      />
      
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
          loading={loading}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default SocietyListRejected;