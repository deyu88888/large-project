import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types';

/**
 * RejectedSocietiesList Component
 * Displays a list of rejected societies
 */
const RejectedSocietiesList: React.FC = () => {
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [societies, setSocieties] = useState<Society[]>([]);
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  
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

  useEffect(() => {
    fetchSocieties();
  }, [fetchSocieties]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "president", headerName: "Student", flex: 1 ,
      renderCell: (params) => {
        const president = params.value;
        return president ? `${president.first_name} ${president.last_name}` : "Unassigned";
      },
    },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
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

export default RejectedSocietiesList;