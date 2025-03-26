import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress, Paper, Grid, FormControlLabel, Switch, Snackbar, Alert, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api.ts";
import { useAuthStore } from "../../stores/auth-store.ts";
import { tokens } from "../../theme/theme.ts";
const fetchAdminData = async (adminId) => {
    const response = await apiClient.get(`${apiPaths.USER.ADMINVIEW(adminId)}`);
    return response.data;
};
const updateAdminData = async (adminId, data) => {
    const response = await apiClient.patch(`/api/admin/manage-admin/${adminId}`, data);
    return response.data.data || response.data;
};
const LoadingSpinner = ({ color = "secondary" }) => (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", children: _jsx(CircularProgress, { color: color }) }));
const BackButton = ({ onClick }) => (_jsx(Button, { variant: "contained", onClick: onClick, sx: { mb: 2 }, children: "\u2190 Back" }));
const InfoAlert = ({ message }) => (_jsx(Alert, { severity: "info", sx: { maxWidth: "800px", mx: "auto", mb: 2 }, children: message }));
const FormTextField = ({ label, name, value, onChange, disabled, fullWidth = true }) => (_jsx(TextField, { fullWidth: fullWidth, label: label, name: name, value: value, onChange: onChange, disabled: disabled, inputProps: {
        readOnly: disabled
    } }));
const SwitchField = ({ name, label, checked, onChange, disabled }) => (_jsx(FormControlLabel, { control: _jsx(Switch, { checked: checked, onChange: onChange, name: name, disabled: disabled }), label: label }));
const FormSubmitButton = ({ saving, canEdit }) => {
    if (!canEdit)
        return null;
    return (_jsx(Box, { mt: 3, textAlign: "center", children: _jsx(Button, { type: "submit", variant: "contained", disabled: saving, children: saving ? "Saving..." : "Save Changes" }) }));
};
const SnackbarAlert = ({ state, onClose }) => (_jsx(Snackbar, { open: state.open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: 'bottom', horizontal: 'center' }, children: _jsx(Alert, { onClose: onClose, severity: state.severity, sx: { width: '100%' }, children: state.message }) }));
const AdminDetailForm = ({ formData, canEdit, saving, onChange, onSwitchChange, onSubmit }) => (_jsx(Paper, { sx: { maxWidth: "800px", mx: "auto", p: 4, borderRadius: "8px", boxShadow: 3 }, children: _jsxs("form", { onSubmit: onSubmit, children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { label: "Username", name: "username", value: formData.username, onChange: onChange, disabled: !canEdit }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "First Name", name: "first_name", value: formData.first_name, onChange: onChange, disabled: !canEdit }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Last Name", name: "last_name", value: formData.last_name, onChange: onChange, disabled: !canEdit }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Email", name: "email", value: formData.email, onChange: onChange, disabled: !canEdit }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(FormTextField, { label: "Role", name: "role", value: formData.role, onChange: onChange, disabled: true }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(SwitchField, { name: "is_active", label: "Active", checked: formData.is_active, onChange: onSwitchChange("is_active"), disabled: !canEdit }) }), _jsx(Grid, { item: true, xs: 6, children: _jsx(SwitchField, { name: "is_super_admin", label: "Super Admin", checked: formData.is_super_admin, onChange: onSwitchChange("is_super_admin"), disabled: !canEdit }) })] }), _jsx(FormSubmitButton, { saving: saving, canEdit: canEdit })] }) }));
const ViewAdmin = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { admin_id } = useParams();
    const adminId = Number(admin_id);
    const [admin, setAdmin] = useState(null);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });
    const isCurrentUserSuperAdmin = user?.is_super_admin || false;
    const canEdit = isCurrentUserSuperAdmin;
    const handleChange = useCallback((e) => {
        if (!canEdit)
            return;
        const { name, value } = e.target;
        setFormData((prevFormData) => prevFormData ? { ...prevFormData, [name]: value } : null);
    }, [canEdit]);
    const handleSwitchChange = useCallback((name) => (e) => {
        if (!canEdit)
            return;
        setFormData((prev) => prev ? { ...prev, [name]: e.target.checked } : null);
    }, [canEdit]);
    const handleGoBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    const handleCloseSnackbar = useCallback(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    }, []);
    const showSnackbar = useCallback((message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    }, []);
    const loadAdminData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAdminData(adminId);
            console.log('Fetched admin data:', data);
            setAdmin(data);
            setFormData(data);
        }
        catch (error) {
            console.error("Error fetching admin details", error);
            showSnackbar("Failed to load admin details", "error");
        }
        finally {
            setLoading(false);
        }
    }, [adminId, showSnackbar]);
    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData || !admin || !canEdit)
            return;
        try {
            setSaving(true);
            const dataToSend = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                username: formData.username,
                email: formData.email,
                is_active: formData.is_active,
                role: formData.role,
                is_super_admin: formData.is_super_admin
            };
            console.log("Sending data to backend:", dataToSend);
            const updatedAdmin = await updateAdminData(adminId, dataToSend);
            setAdmin(updatedAdmin);
            setFormData(updatedAdmin);
            showSnackbar("Admin updated successfully!", "success");
        }
        catch (error) {
            console.error("Error updating admin", error);
            showSnackbar("Failed to update admin details", "error");
        }
        finally {
            setSaving(false);
        }
    }, [formData, admin, canEdit, adminId, showSnackbar]);
    if (loading || !formData) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsxs(Box, { minHeight: "100vh", p: 4, children: [_jsx(BackButton, { onClick: handleGoBack }), _jsx(Typography, { variant: "h2", textAlign: "center", mb: 4, children: "Admin Details" }), !canEdit && (_jsx(InfoAlert, { message: "View mode: Only Super Admin users can edit admin details." })), _jsx(AdminDetailForm, { formData: formData, canEdit: canEdit, saving: saving, onChange: handleChange, onSwitchChange: handleSwitchChange, onSubmit: handleSubmit }), _jsx(SnackbarAlert, { state: snackbar, onClose: handleCloseSnackbar })] }));
};
export default ViewAdmin;
