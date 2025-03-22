import { useContext, useEffect, useState } from "react";
import { Box, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { updateRequestStatus } from "../../api/requestApi";
import { apiPaths } from "../../api";
import { fetchPendingRequests } from "./utils";

const PendingSocietyRequest = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();   
  const [societies, setSocieties] = useState<any[]>([]);
  const fetchedSocieties = useFetchWebSocket(() => fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST), 'society');
  useEffect(() => {
    if (Array.isArray(fetchedSocieties)) {
      setSocieties(fetchedSocieties);
    }
  }, [fetchedSocieties]);

  const filteredSocieties = Array.isArray(societies) 
  ? societies.filter((society) => {
      const searchString = Object.entries(society)
        .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
        .join(" ")
        .toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    }).map((society) => ({
      ...society,
      society_members: Array.isArray(society.society_members) 
        ? society.society_members.join(", ") 
        : society.society_members,
    }))
  : [];

  const handleStatusChange = async (id: number, status: "Approved" | "Rejected") => {
    try {
      const updatedSocieties = filteredSocieties.filter(society => society.id !== id);
      setSocieties(updatedSocieties);
      await updateRequestStatus(id, status, apiPaths.USER.PENDINGSOCIETYREQUEST);
    } catch (error) {
      alert(`Failed to ${status.toLowerCase()} society request.`);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {      
      field: "society_members",
      headerName: "Members",
      flex: 1,
    },
    { field: "president", headerName: "president", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "membershipRequirements", headerName: "Membership Requirements", flex: 1 },
    { field: "upcomingProjectsOrPlans", headerName: "Upcoming Projects", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 188,
      minWidth: 188,
      sortable: false,
      filterable: false, 
      renderCell: (params: any) => (
        <>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusChange(params.row.id, "Approved")}
            sx={{ marginRight: 1 }}
          >
            Accept
          </Button>
          <Button variant="contained" color="error" onClick={() => handleStatusChange(params.row.id, "Rejected")}>
            Reject
          </Button>
        </>
      ),
      flex: 1.6,
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
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
          "& .MuiDataGrid-columnHeader": { whiteSpace: "normal", wordBreak: "break-word" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
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
        />
      </Box>
    </Box>
  );
};

export default PendingSocietyRequest;