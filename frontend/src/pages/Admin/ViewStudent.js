import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress, Paper, Grid, FormControlLabel, Switch, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api.ts";
import { useAuthStore } from "../../stores/auth-store.ts";
import { tokens } from "../../theme/theme.ts";
const fetchStudentData = async (studentId) => {
    const response = await apiClient.get(apiPaths.USER.ADMINSTUDENTVIEW(studentId));
    return response.data;
};
const updateStudentData = async (studentId, formData) => {
    await apiClient.patch(`/api/admin/manage-student/${studentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
const createFormDataFromStudent = (student) => {
    const formDataToSend = new FormData();
    formDataToSend.append("username", student.username);
    formDataToSend.append("first_name", student.first_name);
    formDataToSend.append("last_name", student.last_name);
    formDataToSend.append("email", student.email);
    formDataToSend.append("is_active", String(student.is_active));
    formDataToSend.append("role", student.role);
    formDataToSend.append("major", student.major);
    student.societies.forEach((id) => {
        formDataToSend.append("societies", String(id));
    });
    if (student.president_of) {
        formDataToSend.append("president_of", String(student.president_of));
    }
    else {
        formDataToSend.append("president_of", "");
    }
    formDataToSend.append("is_president", String(student.is_president));
    return formDataToSend;
};
const parseSocietiesString = (value) => {
    return value
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((id) => !isNaN(id));
};
const parsePresidentOfString = (value) => {
    return value
        .split(",")
        .map((id) => parseInt(id.trim()));
};
const FormTextField = ({ label, name, value, onChange, fullWidth = true }) => (_jsx(TextField, { fullWidth: fullWidth, label: label, name: name, value: value, onChange: onChange }));
const SwitchField = ({ label, name, checked, onChange }) => (_jsx(FormControlLabel, { control: _jsx(Switch, { checked: checked, onChange: (e) => onChange(e.target.checked), name: name }), label: label }));
const SocietiesField = ({ value, onChange }) => {
    const handleChange = (e) => {
        const societies = parseSocietiesString(e.target.value);
        onChange(societies);
    };
    return (_jsx(TextField, { fullWidth: true, label: "Societies", name: "societies", value: value.join(", "), onChange: handleChange }));
};
const PresidentField = ({ value, onChange }) => {
    const handleChange = (e) => {
        const presidentOf = parsePresidentOfString(e.target.value);
        onChange(presidentOf);
    };
    return (_jsx(TextField, { fullWidth: true, label: "President Of (IDs)", name: "president_of", value: value || "", onChange: handleChange }));
};
const FormButtons = ({ saving }) => (_jsx(Box, { mt: 3, textAlign: "center", children: _jsx(Button, { type: "submit", variant: "contained", disabled: saving, children: saving ? "Saving..." : "Save Changes" }) }));
const LoadingSpinner = ({ color = "secondary" }) => (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", children: _jsx(CircularProgress, { color: color }) }));
const BackButton = ({ onClick }) => (_jsx(Button, { variant: "contained", onClick: onClick, sx: { mb: 2 }, children: "\u2190 Back" }));
const StudentForm = ({ formData, saving, onTextChange, onSocietiesChange, onPresidentOfChange, onActiveChange, onIsPresidentChange, onSubmit }) => {
    return (_jsx(Paper, { sx: { maxWidth: "800px", mx: "auto", p: 4, borderRadius: "8px", boxShadow: 3 }, children: _jsxs("form", { onSubmit: onSubmit, children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { label: "Username", name: "username", value: formData.username, onChange: onTextChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "First Name", name: "first_name", value: formData.first_name, onChange: onTextChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Last Name", name: "last_name", value: formData.last_name, onChange: onTextChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Email", name: "email", value: formData.email, onChange: onTextChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Role", name: "role", value: formData.role, onChange: onTextChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Major", name: "major", value: formData.major, onChange: onTextChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(SocietiesField, { value: formData.societies, onChange: onSocietiesChange }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(PresidentField, { value: formData.president_of, onChange: onPresidentOfChange }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(SwitchField, { label: "Active", name: "isActive", checked: formData.isActive, onChange: onActiveChange }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(SwitchField, { label: "Is President", name: "is_president", checked: formData.is_president, onChange: onIsPresidentChange }) })] }), _jsx(FormButtons, { saving: saving })] }) }));
};
const ViewStudent = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { student_id } = useParams();
    const studentId = Number(student_id);
    const [formState, setFormState] = useState({
        student: null,
        formData: null,
        loading: true,
        saving: false
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });
    const handleTextChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            return {
                ...prev,
                formData: { ...prev.formData, [name]: value }
            };
        });
    }, []);
    const handleSocietiesChange = useCallback((societies) => {
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            return {
                ...prev,
                formData: { ...prev.formData, societies }
            };
        });
    }, []);
    const handlePresidentOfChange = useCallback((presidentOf) => {
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            return {
                ...prev,
                formData: { ...prev.formData, president_of: presidentOf }
            };
        });
    }, []);
    const handleActiveChange = useCallback((active) => {
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            return {
                ...prev,
                formData: { ...prev.formData, isActive: active }
            };
        });
    }, []);
    const handleIsPresidentChange = useCallback((isPresident) => {
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            return {
                ...prev,
                formData: { ...prev.formData, is_president: isPresident }
            };
        });
    }, []);
    const handleGoBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    const loadStudentData = useCallback(async () => {
        try {
            setFormState(prev => ({ ...prev, loading: true }));
            const data = await fetchStudentData(studentId);
            setFormState({
                student: data,
                formData: { ...data },
                loading: false,
                saving: false
            });
            setSnackbar({
                open: true,
                message: "Student updated successfully!",
                severity: "success"
            });
        }
        catch (error) {
            console.error("Error fetching student details", error);
            setFormState(prev => ({
                ...prev,
                loading: false
            }));
        }
    }, [studentId]);
    useEffect(() => {
        loadStudentData();
    }, [loadStudentData]);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formState.formData || !formState.student)
            return;
        try {
            setFormState(prev => ({ ...prev, saving: true }));
            const formDataToSend = createFormDataFromStudent(formState.formData);
            await updateStudentData(studentId, formDataToSend);
            alert("Student updated successfully!");
        }
        catch (error) {
            console.error("Error updating student", error);
            alert("There was an error updating the student.");
        }
        finally {
            setFormState(prev => ({ ...prev, saving: false }));
        }
    }, [formState.formData, formState.student, studentId]);
    if (formState.loading || !formState.formData) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsxs(Box, { minHeight: "100vh", p: 4, children: [_jsx(BackButton, { onClick: handleGoBack }), _jsx(Typography, { variant: "h2", textAlign: "center", mb: 4, children: "View Student Details" }), _jsx(StudentForm, { formData: formState.formData, saving: formState.saving, onTextChange: handleTextChange, onSocietiesChange: handleSocietiesChange, onPresidentOfChange: handlePresidentOfChange, onActiveChange: handleActiveChange, onIsPresidentChange: handleIsPresidentChange, onSubmit: handleSubmit })] }));
};
export default ViewStudent;
