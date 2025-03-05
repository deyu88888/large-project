import { useState, useEffect, useContext, useRef } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Event } from '../../types'


const EventListRejected = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { drawer } = useSettingsStore();
  const [events, setEvents] = useState<Event[]>([]);
  const { searchTerm } = useContext(SearchContext);
  const ws = useRef<WebSocket | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get(apiPaths.EVENTS.REJECTEDEVENTLIST);
      console.log("Fetched Rejected Events:", res.data);
      setEvents(res.data || []);
    } catch (error) {
      console.error("Error fetching rejected events:", error);
    }
  };

  useEffect(() => {

      const connectWebSocket = () => {
        ws.current = new WebSocket("ws://127.0.0.1:8000/ws/admin/event/");
  
        ws.current.onopen = () => {
            console.log("WebSocket Connected for Society List");
        };
  
        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket Update Received:", data);
                // Re-fetch on any update
                fetchEvents();
  
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

    fetchEvents();
      //Establish websocket connection
      connectWebSocket();
  
    return () => {
        if (ws.current) {
          ws.current.close();
        }
    };
  
  }, []);
     
  const filteredEvents = events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleBackToEvents = () => {
    navigate("/admin/event-list");
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "startTime", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hostedBy", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
  ];

  return (
    <Box
    sx={{
      height: "calc(100vh - 64px)", // Full height minus AppBar height
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
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          resizeThrottleMs={0}
        />
      </Box>
    </Box>
  );
};

export default EventListRejected;