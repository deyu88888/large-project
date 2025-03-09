import { useContext } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { updateRequestStatus } from "../../api/requestApi";
import { apiPaths } from "../../api";
import { fetchPendingRequests } from "./fetchPendingRequests";

const RecentActivities = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 
  const societies = useFetchWebSocket(() => fetchPendingRequests(apiPaths.USER.PENDINGSOCIETYREQUEST), 'society');


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
      await updateRequestStatus(id, status, apiPaths.USER.PENDINGSOCIETYREQUEST);
    } catch (error) {
      alert(`Failed to ${status.toLowerCase()} society request.`);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Name/title", flex: 1 },
    {      
      field: "society_members",
      headerName: "type",
      flex: 1,
    },
    { field: "leader", headerName: "status", flex: 1 },
    { field: "category", headerName: "other info/description", flex: 1 },
    { field: "timetable", headerName: "Timetable", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params: any) => (
        <>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusChange(params.row.id, "Approved")}
            sx={{ marginRight: 1 }}
          >
            Edit
          </Button>
          <Button variant="contained" color="error" onClick={() => handleStatusChange(params.row.id, "Rejected")}>
            Delete
          </Button>
        </>
      ),
      flex: 1.6,
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)", // Full height minus the AppBar height
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "2.25rem",
          fontWeight: 800,
          marginBottom: "2rem",
        }}
      >
        Recent Activities
      </Typography>
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
        }}
      >
        <DataGrid
          rows={filteredSocieties}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
        />
        {/* <div> {JSON.stringify(filteredSocieties)} </div> */}
      </Box>
    </Box>
  );
};

export default RecentActivities;