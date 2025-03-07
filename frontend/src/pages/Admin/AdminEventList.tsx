import React, { useEffect, useState, useContext, useRef } from "react";
import { Box, Typography, useTheme, Button, DialogTitle, DialogContent, DialogContentText, Dialog, DialogActions } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Event } from '../../types'


const EventList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  const ws = useRef<WebSocket | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get(apiPaths.EVENTS.APPROVEDEVENTLIST);
      setEvents(res.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
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

    //Initial fetch
    fetchEvents();
    //Establish websocket connection
    connectWebSocket();

  return () => {
      if (ws.current) {
        ws.current.close();
      }
  };

}, []);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
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
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false, 
      renderCell: (params) => {
        const eventId = params.row.id;
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewEvent(eventId)}
              sx={{ marginRight: "8px" }}
            >
              View
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleOpenDialog(params.row)}
            >
              Delete
            </Button>
          </Box>
        );
      },
    },
  ];

  const handleViewEvent = (eventId: string) => {
    navigate(`/admin/view-event/${eventId}`);
  };
  
  const handleOpenDialog = (event: Event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedEvent !== null) {
      try {
        await apiClient.delete(apiPaths.USER.DELETEEVENT(selectedEvent.id));
        fetchEvents();
      } catch (error) {
        console.error("Error deleting society:", error);
      }
      handleCloseDialog();
    }
  };

  const filteredEvents = events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );


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
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          resizeThrottleMs={0}
          autoHeight
        />
      </Box>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Please confirm that you would like to permanently delete {selectedEvent?.title}.</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You may undo this action in Activity Log.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirmed} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventList;