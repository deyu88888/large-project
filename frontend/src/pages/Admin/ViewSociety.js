import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress, Paper, Grid, Snackbar, Alert, Tooltip, } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
const fetchSocietyData = async (societyId) => {
    const response = await apiClient.get(apiPaths.USER.ADMINSOCIETYVIEW(societyId));
    return response.data;
};
const updateSocietyData = async (societyId, formData) => {
    await apiClient.patch(`/api/admin/manage-society/${societyId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
const createFormDataFromSociety = (society, icon) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", society.name || '');
    formDataToSend.append("description", society.description || '');
    formDataToSend.append("category", society.category || '');
    formDataToSend.append("tags", JSON.stringify(society.tags || []));
    if (icon instanceof File) {
        formDataToSend.append("icon", icon);
    }
    if (society.social_media_links && typeof society.social_media_links === 'object') {
        Object.entries(society.social_media_links).forEach(([platform, link]) => {
            if (link) {
                formDataToSend.append(`social_media_links[${platform}]`, link);
            }
        });
    }
    return formDataToSend;
};
const formatTagsString = (tags) => {
    if (!tags || !Array.isArray(tags))
        return '';
    return tags.join(', ');
};
const parseTagsString = (tagsString) => {
    return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
};
const validateSocietyForm = (formData) => {
    const errors = {};
    if (!formData)
        return errors;
    if (!formData.name?.trim()) {
        errors.name = "Society name is required";
    }
    if (!formData.description?.trim()) {
        errors.description = "Description is required";
    }
    if (!formData.category?.trim()) {
        errors.category = "Category is required";
    }
    return errors;
};
const isFormValid = (errors) => {
    return Object.keys(errors).length === 0;
};
const FormTextField = ({ label, name, value, onChange, error = false, helperText, required = false, disabled = false, multiline = false, rows, placeholder, inputProps, variant = "outlined", fullWidth = true }) => (_jsx(TextField, { label: label, name: name, value: value, onChange: onChange, error: error, helperText: helperText, required: required, disabled: disabled, multiline: multiline, rows: rows, placeholder: placeholder, inputProps: inputProps, variant: variant, fullWidth: fullWidth }));
const FileUpload = ({ onFileChange, currentIcon }) => {
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileChange(file);
        }
    };
    return (_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", sx: { mb: 1 }, children: "Upload Icon" }), _jsxs(Button, { variant: "contained", component: "label", sx: { borderRadius: "8px", mb: 2 }, children: ["Choose File", _jsx("input", { type: "file", accept: "image/*", hidden: true, onChange: handleFileChange })] }), currentIcon && typeof currentIcon === "string" && (_jsxs(Box, { mb: 4, children: [_jsx(Typography, { variant: "caption", color: "textSecondary", children: "Current Icon:" }), _jsx(Box, { mt: 1, children: _jsx("img", { src: currentIcon, alt: "Society Icon", style: { maxWidth: "120px", borderRadius: "8px" } }) })] })), currentIcon instanceof File && (_jsxs(Box, { mt: 2, children: [_jsx(Typography, { variant: "caption", color: "textSecondary", children: "New Icon Preview:" }), _jsx(Box, { mt: 1, children: _jsx("img", { src: URL.createObjectURL(currentIcon), alt: "New Society Icon", style: { maxWidth: "120px", borderRadius: "8px" } }) })] }))] }));
};
const ActionButtons = ({ saving }) => (_jsx(Box, { mt: 4, display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", children: _jsx(Button, { type: "submit", variant: "contained", color: "primary", disabled: saving, sx: {
            minWidth: 150,
            borderRadius: "8px",
        }, children: saving ? (_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(CircularProgress, { size: 20, color: "inherit" }), _jsx("span", { children: "Saving..." })] })) : ("Save Changes") }) }));
const LoadingSpinner = ({ message = "Loading society details..." }) => (_jsxs(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 2, children: [_jsx(CircularProgress, { color: "secondary", size: 40 }), _jsx(Typography, { variant: "h6", color: "text.secondary", children: message })] }));
const BackButton = ({ onClick }) => (_jsx(Tooltip, { title: "Go back", children: _jsx(Button, { variant: "contained", onClick: onClick, sx: {
            mb: 2,
            borderRadius: "8px",
        }, startIcon: _jsx(ArrowBackIcon, {}), children: "Back" }) }));
const NotificationAlert = ({ notification, onClose }) => (_jsx(Snackbar, { open: notification.open, autoHideDuration: 6000, onClose: onClose, anchorOrigin: { vertical: "bottom", horizontal: "center" }, children: _jsx(Alert, { onClose: onClose, severity: notification.severity, variant: "filled", sx: { width: "100%" }, elevation: 6, children: notification.message }) }));
const SocietyForm = ({ formData, errors, saving, onTextChange, onTagsChange, onFileChange, onSubmit }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const commonTextFieldProps = useMemo(() => ({
        variant: "outlined",
        fullWidth: true,
    }), []);
    return (_jsx(Paper, { elevation: 4, sx: {
            maxWidth: "800px",
            mx: "auto",
            p: { xs: 2, sm: 4 },
            borderRadius: "12px",
            boxShadow: 3,
            backgroundColor: colors.primary[400],
            transition: "all 0.3s ease",
        }, children: _jsx("form", { onSubmit: onSubmit, children: _jsxs(Grid, { container: true, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FileUpload, { onFileChange: onFileChange, currentIcon: formData.icon }) }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "Society Name", name: "name", value: formData.name || "", onChange: onTextChange, error: Boolean(errors.name), helperText: errors.name, required: true, inputProps: { maxLength: 100 } }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "Description", name: "description", multiline: true, rows: 4, value: formData.description || "", onChange: onTextChange, error: Boolean(errors.description), helperText: errors.description, required: true, inputProps: { maxLength: 1000 } }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "Category", name: "category", value: formData.category || "", onChange: onTextChange, error: Boolean(errors.category), helperText: errors.category, required: true, inputProps: { maxLength: 50 } }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "President", name: "president", value: formData.president
                                        ? `${formData.president.first_name} ${formData.president.last_name}`
                                        : "", onChange: onTextChange, disabled: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "Approved By", name: "approved_by", value: formData.approved_by || "", onChange: onTextChange, disabled: true }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "Status", name: "status", value: formData.status || "", onChange: onTextChange, disabled: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(FormTextField, { ...commonTextFieldProps, label: "Tags (comma separated)", name: "tags", value: Array.isArray(formData.tags) ? formData.tags.join(", ") : "", onChange: onTagsChange, error: Boolean(errors.tags), helperText: errors.tags || "Enter tags separated by commas", placeholder: "e.g., academic, sports, cultural", inputProps: { maxLength: 200 } }) })] }), _jsx(ActionButtons, { saving: saving })] }) }) }));
};
/**
 * ViewSociety component for viewing and editing society details
 */
const ViewSociety = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { society_id } = useParams();
    const societyId = Number(society_id);
    const [formState, setFormState] = useState({
        society: null,
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
    const showNotification = useCallback((message, severity = "info") => {
        setNotification({
            open: true,
            message,
            severity,
        });
    }, []);
    const handleNotificationClose = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);
    const handleTextChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            const updatedFormData = { ...prev.formData, [name]: value };
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
    const handleTagsChange = useCallback((e) => {
        const tagsValue = e.target.value;
        const tagsArray = parseTagsString(tagsValue);
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            const updatedFormData = { ...prev.formData, tags: tagsArray };
            const updatedErrors = { ...prev.errors };
            if (updatedErrors.tags) {
                delete updatedErrors.tags;
            }
            return {
                ...prev,
                formData: updatedFormData,
                errors: updatedErrors
            };
        });
    }, []);
    const handleFileChange = useCallback((file) => {
        setFormState(prev => {
            if (!prev.formData)
                return prev;
            return {
                ...prev,
                formData: { ...prev.formData, icon: file }
            };
        });
    }, []);
    const handleGoBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    const resetForm = useCallback(() => {
        setFormState(prev => {
            if (!prev.society)
                return prev;
            return {
                ...prev,
                formData: {
                    ...prev.society,
                    social_media_links: prev.society.social_media_links || {},
                    tags: prev.society.tags || [],
                },
                errors: {}
            };
        });
        showNotification("Form has been reset to original values", "info");
    }, [showNotification]);
    const validateAndSetErrors = useCallback(() => {
        const newErrors = validateSocietyForm(formState.formData);
        setFormState(prev => ({
            ...prev,
            errors: newErrors
        }));
        return isFormValid(newErrors);
    }, [formState.formData]);
    const loadSocietyData = useCallback(async () => {
        try {
            setFormState(prev => ({ ...prev, loading: true }));
            const data = await fetchSocietyData(societyId);
            setFormState({
                society: data,
                formData: {
                    ...data,
                    social_media_links: data.social_media_links || {},
                    tags: data.tags || [],
                },
                loading: false,
                saving: false,
                errors: {}
            });
            showNotification("Society loaded successfully!", "success");
        }
        catch (error) {
            console.error("Error fetching society details:", error);
            showNotification("Failed to load society details", "error");
            setFormState(prev => ({
                ...prev,
                loading: false
            }));
        }
    }, [societyId, showNotification]);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formState.formData || !formState.society)
            return;
        const isValid = validateAndSetErrors();
        if (!isValid) {
            showNotification("Please correct the errors in the form", "error");
            return;
        }
        try {
            setFormState(prev => ({ ...prev, saving: true }));
            const formDataToSend = createFormDataFromSociety(formState.formData, formState.formData.icon instanceof File ? formState.formData.icon : undefined);
            await updateSocietyData(societyId, formDataToSend);
            showNotification("Society updated successfully!", "success");
            await loadSocietyData();
        }
        catch (error) {
            console.error("Error updating society:", error);
            showNotification("Failed to update society", "error");
        }
        finally {
            setFormState(prev => ({ ...prev, saving: false }));
        }
    }, [formState.formData, formState.society, societyId, validateAndSetErrors, showNotification, loadSocietyData]);
    useEffect(() => {
        loadSocietyData();
    }, [loadSocietyData]);
    if (formState.loading || !formState.formData) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsxs(Box, { minHeight: "100vh", p: 4, sx: {
            backgroundColor: colors.primary[500],
        }, children: [_jsx(BackButton, { onClick: handleGoBack }), _jsx(Typography, { variant: "h2", textAlign: "center", mb: 4, color: colors.grey[100], fontWeight: "bold", children: "View Society Details" }), _jsx(SocietyForm, { formData: formState.formData, errors: formState.errors, saving: formState.saving, onTextChange: handleTextChange, onTagsChange: handleTagsChange, onFileChange: handleFileChange, onSubmit: handleSubmit }), _jsx(NotificationAlert, { notification: notification, onClose: handleNotificationClose })] }));
};
export default ViewSociety;
