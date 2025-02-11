import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import Topbar from "../../components/layout/Topbar";
// import Topbar from "../Topbar"; // Import Topbar

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

const StudentList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // Local search state

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.STUDENTS);
        setStudents(res.data || []);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    getData();
  }, []);

  // Filter students based on search term (if provided)
  const filteredStudents = students.filter((student) =>
    Object.values(student)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );        

  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "username", headerName: "Username", width: 150 },
    { field: "firstName", headerName: "First Name", width: 150 },
    { field: "lastName", headerName: "Last Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "isActive",
      headerName: "Active",
      renderCell: (params: any) => (params.row.isActive ? "Yes" : "No"),
      width: 100,
    },
    { field: "role", headerName: "Role", width: 150 },
    { field: "major", headerName: "Major", width: 150 },
    {
      field: "societies",
      headerName: "Societies",
      renderCell: (params: any) => params.row.societies.join(", "),
      width: 200,
    },
    {
      field: "presidentOf",
      headerName: "President Of",
      renderCell: (params: any) => params.row.presidentOf.join(", "),
      width: 200,
    },
    {
      field: "isPresident",
      headerName: "Is President",
      renderCell: (params: any) => (params.row.isPresident ? "Yes" : "No"),
      width: 150,
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
        {/* Pass searchTerm state to Topbar */}
        <Topbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <Typography
          variant="h1"
          sx={{
            color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
            fontSize: "2.25rem",
            fontWeight: 800,
            marginBottom: "1rem",
          }}
        >
          Student List
        </Typography>

        {/* DataGrid (Always Visible, Filters When Search is Active) */}
        <Box sx={{ height: "75vh", width: "100%" }}>
          <DataGrid rows={filteredStudents} columns={columns} pageSize={5} checkboxSelection />
        </Box>
      </Box>
    </Box>
  );
};

export default StudentList;