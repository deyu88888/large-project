import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress, Paper, Grid, Snackbar, Alert, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
const createField = (formData, name, defaultValue = "") => {
    if (!formData)
        return defaultValue;
    return formData[name]?.toString() || defaultValue;
};
const fetchEventData = async (eventId) => {
    const response = await apiClient.get(apiPaths.USER.ADMINEVENTVIEW(eventId));
    return response.data;
};
const updateEventData = async (eventId, data) => {
    await apiClient.patch(`/api/admin/manage-event/${eventId}`, data);
};
const validateRequiredField = (value, fieldName) => {
    if (!value?.trim()) {
        return `${fieldName} is required`;
    }
    return undefined;
};
const validateEventForm = (formData) => {
    if (!formData)
        return {};
    const errors = {};
    errors.title = validateRequiredField(formData.title, "Title");
    errors.main_description = validateRequiredField(formData.main_description, "Description");
    errors.date = validateRequiredField(formData.date, "Date");
    errors.start_time = validateRequiredField(formData.start_time, "Start time");
    errors.location = validateRequiredField(formData.location, "Location");
    errors.hosted_by = validateRequiredField(formData.hosted_by?.toString(), "Host information");
    Object.keys(errors).forEach(key => {
        if (errors[key] === undefined) {
            delete errors[key];
        }
    });
    return errors;
};
const isFormValid = (errors) => {
    return Object.keys(errors).length === 0;
};
const FormTextField = ({ label, name, value, onChange, error = false, helperText, required = false, multiline = false, rows, type, InputLabelProps, placeholder, fullWidth = true }) => (_jsx(TextField, { fullWidth: fullWidth, label: label, name: name, value: value, onChange: onChange, error: error, helperText: helperText, required: required, multiline: multiline, rows: rows, type: type, InputLabelProps: InputLabelProps, placeholder: placeholder }));
const ActionButtons = ({ onReset, saving }) => (_jsxs(Box, { mt: 3, display: "flex", justifyContent: "center", gap: 2, children: [_jsx(Button, { type: "button", variant: "outlined", onClick: onReset, disabled: saving, children: "Reset" }), _jsx(Button, { type: "submit", variant: "contained", color: "primary", disabled: saving, children: saving ? _jsx(CircularProgress, { size: 24 }) : "Save Changes" })] }));
const LoadingSpinner = ({ color = "secondary" }) => (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", children: _jsx(CircularProgress, { color: color }) }));
const BackButton = ({ onClick }) => (_jsx(Button, { variant: "contained", onClick: onClick, sx: { mb: 2 }, startIcon: _jsx("span", { children: "\u2190" }), children: "Back" }));
const NotificationAlert = ({ notification, onClose }) => (_jsx(Snackbar, { open: notification.open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: "bottom", horizontal: "center" }, children: _jsx(Alert, { onClose: onClose, severity: notification.severity, sx: { width: "100%" }, children: notification.message }) }));
const EventForm = ({ formData, errors, saving, onChange, onSubmit, onReset }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsx(Paper, { sx: {
            maxWidth: "800px",
            mx: "auto",
            p: 4,
            borderRadius: "8px",
            boxShadow: 3,
            backgroundColor: colors.primary[400],
        }, children: _jsxs("form", { onSubmit: onSubmit, children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { label: "Event Title", name: "title", value: createField(formData, "title"), onChange: onChange, error: Boolean(errors.title), helperText: errors.title, required: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { label: "Description", name: "main_description", multiline: true, rows: 3, value: createField(formData, "main_description"), onChange: onChange, error: Boolean(errors.main_description), helperText: errors.main_description, required: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { label: "Date", name: "date", type: "date", value: createField(formData, "date"), onChange: onChange, InputLabelProps: { shrink: true }, error: Boolean(errors.date), helperText: errors.date, required: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { label: "Start Time", name: "start_time", type: "time", value: createField(formData, "start_time"), onChange: onChange, InputLabelProps: { shrink: true }, error: Boolean(errors.start_time), helperText: errors.start_time, required: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { label: "Duration", name: "duration", value: createField(formData, "duration"), onChange: onChange, error: Boolean(errors.duration), helperText: errors.duration, placeholder: "e.g., 2 hours" }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { label: "Location", name: "location", value: createField(formData, "location"), onChange: onChange, error: Boolean(errors.location), helperText: errors.location, required: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { label: "Hosted By", name: "hosted_by", value: createField(formData, "hosted_by"), onChange: onChange, error: Boolean(errors.hosted_by), helperText: errors.hosted_by, required: true }) })] }), _jsx(ActionButtons, { onReset: onReset, saving: saving })] }) }));
};
/**
 * ViewEvent component for displaying and editing event details
 */
const ViewEvent = () => {
    const navigate = useNavigate();
    const { event_id } = useParams();
    const eventId = Number(event_id);
    const [formState, setFormState] = useState({
        event: null,
        formData: null,
        loading: true,
        saving: false,
        errors: {}
    });
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "info",
    });
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormState(prev => {
            const updatedFormData = prev.formData
                ? { ...prev.formData, [name]: value }
                : null;
            const updatedErrors = { ...prev.errors };
            if (updatedErrors[name]) {
                delete updatedErrors[name];
            }
            return {
                ...prev,
                formData: updatedFormData,
                errors: updatedErrors
            };
        });
    }, []);
    const handleGoBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    const handleReset = useCallback(() => {
        setFormState(prev => ({
            ...prev,
            formData: prev.event,
            errors: {}
        }));
    }, []);
    const handleNotificationClose = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);
    const showNotificationMessage = useCallback((message, severity = "info") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    }, []);
    const loadEventData = useCallback(async () => {
        try {
            setFormState(prev => ({ ...prev, loading: true }));
            const data = await fetchEventData(eventId);
            setFormState(prev => ({
                ...prev,
                event: data,
                formData: data,
                loading: false
            }));
            showNotificationMessage("Event loaded successfully!", "success");
        }
        catch (error) {
            console.error("Error fetching event details", error);
            showNotificationMessage("Failed to load event details", "error");
            setFormState(prev => ({
                ...prev,
                loading: false
            }));
        }
    }, [eventId, showNotificationMessage]);
    useEffect(() => {
        loadEventData();
    }, [loadEventData]);
    const validateAndSetErrors = useCallback(() => {
        const newErrors = validateEventForm(formState.formData);
        setFormState(prev => ({
            ...prev,
            errors: newErrors
        }));
        return isFormValid(newErrors);
    }, [formState.formData]);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formState.formData || !formState.event)
            return;
        const isValid = validateAndSetErrors();
        if (!isValid)
            return;
        try {
            setFormState(prev => ({ ...prev, saving: true }));
            await updateEventData(eventId, formState.formData);
            showNotificationMessage("Event updated successfully!", "success");
        }
        catch (error) {
            console.error("Error updating event", error);
            showNotificationMessage("Failed to update event", "error");
        }
        finally {
            setFormState(prev => ({ ...prev, saving: false }));
        }
    }, [formState.formData, formState.event, eventId, validateAndSetErrors, showNotificationMessage]);
    if (formState.loading || !formState.formData) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsxs(Box, { minHeight: "100vh", p: 4, children: [_jsx(BackButton, { onClick: handleGoBack }), _jsx(Typography, { variant: "h2", textAlign: "center", mb: 4, children: "View Event Details" }), _jsx(EventForm, { formData: formState.formData, errors: formState.errors, saving: formState.saving, onChange: handleChange, onSubmit: handleSubmit, onReset: handleReset }), _jsx(NotificationAlert, { notification: notification, onClose: handleNotificationClose })] }));
};
export default ViewEvent;
