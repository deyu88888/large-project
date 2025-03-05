import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchPendingDescriptions } from "./fetchPendingDescriptions";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { SearchContext } from "../../components/layout/SearchContext";


interface DescriptionRequest {
  id: number;
  society: { id: number; name: string };
  requested_by: { id: number; username: string };
  new_description: string;
  created_at: string;
}

const PendingDescriptionRequest: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const [requests, setRequests] = useState<DescriptionRequest[]>([]);
  const descriptions = useFetchWebSocket(fetchPendingDescriptions, 'description');

  
  const filteredDescriptions = Array.isArray(descriptions)
  ? descriptions.filter((description) => {
      const searchString = Object.entries(description)
        .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
        .join(" ")
        .toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    }).map((description) => ({
      ...description,
      society: description.society?.name, // Display the society's name directly
      requested_by: description.requested_by?.username, // Display the username of the requester
    }))
  : [];


  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
        setRequests(res.data);
      } catch (error) {
        console.error("Error fetching description requests:", error);
      }
    };
    fetchRequests();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGDESCRIPTIONREQUEST}/${id}`, { status: "Approved" });
    } catch (error) {
      console.error("Error accepting description:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGDESCRIPTIONREQUEST}/${id}`, { status: "Rejected" });
    } catch (error) {
      console.error("Error rejecting description:", error);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { 
      field: "society", 
      headerName: "Society", 
      flex: 1, 
    },
    { 
      field: "requested_by", 
      headerName: "Requested By", 
      flex: 1, 
    },
    { field: "new_description", headerName: "New Description", flex: 2 },
    {
      field: "created_at",
      headerName: "Requested At",
      flex: 1,
      renderCell: (params: GridRenderCellParams<any>) => 
        new Date(params.row.created_at).toLocaleString(),
    },
    {
        field: "actions",
        headerName: "Actions",
        renderCell: (params: any) => (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleAccept(params.row.id)}
              sx={{ marginRight: 1 }}
            >
              Accept
            </Button>
            <Button variant="contained" color="error" onClick={() => handleReject(params.row.id)}>
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
        height: "calc(100vh - 64px)", // Adjust for AppBar height
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
          fontSize: "2.25rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Pending Description Requests
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
        }}
      >
        <DataGrid
          rows={filteredDescriptions}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          resizeThrottleMs={0}
          disableRowSelectionOnClick  // Disable row selection on row click to temporarily fix accept/reject button issue
        />
      </Box>
    </Box>
  );
};

export default PendingDescriptionRequest;