import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { Box, Typography, useTheme, Button, DialogContent, DialogTitle, Dialog, DialogContentText, DialogActions, TextField } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { useNavigate } from "react-router-dom";
const filterStudentsBySearchTerm = (students, searchTerm) => {
    if (!searchTerm)
        return students;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return students.filter((student) => Object.values(student)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm));
};
const fetchStudentList = async () => {
    const res = await apiClient.get(apiPaths.USER.STUDENTS);
    return res.data || [];
};
const deleteStudent = async (studentId, reason) => {
    await apiClient.request({
        method: "DELETE",
        url: apiPaths.USER.DELETE("Student", studentId),
        data: { reason },
    });
};
const PageTitle = ({ title, colors }) => {
    return (_jsx(Typography, { variant: "h1", sx: {
            color: colors.grey[100],
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "1rem",
        }, children: title }));
};
const ActionButtons = ({ studentId, student, onView, onDelete }) => {
    return (_jsxs(Box, { children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => onView(studentId.toString()), sx: { marginRight: "8px" }, children: "View" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onDelete(student), children: "Delete" })] }));
};
const BooleanCell = ({ value }) => {
    return _jsx(_Fragment, { children: value ? "Yes" : "No" });
};
const PresidentCell = ({ isPresident, presidentOf }) => {
    if (!isPresident) {
        return _jsx(_Fragment, { children: "N/A" });
    }
    if (Array.isArray(presidentOf)) {
        return _jsx(_Fragment, { children: presidentOf.join(", ") });
    }
    return _jsx(_Fragment, { children: presidentOf || "N/A" });
};
const DeleteDialog = ({ dialogState, onClose, onReasonChange, onConfirm }) => {
    const { open, selectedStudent, reason } = dialogState;
    return (_jsxs(Dialog, { open: open, onClose: onClose, children: [_jsxs(DialogTitle, { children: ["Please confirm that you would like to delete ", selectedStudent?.first_name, " ", selectedStudent?.last_name, "."] }), _jsxs(DialogContent, { children: [_jsxs(DialogContentText, { children: ["You may undo this action in the Activity Log. ", _jsx("br", {}), _jsx("strong", { children: "Compulsory:" }), " Provide a reason for deleting this student."] }), _jsx(TextField, { autoFocus: true, label: "Reason for Deletion", fullWidth: true, variant: "standard", value: reason, onChange: onReasonChange })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, color: "primary", children: "Cancel" }), _jsx(Button, { onClick: onConfirm, color: "error", disabled: !reason.trim(), children: "Confirm" })] })] }));
};
const DataGridContainer = ({ students, columns, loading, colors, drawer }) => {
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
    return (_jsx(Box, { sx: dataGridStyles, children: _jsx(DataGrid, { rows: students, columns: columns, slots: { toolbar: GridToolbar }, resizeThrottleMs: 0, autoHeight: true, loading: loading, disableRowSelectionOnClick: true, initialState: {
                pagination: { paginationModel: { pageSize: 100 } },
            } }) }));
};
const createStudentColumns = (handleViewStudent, handleOpenDialog) => {
    return [
        { field: "id", headerName: "ID", flex: 0.3 },
        { field: "username", headerName: "Username", flex: 1 },
        { field: "first_name", headerName: "First Name", flex: 1 },
        { field: "last_name", headerName: "Last Name", flex: 1 },
        { field: "email", headerName: "Email", flex: 1 },
        {
            field: "is_active",
            headerName: "Active",
            renderCell: (params) => (_jsx(BooleanCell, { value: params.row.isActive })),
            flex: 1,
        },
        { field: "role", headerName: "Role", flex: 1 },
        { field: "major", headerName: "Major", flex: 1 },
        {
            field: "president_of",
            headerName: "President Of",
            renderCell: (params) => (_jsx(PresidentCell, { isPresident: params.row.is_president, presidentOf: params.row.president_of })),
            flex: 1,
        },
        {
            field: "is_president",
            headerName: "Is President",
            renderCell: (params) => (_jsx(BooleanCell, { value: params.row.is_president })),
            flex: 1,
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 170,
            minWidth: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (_jsx(ActionButtons, { studentId: params.row.id, student: params.row, onView: handleViewStudent, onDelete: handleOpenDialog })),
        },
    ];
};
/**
 * StudentList component displays a list of all students with filtering and actions
 */
const StudentList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [studentState, setStudentState] = useState({
        students: [],
        loading: true
    });
    const [dialogState, setDialogState] = useState({
        open: false,
        selectedStudent: null,
        reason: ''
    });
    const loadStudents = useCallback(async () => {
        setStudentState(prev => ({ ...prev, loading: true }));
        try {
            const data = await fetchStudentList();
            setStudentState({
                students: data,
                loading: false
            });
        }
        catch (error) {
            console.error("Error fetching students:", error);
            setStudentState(prev => ({ ...prev, loading: false }));
        }
    }, []);
    useEffect(() => {
        loadStudents();
    }, [loadStudents]);
    const handleViewStudent = useCallback((studentId) => {
        navigate(`/admin/view-student/${studentId}`);
    }, [navigate]);
    const handleOpenDialog = useCallback((student) => {
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
    const handleReasonChange = useCallback((event) => {
        setDialogState(prev => ({
            ...prev,
            reason: event.target.value
        }));
    }, []);
    const handleDeleteConfirmed = useCallback(async () => {
        const { selectedStudent, reason } = dialogState;
        if (!selectedStudent)
            return;
        try {
            await deleteStudent(selectedStudent.id, reason);
            loadStudents();
        }
        catch (error) {
            console.error("Error deleting student:", error);
        }
        handleCloseDialog();
    }, [dialogState, loadStudents, handleCloseDialog]);
    const filteredStudents = useMemo(() => filterStudentsBySearchTerm(studentState.students, searchTerm || ''), [studentState.students, searchTerm]);
    const columns = useMemo(() => createStudentColumns(handleViewStudent, handleOpenDialog), [handleViewStudent, handleOpenDialog]);
    return (_jsxs(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: [_jsx(PageTitle, { title: "Student List", colors: colors }), _jsx(DataGridContainer, { students: filteredStudents, columns: columns, loading: studentState.loading, colors: colors, drawer: drawer }), _jsx(DeleteDialog, { dialogState: dialogState, onClose: handleCloseDialog, onReasonChange: handleReasonChange, onConfirm: handleDeleteConfirmed })] }));
};
export default StudentList;
