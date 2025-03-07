import { useState, useEffect, useRef, useContext, useMemo } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types'
import { useNavigate } from "react-router-dom";


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
    };
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
      { field: "id", headerName: "ID", flex: 0.5 },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "description", headerName: "Description", flex: 1},
      { field: "president", headerName: "president", flex: 1 },
      { field: "members", headerName: "Members", flex: 1 },
      { field: "roles", headerName: "Roles", flex: 1 },
      { field: "approvedBy", headerName: "Approved By", flex: 1 },
      { field: "category", headerName: "Category", flex: 1 },
      { field: "membershipRequirements", headerName: "Membership Requirements", flex: 1 },
      { field: "upcomingProjectsOrPlans", headerName: "Upcoming Projects", flex: 1 },
      {
        field: "actions",
        headerName: "Actions",
        width: 240,
        minWidth: 240,
        sortable: false,
        filterable: false, 
        renderCell: (params) => {
          const societyId = params.row.id;
          return (
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleViewSociety(societyId)}
                sx={{ marginRight: "8px" }}
              >
                View
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteSociety(societyId)}
              >
                Delete
              </Button>
            </Box>
          );
        },
      },
    ];

    const handleViewSociety = (societyId: string) => {
      navigate(`/admin/view-society/${societyId}`);
    };
    
    const handleDeleteSociety = async (societyId: string) => {
      try {
        await apiClient.delete(`${apiPaths.USER.SOCIETY}/${societyId}`);  // Adjusted API endpoint
        fetchSocieties();
      } catch (error) {
        console.error("Error deleting society:", error);
      }
    };

  const filteredSocieties = useMemo(
    () =>
      societies.filter((society) =>
        Object.values(society)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [societies, searchTerm]
  );


  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)", // Full height minus the AppBar height
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
            color: `${colors.blueAccent[400]} !important`,
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
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          resizeThrottleMs={0}
        />
      </Box>
    </Box>
  );
};

export default SocietyList;