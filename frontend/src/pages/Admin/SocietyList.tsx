import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";

// Consistent Society type
interface Society {
  id: number;
  name: string;
  leader: string;
  members: string[]; // Assuming members is an array of strings
  roles: Record<string, string>; // Assuming roles is a key-value object
  approvedBy: string;
}

const SocietyList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<Society[]>([]);
  const ws = useRef<WebSocket | null>(null);

    const fetchSocieties = async () => {
        try {
            const res = await apiClient.get(apiPaths.USER.SOCIETY);
            setSocieties(res.data);
        } catch (error) {
            console.error("Error fetching societies:", error);
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

                // Re-fetch on any update
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
            }, 5000);
        };
    }
      //Initial fetch
      fetchSocieties();

      //Establish websocket connection
      connectWebSocket();

    return () => {
        if (ws.current) {
          ws.current.close();
        }
    };
}, []);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 100 }, // Add ID column
    { field: "name", headerName: "Name", width: 150 },
    { field: "leader", headerName: "Leader", width: 200 },
    { field: "members", headerName: "Members", width: 150, valueGetter: (params) => params.row.members.join(", ") }, // Display as comma-separated string
    { field: "roles", headerName: "Roles", width: 200, valueGetter: (params) => JSON.stringify(params.row.roles) }, // Display as JSON string
    { field: "approvedBy", headerName: "Approved By", width: 150 },
  ];

  const handleRejectPageNavigation = () => {
    navigate("/admin/society-list-rejected");
  };

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
      <Box
        sx={{
          width: "100%",
          maxWidth: "1600px",
          padding: "0px 60px",
          boxSizing: "border-box",
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={handleRejectPageNavigation}
          sx={{
            position: "absolute",
            top: 20,
            right: 75,
            backgroundColor: colors.blueAccent[500],
            "&:hover": {
              backgroundColor: colors.blueAccent[700],
            },
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
          }}
        >
          Rejected Societies
          <span style={{ marginLeft: "8px", fontSize: "18px" }}>→</span>
        </Button>
        <Typography
          variant="h1"
          sx={{
            color: colors.grey[100],
            fontSize: "2.25rem",
            fontWeight: 800,
            marginBottom: "2rem",
          }}
        >
          Society List
        </Typography>
        <Box
          sx={{
            height: "75vh",
            width: "100%",
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
          }}
        >
          <DataGrid
            rows={societies}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
           />
        </Box>
      </Box>
    </Box>
  );
};

export default SocietyList;