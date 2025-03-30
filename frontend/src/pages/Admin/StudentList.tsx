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
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import { FaSync } from "react-icons/fa";

interface DialogState {
  open: boolean;
  selectedStudent: Student | null;
  reason: string;
}

interface ActionButtonsProps {
  studentId: number | string;
  student: Student;
  onView: (id: string) => void;
  onDelete: (student: Student) => void;
}

interface DeleteDialogProps {
  dialogState: DialogState;
  onClose: () => void;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}

interface DataGridContainerProps {
  students: Student[];
  columns: GridColDef[];
  loading: boolean;
  colors: ReturnType<typeof tokens>;
  drawer: boolean;
}

interface HeaderProps {
  colors: ReturnType<typeof tokens>;
  isConnected: boolean;
  onRefresh: () => void;
}

interface PresidentCellProps {
  isPresident: boolean;
  presidentOf: string[] | string | null;
}

interface BooleanCellProps {
  value: boolean;
}

const Header: React.FC<HeaderProps> = ({ colors, isConnected, onRefresh }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
        }}
      >
        Student List
      </Typography>
      
      <Box display="flex" alignItems="center">
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? colors.greenAccent[500] : colors.orangeAccent[500],
            mr: 1
          }}
        />
        <Typography variant="body2" fontSize="0.75rem" color={colors.grey[300]} mr={2}>
          {isConnected ? 'Live updates' : 'Offline mode'}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FaSync />}
          onClick={onRefresh}
          size="small"
          sx={{ borderRadius: "8px" }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

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
  try {
    const res = await apiClient.get(apiPaths.USER.STUDENTS);
    return res.data || [];
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

const deleteStudent = async (studentId: number | string, reason: string): Promise<void> => {
  await apiClient.request({
    method: "DELETE",
    url: apiPaths.USER.DELETE("Student", Number(studentId)),
    data: { reason },
  });
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

const DeleteDialog: React.FC<DeleteDialogProps> = ({ 
  dialogState, 
  onClose, 
  onReasonChange, 
  onConfirm 
}) => {
  const { open, selectedStudent, reason } = dialogState;
  
  return (
    <Dialog open={open} onClose={onClose}>
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
          label="Reason for Deletion"
          fullWidth
          variant="standard"
          value={reason}
          onChange={onReasonChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={!reason.trim()}
        >
          Confirm
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

/**
 * StudentList component displays a list of all students with filtering and actions
 */
const StudentList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    selectedStudent: null,
    reason: ''
  });

  
  const { 
    data: students, 
    loading, 
    error, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<Student[]>(
    'admin/students', 
    fetchStudentList
  );
  
  
  useEffect(() => {
    if (error) {
      console.error(`WebSocket error: ${error}`);
    }
  }, [error]);
  
  const handleViewStudent = useCallback((studentId: string) => {
    navigate(`/admin/view-student/${studentId}`);
  }, [navigate]);

  const handleOpenDialog = useCallback((student: Student) => {
    setDialogState({
      open: true,
      selectedStudent: student,
      reason: ''
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

  const handleDeleteConfirmed = useCallback(async () => {
    const { selectedStudent, reason } = dialogState;
    
    if (!selectedStudent) return;
    
    try {
      await deleteStudent(selectedStudent.id, reason);
      
      refresh();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
    
    handleCloseDialog();
  }, [dialogState, refresh, handleCloseDialog]);
  
  const filteredStudents = useMemo(() => 
    filterStudentsBySearchTerm(students || [], searchTerm || ''),
    [students, searchTerm]
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
      <Header 
        colors={colors}
        isConnected={isConnected}
        onRefresh={refresh}
      />

      <DataGridContainer 
        students={filteredStudents}
        columns={columns}
        loading={loading}
        colors={colors}
        drawer={drawer}
      />
      
      <DeleteDialog 
        dialogState={dialogState}
        onClose={handleCloseDialog}
        onReasonChange={handleReasonChange}
        onConfirm={handleDeleteConfirmed}
      />
    </Box>
  );
};

export default StudentList;