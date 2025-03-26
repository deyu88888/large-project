import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, IconButton, InputAdornment, TextField, useTheme, Paper, Typography, Alert, Snackbar } from "@mui/material";
import { Formik, Form } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import CircularLoader from "../../components/loading/circular-loader";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { tokens } from "../../theme/theme";
const validationSchema = yup.object().shape({
    first_name: yup.string()
        .trim()
        .max(50, "First name must be at most 50 characters")
        .required("First name is required"),
    last_name: yup.string()
        .trim()
        .max(50, "Last name must be at most 50 characters")
        .required("Last name is required"),
    username: yup.string()
        .trim()
        .min(6, "Username must be at least 6 characters")
        .max(30, "Username must be at most 30 characters")
        .matches(/^[a-zA-Z0-9_.-]+$/, "Username must only contain letters, numbers, underscores, hyphens, and dots")
        .required("Username is required"),
    email: yup.string()
        .trim()
        .email("Invalid email address")
        .test('is-kcl-email', 'Must be a KCL email', (value) => value ? value.endsWith('@kcl.ac.uk') : false)
        .required("Email is required"),
    password: yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
    confirmPassword: yup.string()
        .oneOf([yup.ref("password")], "Passwords do not match")
        .required("Please confirm the password"),
});
const initialValues = {
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
};
const ErrorAlert = ({ error, onClose }) => {
    if (!error)
        return null;
    return (_jsx(Alert, { severity: "error", sx: { mb: 3 }, onClose: onClose, children: error }));
};
const SnackbarAlert = ({ open, message, severity, onClose }) => {
    return (_jsx(Snackbar, { open: open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: _jsx(Alert, { onClose: onClose, severity: severity, variant: "filled", sx: { width: '100%' }, children: message }) }));
};
const FormButtons = ({ isValid, dirty, loading }) => {
    return (_jsxs(Box, { display: "flex", justifyContent: "space-between", mt: "20px", children: [_jsx(Button, { type: "reset", color: "inherit", variant: "outlined", disabled: loading, "aria-label": "Reset form", children: "Reset" }), _jsx(Button, { type: "submit", color: "secondary", variant: "contained", disabled: loading || !(isValid && dirty), endIcon: loading ? _jsx(CircularLoader, { size: 20 }) : null, "aria-label": "Create new admin", children: loading ? "Creating..." : "Create New Admin" })] }));
};
const TextFieldComponent = ({ label, name, value, handleBlur, handleChange, error, helperText, gridSpan, disabled }) => {
    return (_jsx(TextField, { fullWidth: true, variant: "filled", type: "text", label: label, onBlur: handleBlur, onChange: handleChange, value: value, name: name, error: error, helperText: helperText, sx: { gridColumn: gridSpan }, disabled: disabled, InputProps: {
            "aria-label": label,
        } }));
};
const PasswordField = ({ name, label, value, showPassword, handleBlur, handleChange, handleTogglePasswordVisibility, error, helperText, disabled }) => {
    return (_jsx(TextField, { fullWidth: true, variant: "filled", type: showPassword ? "text" : "password", label: label, onBlur: handleBlur, onChange: handleChange, value: value, name: name, error: error, helperText: helperText, sx: { gridColumn: "span 4" }, disabled: disabled, InputProps: {
            endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: handleTogglePasswordVisibility, edge: "end", "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? _jsx(VisibilityOff, {}) : _jsx(Visibility, {}) }) })),
            "aria-label": label,
        } }));
};
const FormFields = ({ formikProps, isNonMobile, loading, showPassword, onTogglePasswordVisibility }) => {
    const { values, errors, touched, handleBlur, handleChange } = formikProps;
    return (_jsxs(Box, { display: "grid", gap: "30px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", sx: {
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
        }, children: [_jsx(TextFieldComponent, { label: "First Name", name: "first_name", value: values.first_name, handleBlur: handleBlur, handleChange: handleChange, error: Boolean(touched.first_name && errors.first_name), helperText: touched.first_name && errors.first_name, gridSpan: "span 2", disabled: loading }), _jsx(TextFieldComponent, { label: "Last Name", name: "last_name", value: values.last_name, handleBlur: handleBlur, handleChange: handleChange, error: Boolean(touched.last_name && errors.last_name), helperText: touched.last_name && errors.last_name, gridSpan: "span 2", disabled: loading }), _jsx(TextFieldComponent, { label: "Username", name: "username", value: values.username, handleBlur: handleBlur, handleChange: handleChange, error: Boolean(touched.username && errors.username), helperText: touched.username && errors.username, gridSpan: "span 4", disabled: loading }), _jsx(TextFieldComponent, { label: "Email", name: "email", value: values.email, handleBlur: handleBlur, handleChange: handleChange, error: Boolean(touched.email && errors.email), helperText: touched.email && errors.email, gridSpan: "span 4", disabled: loading }), _jsx(PasswordField, { name: "password", label: "Password", value: values.password, showPassword: showPassword, handleBlur: handleBlur, handleChange: handleChange, handleTogglePasswordVisibility: onTogglePasswordVisibility, error: Boolean(touched.password && errors.password), helperText: touched.password && errors.password, disabled: loading }), _jsx(PasswordField, { name: "confirmPassword", label: "Confirm Password", value: values.confirmPassword, showPassword: showPassword, handleBlur: handleBlur, handleChange: handleChange, handleTogglePasswordVisibility: onTogglePasswordVisibility, error: Boolean(touched.confirmPassword && errors.confirmPassword), helperText: touched.confirmPassword && errors.confirmPassword, disabled: loading })] }));
};
const UnauthorizedView = ({ title, subtitle }) => {
    return (_jsxs(Box, { m: "20px", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", children: [_jsx(Header, { title: title, subtitle: subtitle }), _jsx(Alert, { severity: "error", sx: { mt: 2, width: "100%", maxWidth: 500 }, children: "This feature is restricted to super administrators only." })] }));
};
const AdminInfoItem = ({ label, value }) => {
    return (_jsxs(Typography, { variant: "body1", children: [_jsxs("strong", { children: [label, ":"] }), " ", value] }));
};
const SuccessView = ({ createdAdmin, onCreateAnother, colors, theme }) => {
    const firstName = createdAdmin.first_name || createdAdmin.firstName;
    const lastName = createdAdmin.last_name || createdAdmin.lastName;
    const paperStyle = {
        width: "100%",
        maxWidth: "500px",
        p: 3,
        mb: 5,
        borderRadius: 1,
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
    };
    return (_jsxs(Box, { m: "20px", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", children: [_jsx(Header, { title: "Create Admin", subtitle: "New Admin Created Successfully!" }), _jsx(Paper, { elevation: 3, sx: paperStyle, children: _jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(AdminInfoItem, { label: "First Name", value: firstName }), _jsx(AdminInfoItem, { label: "Last Name", value: lastName }), _jsx(AdminInfoItem, { label: "Username", value: createdAdmin.username }), _jsx(AdminInfoItem, { label: "Email", value: createdAdmin.email })] }) }), _jsx(Button, { variant: "contained", color: "secondary", onClick: onCreateAnother, "aria-label": "Create another admin", children: "Create Another Admin" })] }));
};
const FormikWrapper = ({ onSubmit, isNonMobile, loading, showPassword, onTogglePasswordVisibility }) => {
    return (_jsx(Formik, { onSubmit: onSubmit, initialValues: initialValues, validationSchema: validationSchema, validateOnBlur: true, children: (formikProps) => (_jsx(FormContent, { formikProps: formikProps, isNonMobile: isNonMobile, loading: loading, showPassword: showPassword, onTogglePasswordVisibility: onTogglePasswordVisibility })) }));
};
const FormContent = ({ formikProps, isNonMobile, loading, showPassword, onTogglePasswordVisibility }) => {
    const { handleSubmit, isValid, dirty } = formikProps;
    return (_jsxs(Form, { onSubmit: handleSubmit, children: [_jsx(FormFields, { formikProps: formikProps, isNonMobile: isNonMobile, loading: loading, showPassword: showPassword, onTogglePasswordVisibility: onTogglePasswordVisibility }), _jsx(FormButtons, { isValid: isValid, dirty: dirty, loading: loading })] }));
};
const FormView = ({ formState, onSubmit, onTogglePasswordVisibility, onErrorClose, onSnackbarClose, isNonMobile, colors, theme, drawer }) => {
    const { loading, error, snackbar } = formState;
    const containerStyle = {
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        p: "20px"
    };
    const paperStyle = {
        p: { xs: 2, sm: 3 },
        mb: 3,
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff"
    };
    return (_jsxs(Box, { sx: containerStyle, children: [_jsx(Header, { title: "Create Admin", subtitle: "Create a New Admin Profile" }), _jsx(ErrorAlert, { error: error, onClose: onErrorClose }), _jsx(Paper, { elevation: 3, sx: paperStyle, children: _jsx(FormikWrapper, { onSubmit: onSubmit, isNonMobile: isNonMobile, loading: loading, showPassword: formState.showPassword, onTogglePasswordVisibility: onTogglePasswordVisibility }) }), _jsx(SnackbarAlert, { open: snackbar.open, message: snackbar.message, severity: snackbar.severity, onClose: onSnackbarClose })] }));
};
const createAdminRequest = async (values) => {
    const response = await apiClient.post(apiPaths.USER.ADMIN, values);
    return response.data.admin;
};
const CreateAdmin = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuthStore();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const { drawer } = useSettingsStore();
    const [formState, setFormState] = useState({
        loading: false,
        isSuccess: false,
        createdAdmin: null,
        showPassword: false,
        error: null,
        snackbar: {
            open: false,
            message: "",
            severity: "error"
        }
    });
    const handleTogglePasswordVisibility = () => {
        setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }));
    };
    const handleCreateAnother = () => {
        setFormState(prev => ({
            ...prev,
            isSuccess: false,
            createdAdmin: null
        }));
    };
    const handleErrorClose = () => {
        setFormState(prev => ({ ...prev, error: null }));
    };
    const handleSnackbarClose = () => {
        setFormState(prev => ({
            ...prev,
            snackbar: { ...prev.snackbar, open: false }
        }));
    };
    const setSnackbarMessage = (message, severity) => {
        setFormState(prev => ({
            ...prev,
            snackbar: {
                open: true,
                message,
                severity
            }
        }));
    };
    const showPermissionError = () => {
        setSnackbarMessage("You do not have permission to create admins", "error");
    };
    const setFormLoading = (isLoading) => {
        setFormState(prev => ({ ...prev, loading: isLoading }));
    };
    const clearFormError = () => {
        setFormState(prev => ({ ...prev, error: null }));
    };
    const setFormSuccess = (adminData) => {
        setFormState(prev => ({
            ...prev,
            createdAdmin: adminData,
            isSuccess: true,
            loading: false
        }));
    };
    const setFormError = (errorMessage) => {
        setFormState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false
        }));
    };
    const handleFormSubmit = async (values, { resetForm }) => {
        if (!user?.is_super_admin) {
            showPermissionError();
            return;
        }
        setFormLoading(true);
        clearFormError();
        try {
            const adminData = await createAdminRequest(values);
            setFormSuccess(adminData);
            resetForm();
            setSnackbarMessage("Admin created successfully!", "success");
        }
        catch (error) {
            const errorMessage = error?.response?.data?.message || "An error occurred while creating the admin";
            setFormError(errorMessage);
            setSnackbarMessage(errorMessage, "error");
            console.error("Error creating admin:", error);
        }
    };
    const shouldShowUnauthorizedView = !user?.is_super_admin;
    const shouldShowSuccessView = formState.isSuccess && formState.createdAdmin !== null;
    const shouldShowFormView = !formState.isSuccess && user?.is_super_admin;
    if (shouldShowUnauthorizedView) {
        return (_jsx(UnauthorizedView, { title: "Create Admin", subtitle: "You are not authorized to create an admin" }));
    }
    if (shouldShowSuccessView && formState.createdAdmin) {
        return (_jsx(SuccessView, { createdAdmin: formState.createdAdmin, onCreateAnother: handleCreateAnother, colors: colors, theme: theme }));
    }
    return (_jsx(FormView, { formState: formState, onSubmit: handleFormSubmit, onTogglePasswordVisibility: handleTogglePasswordVisibility, onErrorClose: handleErrorClose, onSnackbarClose: handleSnackbarClose, isNonMobile: isNonMobile, colors: colors, theme: theme, drawer: drawer }));
};
export default CreateAdmin;
