import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";

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

const EventListRejected = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const { searchTerm } = useContext(SearchContext);

  useEffect(() => {
    const getdata = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.REJECTEDEVENT);
        console.log("Fetched Rejected Events:", res.data);
        setEvents(res.data || []);
      } catch (error) {
        console.error("Error fetching rejected events:", error);
      }
    };
    getdata();
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
        height: "calc(100vh - 64px)", 
        maxWidth: "100%",
      }}
    >
      <Button
        variant="contained"
        color="error"
        onClick={handleBackToEvents}
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
        }}
      >
        <span style={{ marginRight: "8px", fontSize: "18px" }}>←</span>
        Back to Events
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
        Rejected Event List
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
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={filteredEvents}
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

export default EventListRejected;