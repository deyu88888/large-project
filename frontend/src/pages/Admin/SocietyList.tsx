import React, { useState, useEffect, useRef, useContext } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { drawer } = useSettingsStore(); 
  const { searchTerm } = useContext(SearchContext);


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
  { field: "name", headerName: "Name", flex: 1 },
  { field: "leader", headerName: "Leader", flex: 1 },
  { field: "members", headerName: "Members", flex: 1 },
  { field: "roles", headerName: "Roles", flex: 1  },
  { field: "approvedBy", headerName: "Approved By", flex: 1  },
  // { field: "actions", headerName: "Actions", flex: 1  },
];

const filteredSocieties = societies.filter((society) =>
  Object.values(society)
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);   

  const handleRejectPageNavigation = () => {
    navigate("/admin/society-list-rejected");
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)", // Full height minus the AppBar height
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
      }}
    >

        <Button
          variant="contained"
          color="error"
          onClick={handleRejectPageNavigation}
          sx={{
            position: "absolute",
            top: 85,
            right: 30,
            backgroundColor: colors.blueAccent[500],
            "&:hover": {
              backgroundColor: colors.blueAccent[700],
            },
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            marginTop: {
              xs: "3rem",  // Top margin for small screens
              md: "0rem",       // No margin for medium and larger screens
            },
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

export default SocietyList;