import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";

interface Society {
  name: string;
  leader: string;
  members: string;
  roles: any;
  approvedBy: any;
  actions: any;
}

const SocietyList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<Society[]>([]);

  useEffect(() => {
    const getdata = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.SOCIETY);
        setSocieties(res.data || []);
      } catch (error) {
        console.error("Error fetching societies:", error);
      }
    };
    getdata();
  }, []);

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "leader", headerName: "Leader", width: 200 },
    { field: "members", headerName: "Members", width: 150 },
    { field: "roles", headerName: "Roles", width: 200 },
    { field: "approvedBy", headerName: "Approved By", width: 150 },
    { field: "actions", headerName: "Actions", width: 200 },
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
          <DataGrid rows={societies} columns={columns} pageSize={5} checkboxSelection />
        </Box>
      </Box>
    </Box>
  );
};

export default SocietyList;