import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: string;
  hostedBy: number;
  location: string;
}

const EventList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const getdata = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.EVENTS);
        console.log("Fetched Events:", res.data);
        setEvents(res.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    getdata();
  }, []);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 150 },
    { field: "title", headerName: "Title", width: 150 },
    { field: "description", headerName: "Description", width: 150 },
    { field: "date", headerName: "Date", width: 150 },
    { field: "startTime", headerName: "Start Time", width: 150 },
    { field: "duration", headerName: "Duration", width: 100 },
    { field: "hostedBy", headerName: "Hosted By", width: 100 },
    { field: "location", headerName: "Location", width: 150 },
  ];

  const handleRejectPageNavigation = () => {
    navigate("/admin/event-list-rejected");
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
          Rejected Events
          <span
            style={{
              marginLeft: "8px",
              fontSize: "18px",
            }}
          >
            →
          </span>
        </Button>
        <Typography
          variant="h1"
          sx={{
            color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
            fontSize: "2.25rem",
            fontWeight: 800,
            marginBottom: "2rem",
          }}
        >
          Event List
        </Typography>
        <Box
          sx={{
            height: "75vh",
            width: "100%",
            "& .MuiDataGrid-root": {
              border: "none",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none",
            },
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
          <DataGrid rows={events} columns={columns} pageSize={5} checkboxSelection />
        </Box>
      </Box>
    </Box>
  );
};

export default EventList;