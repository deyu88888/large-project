import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Select, MenuItem, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme.ts";
// Component for page header
const PageHeader = ({ textColor }) => (_jsx(Typography, { variant: "h2", fontWeight: "bold", mb: 3, sx: { color: textColor }, children: "Report to Admin" }));
// Component for field labels
const FieldLabel = ({ label, textColor, marginTop = 0 }) => (_jsx(Typography, { variant: "h6", fontWeight: "bold", mt: marginTop, mb: 1, sx: { color: textColor }, children: label }));
// Component for the report type dropdown
const ReportTypeSelect = ({ value, onChange, selectBackgroundColor, reportTypes }) => (_jsx(Select, { name: "report_type", value: value, onChange: onChange, fullWidth: true, "aria-label": "Type of Report", sx: {
        backgroundColor: selectBackgroundColor,
        color: "#000",
        borderRadius: "4px",
    }, children: reportTypes.map(type => (_jsx(MenuItem, { value: type.value, children: type.label }, type.value))) }));
// Component for text input fields
const TextInputField = ({ name, value, onChange, label, multiline = false, rows = 1, backgroundColor, textColor }) => (_jsx(TextField, { name: name, value: value, onChange: onChange, fullWidth: true, required: true, label: label, "aria-label": label, multiline: multiline, rows: rows, sx: {
        backgroundColor,
        color: textColor,
        borderRadius: "4px",
    } }));
// Component for the submit button
const SubmitButton = ({ buttonColor, hoverColor }) => (_jsx(Button, { type: "submit", fullWidth: true, sx: {
        mt: 3,
        backgroundColor: buttonColor,
        color: "#ffffff",
        fontWeight: "bold",
        "&:hover": { backgroundColor: hoverColor },
    }, children: "Submit Report" }));
// Main component
const ReportToAdmin = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        report_type: "Misconduct",
        subject: "",
        details: "",
    });
    // Handle form field changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    // Submit form data to API
    const submitReport = async (formData) => {
        await apiClient.post("/api/reports/to-admin/", formData);
        alert("Report submitted successfully!");
        navigate(-1);
    };
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitReport(formData);
        }
        catch (error) {
            console.error("Error submitting report:", error);
        }
    };
    // Theme-related variables
    const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
    const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
    const formBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
    const inputBackgroundColor = theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff";
    const selectBackgroundColor = theme.palette.mode === "dark" ? colors.grey[300] : "#ffffff";
    // Report type options
    const reportTypes = [
        { value: "Misconduct", label: "Misconduct" },
        { value: "System Issue", label: "System Issue" },
        { value: "Society Issue", label: "Society Issue" },
        { value: "Event Issue", label: "Event Issue" },
        { value: "Other", label: "Other" }
    ];
    return (_jsxs(Box, { minHeight: "100vh", p: 4, display: "flex", flexDirection: "column", alignItems: "center", sx: {
            backgroundColor,
            color: textColor,
        }, children: [_jsx(PageHeader, { textColor: textColor }), _jsxs(Box, { component: "form", onSubmit: handleSubmit, sx: {
                    maxWidth: "600px",
                    width: "100%",
                    backgroundColor: formBackgroundColor,
                    p: 4,
                    borderRadius: "8px",
                    boxShadow: 3,
                }, children: [_jsx(FieldLabel, { label: "Type of Report", textColor: textColor }), _jsx(ReportTypeSelect, { value: formData.report_type, onChange: handleChange, selectBackgroundColor: selectBackgroundColor, reportTypes: reportTypes }), _jsx(FieldLabel, { label: "Subject", textColor: textColor, marginTop: 3 }), _jsx(TextInputField, { name: "subject", value: formData.subject, onChange: handleChange, label: "Subject", backgroundColor: inputBackgroundColor, textColor: textColor }), _jsx(FieldLabel, { label: "Report Details", textColor: textColor, marginTop: 3 }), _jsx(TextInputField, { name: "details", value: formData.details, onChange: handleChange, label: "Report Details", multiline: true, rows: 5, backgroundColor: inputBackgroundColor, textColor: textColor }), _jsx(SubmitButton, { buttonColor: colors.redAccent[500], hoverColor: colors.redAccent[600] })] })] }));
};
export default ReportToAdmin;
