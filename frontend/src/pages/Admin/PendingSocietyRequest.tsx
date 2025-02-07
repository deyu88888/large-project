import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";

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
  const ws = useRef<WebSocket | null>(null); // Use useRef instead of useState

  const fetchPendingSocieties = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
      console.log("Fetched Pending Societies:", res.data);
      setSocieties(res.data); // No need to check for array
    } catch (error) {
      console.error("Error fetching pending societies:", error);
    }
  };

  useEffect(() => {
    const connectWebSocket = () => {
        ws.current = new WebSocket("ws://127.0.0.1:8000/ws/admin/society/");

        ws.current.onopen = () => {
            console.log("WebSocket Connected for Society List");
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket Update Received:", data);

                // Re-fetch the entire list on any update
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
            // Attempt to reconnect after a delay
            setTimeout(() => {
                connectWebSocket();
            }, 5000);
        };
    }


    // Initial fetch
    fetchPendingSocieties();

    // Establish WebSocket connection
    connectWebSocket();


    // Cleanup function to close WebSocket on unmount
    return () => {
        if (ws.current) {
            ws.current.close();
        }
    };
}, []); // Empty dependency array ensures this runs only once on mount


  const handleAccept = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, { status: "Approved" });
      // No need to manually update state; WebSocket will trigger a re-fetch
    } catch (error) {
      console.error("Error accepting society:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, { status: "Rejected" });
      // No need to manually update state; WebSocket will trigger a re-fetch
    } catch (error) {
      console.error("Error rejecting society:", error);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "name", headerName: "Name", width: 150 },
    {
      field: "societyMembers",
      headerName: "Members",
      renderCell: (params: any) => params.row.societyMembers.join(", "),
      width: 150,
    },
    { field: "leader", headerName: "Leader", width: 100 },
    { field: "category", headerName: "Category", width: 150 },
    { field: "timetable", headerName: "Timetable", width: 150 },
    { field: "membershipRequirements", headerName: "Membership Requirements", width: 200 },
    { field: "upcomingProjectsOrPlans", headerName: "Upcoming Projects", width: 200 },
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
      width: 200,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        maxHeight: "100vh",
        maxWidth: "100vw",
        marginLeft: "100px",
        padding: "10px",
        backgroundColor: theme.palette.mode === "light" ? colors.primary[1000] : colors.primary[500],
        transition: "margin-left 0.3s ease-in-out",
        position: "fixed",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1600px", padding: "0px 60px", boxSizing: "border-box" }}>
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
            height: "75vh",
            width: "100%",
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
            "& .MuiDataGrid-columnHeader": { whiteSpace: "normal", wordBreak: "break-word" },
            "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
            "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
            "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
          }}
        >
          <DataGrid rows={societies} columns={columns} checkboxSelection />
        </Box>
      </Box>
    </Box>
  );
};

export default PendingSocietyRequest;