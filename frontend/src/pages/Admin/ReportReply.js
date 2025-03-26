import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";
const fetchReportById = async (reportId) => {
    const response = await apiClient.get(`/api/reports/to-admin/${reportId}/`);
    return response.data;
};
const submitReportReply = async (reportId, content) => {
    await apiClient.post("/api/report-replies", {
        report: reportId,
        content: content,
    });
};
const LoadingState = () => {
    return _jsx(CircularProgress, {});
};
const ErrorState = ({ message }) => {
    return _jsx(Typography, { color: "error", children: message });
};
const ReportDetails = ({ report }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };
    return (_jsxs(Box, { sx: {
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
            p: 4,
            borderRadius: "8px",
            boxShadow: 3,
            mb: 4,
        }, children: [_jsxs(Typography, { variant: "h5", fontWeight: "bold", mb: 1, children: ["Report Type: ", report.report_type] }), _jsxs(Typography, { variant: "h5", fontWeight: "bold", mb: 1, children: ["Subject: ", report.subject] }), _jsxs(Typography, { variant: "h6", mb: 3, children: ["Details: ", report.details] }), _jsxs(Typography, { variant: "body1", mb: 2, children: ["Reported by: ", report.from_student_username, " on ", formatDate(report.requested_at)] })] }));
};
const ReplyForm = ({ content, onChange, onSubmit }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Box, { component: "form", onSubmit: onSubmit, sx: {
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
            p: 4,
            borderRadius: "8px",
            boxShadow: 3,
        }, children: [_jsx(Typography, { variant: "h5", fontWeight: "bold", mb: 2, sx: {
                    color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
                }, children: "Your Reply" }), _jsx(TextField, { value: content, onChange: (e) => onChange(e.target.value), fullWidth: true, multiline: true, rows: 5, required: true, sx: {
                    backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
                    color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
                    borderRadius: "4px",
                } }), _jsx(Button, { type: "submit", fullWidth: true, sx: {
                    mt: 3,
                    backgroundColor: colors.blueAccent[500],
                    color: "#ffffff",
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: colors.blueAccent[600] },
                }, children: "Submit Reply" })] }));
};
const PageContainer = ({ children }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsx(Box, { minHeight: "100vh", p: 4, sx: {
            backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
            color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
        }, children: children }));
};
const PageTitle = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsx(Typography, { variant: "h2", fontWeight: "bold", mb: 3, sx: {
            color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
        }, children: "Reply to Report" }));
};
const ReportReply = () => {
    const navigate = useNavigate();
    const { reportId } = useParams();
    const [reportState, setReportState] = useState({
        data: null,
        loading: true,
        error: null
    });
    const [replyState, setReplyState] = useState({
        content: "",
        error: null
    });
    const loadReportData = async () => {
        if (!reportId) {
            setReportState({
                data: null,
                loading: false,
                error: "Report ID is missing"
            });
            return;
        }
        try {
            setReportState(prev => ({ ...prev, loading: true }));
            const reportData = await fetchReportById(reportId);
            setReportState({
                data: reportData,
                loading: false,
                error: null
            });
        }
        catch (err) {
            console.error("Error fetching report:", err);
            setReportState({
                data: null,
                loading: false,
                error: "Failed to fetch report details. The report might not exist or you don't have permission to view it."
            });
        }
    };
    const handleReplyContentChange = (content) => {
        setReplyState(prev => ({ ...prev, content }));
    };
    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!reportId) {
            setReplyState(prev => ({ ...prev, error: "Report ID is missing" }));
            return;
        }
        try {
            await submitReportReply(reportId, replyState.content);
            alert("Reply submitted successfully!");
            navigate("/admin/reports");
        }
        catch (err) {
            setReplyState(prev => ({ ...prev, error: "Failed to submit reply" }));
        }
    };
    useEffect(() => {
        loadReportData();
    }, [reportId]);
    if (reportState.loading) {
        return _jsx(LoadingState, {});
    }
    if (reportState.error) {
        return _jsx(ErrorState, { message: reportState.error });
    }
    if (replyState.error) {
        return _jsx(ErrorState, { message: replyState.error });
    }
    return (_jsxs(PageContainer, { children: [_jsx(PageTitle, {}), reportState.data && (_jsxs(_Fragment, { children: [_jsx(ReportDetails, { report: reportState.data }), _jsx(ReplyForm, { content: replyState.content, onChange: handleReplyContentChange, onSubmit: handleSubmitReply })] }))] }));
};
export default ReportReply;
