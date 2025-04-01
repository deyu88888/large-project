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
  TextField, 
  Snackbar
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Student } from "../../types";
import { useNavigate } from "react-router-dom";
import {
  StudentListState,
  DialogState,
  ActionButtonsProps,
  DeleteDialogProps,
  DataGridContainerProps,
  PageTitleProps,
  PresidentCellProps,
  BooleanCellProps,
  NotificationState
} from "../../types/admin/StudentList";
import { Alert as MuiAlert } from "../../components/Alert";

const filterStudentsBySearchTerm = (students: Student[], searchTerm: string): Student[] => {
  if (!searchTerm) return students;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return students.filter((student) =>
    Object.values(student)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};

const fetchStudentList = async (): Promise<Student[]> => {
  const res = await apiClient.get(apiPaths.USER.STUDENTS);
  return res.data || [];
};

const deleteStudent = async (studentId: number | string, reason: string): Promise<void> => {
  try {
    console.log(`Attempting to delete student ${studentId} with reason: ${reason}`);
    const response = await apiClient.request({
      method: "DELETE",
      url: apiPaths.USER.DELETE("Student", Number(studentId)),
      data: { reason },
    });
    console.log("Delete successful:", response);
  } catch (error) {
    console.error("Delete error details:", error.response?.data || error);
    throw error;
  }
};

const PageTitle: React.FC<PageTitleProps> = ({ title, colors }) => {
  return (
    <Typography
      variant="h1"
      sx={{
        color: colors.grey[100],
        fontSize: "1.75rem",
        fontWeight: 800,
        marginBottom: "1rem",
      }}
    >
      {title}
    </Typography>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  studentId, 
  student, 
  onView, 
  onDelete 
}) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(studentId.toString())}
        sx={{ marginRight: "8px" }}
      >
        View
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => onDelete(student)}
      >
        Delete
      </Button>
    </Box>
  );
};

const BooleanCell: React.FC<BooleanCellProps> = ({ value }) => {
  return <>{value ? "Yes" : "No"}</>;
};

const PresidentCell: React.FC<PresidentCellProps> = ({ isPresident, presidentOf }) => {
  if (!isPresident) {
    return <>N/A</>;
  }
  
  if (Array.isArray(presidentOf)) {
    return <>{presidentOf.join(", ")}</>;
  }
  
  return <>{presidentOf || "N/A"}</>;
};

interface PresidentWarningDialogProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
}

const PresidentWarningDialog: React.FC<PresidentWarningDialogProps> = ({
  open,
  student,
  onClose
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: "#f8d7da", color: "#721c24" }}>
        President Cannot Be Deleted
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
          This action cannot be completed due to role restrictions.
        </Alert>
        <DialogContentText>
          {student?.first_name} {student?.last_name} is currently a president of{" "}
          <strong>{student?.president_of}</strong>.
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          Presidents cannot be deleted until their presidency is transferred to another student.
          Please contact this student to arrange for presidency transfer before attempting deletion.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary" 
          autoFocus
        >
          Understood
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({ 
  dialogState, 
  onClose, 
  onReasonChange, 
  onConfirm 
}) => {
  const { open, selectedStudent, reason } = dialogState;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Confirm Student Deletion
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
          You are about to delete {selectedStudent?.first_name} {selectedStudent?.last_name}.
        </Alert>
        <DialogContentText>
          You may undo this action in the Activity Log. <br />
          <strong>Compulsory:</strong> Provide a reason for deleting this student.
        </DialogContentText>
        <TextField
          autoFocus
          label="Reason for Deletion"
          fullWidth
          variant="outlined"
          value={reason}
          onChange={onReasonChange}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained"
          color="error"
          disabled={!reason.trim()}
        >
          Delete Student
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({
  students,
  columns,
  loading,
  colors,
  drawer
}) => {
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
    <Box sx={dataGridStyles}>
      <DataGrid
        rows={students}
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
  );
};

const createStudentColumns = (
  handleViewStudent: (id: string) => void,
  handleOpenDialog: (student: Student) => void
): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      renderCell: (params: GridRenderCellParams<Student>) => (
        <BooleanCell value={params.row.is_active} />
      ),
      flex: 1,
    },
    { field: "role", headerName: "Role", flex: 1 },
    { field: "major", headerName: "Major", flex: 1 },
    {
      field: "president_of",
      headerName: "President Of",
      renderCell: (params: GridRenderCellParams<Student>) => (
        <PresidentCell 
          isPresident={params.row.is_president} 
          presidentOf={params.row.president_of as any} 
        />
      ),
      flex: 1,
    },
    {
      field: "is_president",
      headerName: "Is President",
      renderCell: (params: GridRenderCellParams<Student>) => (
        <BooleanCell value={params.row.is_president} />
      ),
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
        <ActionButtons 
          studentId={params.row.id}
          student={params.row}
          onView={handleViewStudent}
          onDelete={handleOpenDialog}
        />
      ),
    },
  ];
};

const StudentList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info"
  });
  
  const [studentState, setStudentState] = useState<StudentListState>({
    students: [],
    loading: true
  });
  
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    selectedStudent: null,
    reason: ''
  });

  const [presidentWarningDialog, setPresidentWarningDialog] = useState({
    open: false,
    student: null as Student | null
  });

  const loadStudents = useCallback(async () => {
    setStudentState(prev => ({ ...prev, loading: true }));
    
    try {
      const data = await fetchStudentList();
      setStudentState({
        students: data,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudentState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleViewStudent = useCallback((studentId: string) => {
    navigate(`/admin/view-student/${studentId}`);
  }, [navigate]);

  const handleOpenDialog = useCallback((student: Student) => {
    if (student.is_president) {
      setPresidentWarningDialog({
        open: true,
        student
      });
      return;
    }
    
    setDialogState({
      open: true,
      selectedStudent: student,
      reason: ''
    });
  }, []);

  const handleCloseWarningDialog = useCallback(() => {
    setPresidentWarningDialog({
      open: false,
      student: null
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState({
      open: false,
      selectedStudent: null,
      reason: ''
    });
  }, []);

  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDialogState(prev => ({
      ...prev,
      reason: event.target.value
    }));
  }, []);

  const handleNotificationClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    const { selectedStudent, reason } = dialogState;
    
    if (!selectedStudent) return;
    
    try {
      await deleteStudent(selectedStudent.id, reason);
      console.log("Deletion successful, reloading students");
      setNotification({
        open: true,
        message: `Student ${selectedStudent.first_name} ${selectedStudent.last_name} was successfully deleted.`,
        severity: "success"
      });
      loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      setNotification({
        open: true,
        message: `Failed to delete student: ${error.response?.data?.message || "Unknown error"}`,
        severity: "error"
      });
    }
    
    handleCloseDialog();
  }, [dialogState, loadStudents, handleCloseDialog]);

  const filteredStudents = useMemo(() => 
    filterStudentsBySearchTerm(studentState.students, searchTerm || ''),
    [studentState.students, searchTerm]
  );

  const columns = useMemo(() => 
    createStudentColumns(handleViewStudent, handleOpenDialog),
    [handleViewStudent, handleOpenDialog]
  );

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <PageTitle title="Student List" colors={colors} />

      <DataGridContainer 
        students={filteredStudents}
        columns={columns}
        loading={studentState.loading}
        colors={colors}
        drawer={drawer}
      />
      
      <PresidentWarningDialog 
        open={presidentWarningDialog.open}
        student={presidentWarningDialog.student}
        onClose={handleCloseWarningDialog}
      />
      
      <DeleteDialog 
        dialogState={dialogState}
        onClose={handleCloseDialog}
        onReasonChange={handleReasonChange}
        onConfirm={handleDeleteConfirmed}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={notification.message}
        ContentProps={{
          sx: {
            backgroundColor: notification.severity === "success" ? "green" : 
                            notification.severity === "error" ? "red" : 
                            notification.severity === "warning" ? "orange" : "blue"
          }
        }}
      />
    </Box>
  );
};

export default StudentList;