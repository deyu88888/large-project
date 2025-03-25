

import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { 
  Box, 
  Typography, 
  useTheme, 
  Button, 
  DialogContent, 
  DialogTitle, 
  Dialog, 
  DialogContentText, 
  DialogActions, 
  TextField 
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Student } from "../../types";
import { useNavigate } from "react-router-dom";

/**
 * StudentList component displays a list of all students with filtering and actions
 */
const StudentList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  /**
   * Fetch students data from API
   */
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(apiPaths.USER.STUDENTS);
      setStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  /**
   * Filter students based on search term
   */
  const filteredStudents = useMemo(() => 
    students.filter((student) =>
      Object.values(student)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ),
    [students, searchTerm]
  );

  /**
   * Handle navigation to student detail page
   */
  const handleViewStudent = useCallback((studentId: string) => {
    navigate(`/admin/view-student/${studentId}`);
  }, [navigate]);

  /**
   * Open delete confirmation dialog
   */
  const handleOpenDialog = useCallback((student: Student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  }, []);

  /**
   * Close delete confirmation dialog
   */
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setReason('');
  }, []);

  /**
   * Handle student deletion
   */
  const handleDeleteConfirmed = useCallback(async (reason: string) => {
    if (!selectedStudent) return;
    
    try {
      await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("Student", selectedStudent.id),
        data: { reason },
      });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
    handleCloseDialog();
  }, [selectedStudent, fetchStudents, handleCloseDialog]);

  /**
   * Handle reason text field change
   */
  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  }, []);

  /**
   * Handle delete confirmation button click
   */
  const handleConfirmDelete = useCallback(() => {
    handleDeleteConfirmed(reason);
  }, [handleDeleteConfirmed, reason]);

  // DataGrid columns configuration
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      renderCell: (params: GridRenderCellParams<Student>) => 
        params.row.isActive ? "Yes" : "No",
      flex: 1,
    },
    { field: "role", headerName: "Role", flex: 1 },
    { field: "major", headerName: "Major", flex: 1 },
    {
      field: "president_of",
      headerName: "President Of",
      renderCell: (params: GridRenderCellParams<Student>) => {
        const { is_president, president_of } = params.row;
        if (!is_president) {
          return "N/A";
        }
        return Array.isArray(president_of)
          ? president_of.join(", ")
          : president_of || "N/A";
      },
      flex: 1,
    },
    
    {
      field: "is_president",
      headerName: "Is President",
      renderCell: (params: GridRenderCellParams<Student>) => 
        params.row.is_president ? "Yes" : "No",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleViewStudent(params.row.id.toString())}
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
      ),
    },
  ];
  
  // DataGrid styles
  const dataGridStyles = {
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
      color: `${colors.blueAccent[400]} !important`,
    },
    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
      color: `${colors.blueAccent[500]} !important`,
    },
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Student List
      </Typography>

      <Box sx={dataGridStyles}>
        <DataGrid
          rows={filteredStudents}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          resizeThrottleMs={0}
          autoHeight
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 100 } },
          }}
        />
      </Box>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          Please confirm that you would like to delete {selectedStudent?.first_name} {selectedStudent?.last_name}.
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You may undo this action in the Activity Log. <br />
            <strong>Compulsory:</strong> Provide a reason for deleting this student.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            variant="standard"
            value={reason}
            onChange={handleReasonChange}
            color="white"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="white">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            disabled={!reason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentList;