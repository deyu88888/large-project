import React, { useState, useEffect, useRef, useContext } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchPendingSocieties } from "./fetchPendingSocieties";
import { useFetchPendingSocieties } from "../../hooks/useFetchPendingSocieties";

const PendingSocietyRequest = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 
  const societies = useFetchPendingSocieties();


  const filteredSocieties = Array.isArray(societies) 
  ? societies.filter((society) => {
      const searchString = Object.entries(society)
        .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
        .join(" ")
        .toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    }).map((society) => ({
      ...society,
      society_members: Array.isArray(society.society_members) 
        ? society.society_members.join(", ") 
        : society.society_members,
    }))
  : [];

  

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
      field: "society_members",
      headerName: "Members",
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
        {/* <div> {JSON.stringify(filteredSocieties)} </div> */}
      </Box>
    </Box>
  );
};

export default PendingSocietyRequest;
