import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";

interface Student {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  role: string;
  major: string;
  societies: any[];
  presidentOf: number[];
  isPresident: boolean;
}

function StudentList() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const getdata = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.STUDENTS);
        setStudents(res.data || []);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    getdata();
  }, []);

  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "username", headerName: "Username", width: 100 },
    { field: "firstName", headerName: "First Name", width: 100 },
    { field: "lastName", headerName: "Last Name", width: 100 },
    { field: "email", headerName: "Email", width: 100 },
    {
      field: "isActive",
      headerName: "Active",
      renderCell: (params: any) => (params.row.isActive ? "Yes" : "No"),
      width: 100,
    },
    { field: "role", headerName: "Role", width: 100 },
    { field: "major", headerName: "Major", width: 100 },
    {
      field: "societies",
      headerName: "Societies",
      renderCell: (params: any) => params.row.societies.join(", "),
      width: 100,
    },
    {
      field: "presidentOf",
      headerName: "President Of",
      renderCell: (params: any) => params.row.presidentOf.join(", "),
      width: 100,
    },
    {
      field: "isPresident",
      headerName: "Is President",
      renderCell: (params: any) => (params.row.isPresident ? "Yes" : "No"),
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
      <Box
        sx={{
          width: "100%",
          maxWidth: "1600px",
          padding: "0px 60px",
          boxSizing: "border-box",
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
            fontSize: "2.25rem",
            fontWeight: 800,
            marginBottom: "2rem",
          }}
        >
          Student List
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
          <DataGrid rows={students} columns={columns} pageSize={5} checkboxSelection />
        </Box>
      </Box>
    </Box>
  );
}

export default StudentList;