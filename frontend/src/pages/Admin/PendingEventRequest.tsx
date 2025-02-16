import { useState, useEffect, useRef, useContext } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: string;
  hostedBy: number;
  location: string;
};

const PendingEventRequest = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  // const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 


  const fetchPendingEvents = async () => {
    try {
      const res = await apiClient.get(apiPaths.EVENTS.PENDINGEVENTREQUEST);
      setEvents(res.data);
    } catch (error) {
      console.error("Error fetching pending events:", error);
    }
  };

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket("ws://127.0.0.1:8000/ws/admin/event/");

      ws.current.onopen = () => {
        console.log("WebSocket Connected for Pending Events");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket Update Received:", data);
          fetchPendingEvents();
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

    fetchPendingEvents();
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

  const handleAccept = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.EVENTS.UPDATEENEVENTREQUEST}/${id}`, { status: "Approved" });
    } catch (error) {
      console.error("Error accepting event:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.EVENTS.UPDATEENEVENTREQUEST}/${id}`, { status: "Rejected" });
    } catch (error) {
      console.error("Error rejecting event:", error);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "startTime", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hostedBy", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
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
        Pending Event Requests
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
          rows={filteredEvents}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          disableRowSelectionOnClick  // Disable row selection on row click to temporarily fix accept/reject button issue
        />
      </Box>
    </Box>
  );
};

export default PendingEventRequest;