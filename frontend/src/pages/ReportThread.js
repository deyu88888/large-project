import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { tokens } from "../theme/theme";
import { Box, Typography, Button, TextField, Avatar, CircularProgress, Card, CardHeader, CardContent, IconButton, List, ListItem, MenuItem, Select, FormControl, InputLabel, FormHelperText, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
const ReportThread = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { reportId } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [selectedReplyId, setSelectedReplyId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPresident, setIsPresident] = useState(false);
    const [replying, setReplying] = useState(false);
    const [emailThread, setEmailThread] = useState([]);
    useEffect(() => {
        const fetchReportThread = async () => {
            try {
                const response = await apiClient.get(`/api/admin/report-thread/${reportId}`);
                setReport(response.data);
                // Check if user is admin or president - this should be replaced with your actual auth logic
                const userResponse = await apiClient.get("/api/user/current");
                setIsAdmin(userResponse.data.is_admin);
                setIsPresident(userResponse.data.is_president);
                setLoading(false);
            }
            catch (err) {
                setError("Failed to fetch report thread");
                setLoading(false);
            }
        };
        fetchReportThread();
    }, [reportId]);
    useEffect(() => {
        if (report) {
            setEmailThread(flattenMessages());
        }
    }, [report]);
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post("/api/admin/report-replies", {
                report: reportId,
                parent_reply: selectedReplyId,
                content: replyContent,
            });
            // Refresh the thread data
            const response = await apiClient.get(`/api/admin/report-thread/${reportId}`);
            setReport(response.data);
            // Reset form
            setReplyContent("");
            setSelectedReplyId(null);
            setReplying(false);
        }
        catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            }
            else {
                setError("Failed to submit reply");
            }
        }
    };
    const getFilteredReplyOptions = () => {
        // If admin, they can reply to anything
        if (isAdmin) {
            return emailThread;
        }
        // If president, they can only reply to admin messages (not to original report or student messages)
        if (isPresident) {
            return emailThread.filter(email => email.is_admin);
        }
        // Students can only reply to admin messages (not to original report or student messages)
        return emailThread.filter(email => email.is_admin);
    };
    const flattenMessages = () => {
        if (!report)
            return [];
        // Start with the original report as the first email
        const originalEmail = {
            id: report.id,
            subject: report.subject,
            content: report.details,
            sender: report.from_student_username,
            timestamp: report.requested_at,
            is_admin: false,
            is_original: true,
            level: 0
        };
        // Get all replies and flatten them into a single array
        const getAllReplies = (replies, level = 0) => {
            let result = [];
            replies.forEach(reply => {
                result.push({
                    id: reply.id,
                    subject: `RE: ${report?.subject}`,
                    content: reply.content,
                    sender: reply.replied_by_username,
                    timestamp: reply.created_at,
                    is_admin: reply.is_admin_reply,
                    is_original: false,
                    level
                });
                if (reply.child_replies && reply.child_replies.length > 0) {
                    result = [...result, ...getAllReplies(reply.child_replies, level + 1)];
                }
            });
            return result;
        };
        // Combine original email with all replies, sorted by timestamp
        const allMessages = [originalEmail, ...getAllReplies(report.top_level_replies)];
        return allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };
    // Check if there are valid messages to reply to
    const hasValidReplyOptions = () => {
        const options = getFilteredReplyOptions();
        // For non-admins, filter out the original report
        if (!isAdmin) {
            return options.filter(msg => !msg.is_original).length > 0;
        }
        return options.length > 0;
    };
    if (loading)
        return _jsx(CircularProgress, {});
    if (error && !replying)
        return _jsx(Typography, { color: "error", children: error });
    if (!report)
        return _jsx(Typography, { children: "Report not found" });
    return (_jsxs(Box, { minHeight: "100vh", p: 4, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, children: [_jsx(IconButton, { onClick: () => navigate(-1), sx: { mr: 2 }, children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", sx: { color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d" }, children: report.subject })] }), _jsxs(Box, { sx: {
                    backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 4,
                    overflow: "hidden"
                }, children: [_jsx(Box, { sx: {
                            p: 2,
                            backgroundColor: theme.palette.mode === "dark" ? colors.blueAccent[700] : colors.blueAccent[100],
                            borderBottom: `1px solid ${theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[300]}`
                        }, children: _jsxs(Typography, { variant: "h6", children: ["Report: ", report.id, " - ", report.report_type] }) }), _jsx(List, { sx: { p: 0 }, children: emailThread.map((email, index) => (_jsx(ListItem, { sx: {
                                display: "block",
                                p: 0,
                                borderBottom: index < emailThread.length - 1
                                    ? `1px solid ${theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[300]}`
                                    : "none"
                            }, children: _jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 1, children: [_jsx(Avatar, { sx: {
                                                    bgcolor: email.is_admin
                                                        ? colors.redAccent[500]
                                                        : colors.greenAccent[500],
                                                    mr: 2
                                                }, children: email.sender[0].toUpperCase() }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", children: [email.sender, " ", email.is_admin ? "(Admin)" : ""] }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: new Date(email.timestamp).toLocaleString() })] })] }), email.is_original && (_jsxs(Typography, { variant: "subtitle2", color: "text.secondary", mb: 1, children: ["Report Type: ", report.report_type] })), _jsx(Typography, { variant: "body1", sx: {
                                            whiteSpace: "pre-wrap",
                                            pl: email.level > 0 ? 2 : 0,
                                            borderLeft: email.level > 0
                                                ? `3px solid ${theme.palette.mode === "dark" ? colors.grey[500] : colors.grey[300]}`
                                                : "none"
                                        }, children: email.content })] }) }, email.id))) })] }), replying ? (_jsxs(Card, { sx: {
                    backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#ffffff",
                    boxShadow: 3,
                    mb: 4
                }, children: [_jsx(CardHeader, { title: "Compose Reply", action: _jsx(IconButton, { onClick: () => {
                                setReplying(false);
                                setSelectedReplyId(null);
                                setError(null);
                            }, children: _jsx(ArrowBackIcon, {}) }) }), _jsxs(CardContent, { children: [error && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error })), _jsxs(Box, { component: "form", onSubmit: handleReplySubmit, children: [_jsxs(FormControl, { fullWidth: true, sx: { mb: 3 }, children: [_jsx(InputLabel, { id: "reply-to-select-label", children: "Replying to" }), _jsxs(Select, { labelId: "reply-to-select-label", value: selectedReplyId === null && isAdmin ? report.id : selectedReplyId, onChange: (e) => {
                                                    const value = e.target.value;
                                                    // If the original report is selected and we're an admin, set selectedReplyId to null
                                                    // Otherwise, use the value directly
                                                    setSelectedReplyId(value === report.id ? null : value);
                                                }, label: "Replying to", required: true, children: [isAdmin && (_jsx(MenuItem, { value: report.id, children: "Original Report (Direct Reply)" })), getFilteredReplyOptions()
                                                        .filter(email => !email.is_original) // Filter out the original message since we handled it separately above
                                                        .map(email => (_jsxs(MenuItem, { value: email.id, children: [email.sender, "'s message from ", new Date(email.timestamp).toLocaleString()] }, email.id)))] }), _jsx(FormHelperText, { children: isAdmin
                                                    ? "As an admin, you can reply directly to the report or to any message"
                                                    : "You can only reply to admin messages" })] }), _jsx(TextField, { value: replyContent, onChange: (e) => setReplyContent(e.target.value), fullWidth: true, multiline: true, rows: 5, required: true, placeholder: "Type your reply here...", sx: {
                                            backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
                                            borderRadius: "4px",
                                        } }), _jsx(Button, { type: "submit", variant: "contained", sx: {
                                            mt: 3,
                                            backgroundColor: colors.blueAccent[500],
                                            color: "#ffffff",
                                            "&:hover": { backgroundColor: colors.blueAccent[600] },
                                        }, children: "Send Reply" })] })] })] })) : (_jsxs(_Fragment, { children: [!hasValidReplyOptions() && !isAdmin && (_jsx(Alert, { severity: "info", sx: { mb: 3 }, children: "You cannot reply yet because there are no admin messages to respond to." })), _jsx(Button, { variant: "contained", startIcon: _jsx(EmailIcon, {}), onClick: () => {
                            // For non-admins, select the first admin reply if available
                            if (!isAdmin && hasValidReplyOptions()) {
                                const adminReplies = emailThread.filter(msg => msg.is_admin && !msg.is_original);
                                if (adminReplies.length > 0) {
                                    setSelectedReplyId(adminReplies[0].id);
                                }
                            }
                            else if (isAdmin) {
                                // Admins default to replying to the original report
                                setSelectedReplyId(null);
                            }
                            setReplying(true);
                            setError(null);
                        }, disabled: !isAdmin && !hasValidReplyOptions(), sx: {
                            backgroundColor: colors.blueAccent[500],
                            color: "#ffffff",
                            "&:hover": { backgroundColor: colors.blueAccent[600] },
                            "&.Mui-disabled": {
                                backgroundColor: colors.grey[500],
                                color: colors.grey[100],
                            }
                        }, children: "Compose Reply" })] }))] }));
};
export default ReportThread;
