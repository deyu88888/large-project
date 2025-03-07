import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, useTheme, Button, DialogContent, DialogTitle, Dialog, DialogContentText, DialogActions } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Student } from "../../types.ts"
import { useNavigate } from "react-router-dom";


const StudentList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);


  const getData = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.STUDENTS);
      setStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
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
    { field: "id", headerName: "ID", flex: 0.3 },
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
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false, 
      renderCell: (params: any) => {
        const studentId = params.row.id;
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewStudent(studentId)}
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

  const handleViewStudent = (studentId: string) => {
    navigate(`/admin/view-student/${studentId}`);
  };
  
  const handleOpenDialog = (student: Student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedStudent !== null) {
      try {
        await apiClient.delete(apiPaths.USER.DELETESTUDENT(selectedStudent.id));
        getData();
      } catch (error) {
        console.error("Error deleting student:", error);
      }
      handleCloseDialog();
    }
  };

  
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
          resizeThrottleMs={0}
          autoHeight
        />
      </Box>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Please confirm that you would like to permanently delete {selectedStudent?.first_name} {selectedStudent?.lastName}.</DialogTitle>
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

export default StudentList;