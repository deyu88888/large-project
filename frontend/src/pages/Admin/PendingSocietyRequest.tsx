import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchPendingSocieties = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
        console.log("Fetched Pending Societies:", res.data);
        setSocieties(res.data || []);
      } catch (error) {
        console.error("Error fetching pending societies:", error);
      }
    };
    fetchPendingSocieties();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, { status: "Approved" });
      setSocieties((prev) => prev.filter((society) => society.id !== id));
    } catch (error) {
      console.error("Error accepting society:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.USER.PENDINGSOCIETYREQUEST}/${id}`, { status: "Rejected" });
      setSocieties((prev) => prev.filter((society) => society.id !== id));
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