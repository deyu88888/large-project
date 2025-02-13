import React, { useState, useEffect, useRef, useContext } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";

type Society = {
  id: number;
  name: string;
  societyMembers: number[];
  roles: {};
  leader: number;
  category: string;
  socialMediaLinks: {};
  timetable: string | null;
  membershipRequirements: string | null;
  upcomingProjectsOrPlans: string | null;
};

const PendingSocietyRequest = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<Society[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 

  const fetchPendingSocieties = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
      setSocieties(res.data);
    } catch (error) {
      console.error("Error fetching pending societies:", error);
    }
  };

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket("ws://127.0.0.1:8000/ws/admin/society/");

      ws.current.onopen = () => {
        console.log("WebSocket Connected for Pending Society Requests");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket Update Received:", data);
          fetchPendingSocieties();
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
        }, 5000);
      };
    };

    fetchPendingSocieties();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const filteredSocieties = societies.filter((society) =>
    Object.values(society)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleAccept = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, { status: "Approved" });
    } catch (error) {
      console.error("Error accepting society:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, { status: "Rejected" });
    } catch (error) {
      console.error("Error rejecting society:", error);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Name", flex: 1 },
    {
      field: "societyMembers",
      headerName: "Members",
      renderCell: (params: any) => params.row.societyMembers.join(", "),
      flex: 1,
    },
    { field: "leader", headerName: "Leader", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "timetable", headerName: "Timetable", flex: 1 },
    { field: "membershipRequirements", headerName: "Membership Requirements", flex: 1 },
    { field: "upcomingProjectsOrPlans", headerName: "Upcoming Projects", flex: 1 },
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
        Pending Society Requests
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
              paginationModel: { pageSize: 5, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
        />
      </Box>
    </Box>
  );
};

export default PendingSocietyRequest;
