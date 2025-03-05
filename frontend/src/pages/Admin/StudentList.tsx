import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Student } from "../../types.ts"


const StudentList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [students, setStudents] = useState<Student[]>([]);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 


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
    { field: "id", headerName: "ID", flex: 1 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "firstName", headerName: "First Name", flex: 1 },
    { field: "lastName", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "isActive",
      headerName: "Active",
      renderCell: (params: any) => (params.row.isActive ? "Yes" : "No"),
      flex: 1,
    },
    { field: "role", headerName: "Role", flex: 1 },
    { field: "major", headerName: "Major", flex: 1 },
    {
      field: "societies",
      headerName: "Societies",
      renderCell: (params: any) => params.row.societies.join(", "),
      flex: 1,
    },
    {
      field: "presidentOf",
      headerName: "President Of",
      renderCell: (params: { row: Student }) => (params.row.presidentOf ?? []).join(", "),
      flex: 1,
    },
    {
      field: "isPresident",
      headerName: "Is President",
      renderCell: (params: any) => (params.row.isPresident ? "Yes" : "No"),
      flex: 1,
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
          color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Student List
      </Typography>

      <Box sx={{ height: "78vh",
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
              color: `${colors.blueAccent[400]} !important`,
            },
            "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
          }}
        >
        <DataGrid
          rows={filteredStudents}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          resizeThrottleMs={0}
        />
      </Box>
    </Box>
  );
};

export default StudentList;