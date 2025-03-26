import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Divider, Card, CardContent, Chip, TextField, CircularProgress, Tabs, Tab, IconButton, Collapse, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, } from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, ExpandMore as ExpandMoreIcon, ArrowBack as BackIcon, Person as PersonIcon, AccessTime as TimeIcon, } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../../theme/theme';
const fetchAllRequests = async () => {
    const response = await apiClient.get('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
    });
    return response.data;
};
const fetchNewsContent = async (newsPostId) => {
    const response = await apiClient.get(`/api/news/${newsPostId}/`);
    return response.data;
};
const updateRequestStatus = async (requestId, status, notes) => {
    await apiClient.put(`/api/news/publication-request/${requestId}/`, {
        status,
        admin_notes: notes
    });
};
const getStatusColor = (status) => {
    if (status === 'Pending')
        return 'warning';
    if (status === 'Approved')
        return 'success';
    return 'error';
};
const filterRequestsByTab = (requests, tabValue) => {
    if (tabValue === 0)
        return requests.filter(request => request.status === 'Pending');
    if (tabValue === 1)
        return requests.filter(request => request.status === 'Approved');
    if (tabValue === 2)
        return requests.filter(request => request.status === 'Rejected');
    return requests;
};
const countRequestsByStatus = (requests, status) => {
    return requests.filter(r => r.status === status).length;
};
const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
};
const PageHeader = ({ onBack }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, children: [_jsx(IconButton, { onClick: onBack, sx: { mr: 1 }, children: _jsx(BackIcon, {}) }), _jsx(Typography, { variant: "h4", children: "News Publication Approval" })] }));
};
const StatusTabs = ({ value, onChange, pendingCount, approvedCount, rejectedCount }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Tabs, { value: value, onChange: onChange, sx: {
            mb: 3,
            '& .MuiTab-root': {
                color: colors.grey[300],
                '&.Mui-selected': {
                    color: colors.blueAccent[400],
                    fontWeight: 'bold',
                },
            },
            '& .MuiTabs-indicator': {
                backgroundColor: colors.blueAccent[400],
            },
        }, children: [_jsx(Tab, { label: `Pending (${pendingCount})` }), _jsx(Tab, { label: `Approved (${approvedCount})` }), _jsx(Tab, { label: `Rejected (${rejectedCount})` })] }));
};
const LoadingIndicator = () => {
    return (_jsx(Box, { display: "flex", justifyContent: "center", p: 4, children: _jsx(CircularProgress, {}) }));
};
const EmptyState = ({ tabValue }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const getStatusText = (tabValue) => {
        if (tabValue === 0)
            return 'pending';
        if (tabValue === 1)
            return 'approved';
        return 'rejected';
    };
    return (_jsx(Paper, { sx: {
            p: 4,
            textAlign: 'center',
            backgroundColor: colors.primary[400],
        }, children: _jsxs(Typography, { variant: "h6", children: ["No ", getStatusText(tabValue), " publication requests"] }) }));
};
const RequestHeader = ({ request, isExpanded }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: request.news_post_title || 'Untitled News Post' }), _jsx(IconButton, { size: "small", sx: {
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s'
                                }, children: _jsx(ExpandMoreIcon, {}) })] }), _jsxs(Typography, { variant: "body2", color: colors.grey[300], gutterBottom: true, children: ["Society: ", request.society_name] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(PersonIcon, { fontSize: "small", sx: { color: colors.grey[300] } }), _jsxs(Typography, { variant: "body2", color: colors.grey[300], children: ["Requested by: ", request.requester_name] })] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mt: 1, children: [_jsx(TimeIcon, { fontSize: "small", sx: { color: colors.grey[300] } }), _jsx(Typography, { variant: "body2", color: colors.grey[300], children: formatDateTime(request.requested_at) })] })] }), _jsx(Chip, { label: request.status, color: getStatusColor(request.status), sx: {
                    fontWeight: 'bold'
                } })] }));
};
const ContentPreview = ({ content }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", mb: 2, children: "Content Preview:" }), _jsx(Box, { sx: {
                    p: 2,
                    border: `1px solid ${colors.grey[700]}`,
                    borderRadius: 1,
                    maxHeight: '300px',
                    overflow: 'auto',
                    backgroundColor: colors.primary[500],
                }, children: _jsx("div", { dangerouslySetInnerHTML: { __html: content } }) })] }));
};
const ActionButtons = ({ onApprove, onReject }) => {
    return (_jsxs(Box, { display: "flex", gap: 2, mt: 3, children: [_jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(ApproveIcon, {}), onClick: onApprove, children: "Approve" }), _jsx(Button, { variant: "contained", color: "error", startIcon: _jsx(RejectIcon, {}), onClick: onReject, children: "Reject" })] }));
};
const StatusMessage = ({ status, notes }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const backgroundColor = status === 'Approved'
        ? colors.greenAccent[900]
        : colors.redAccent[900];
    return (_jsxs(Box, { mt: 3, p: 2, bgcolor: backgroundColor, borderRadius: 1, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: "bold", children: ["This request has been ", status.toLowerCase(), "."] }), notes && (_jsxs(Box, { mt: 1, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: "bold", children: "Admin notes:" }), _jsx(Typography, { variant: "body2", children: notes })] }))] }));
};
const RequestCard = ({ request, isExpanded, newsContent, isLoadingContent, onToggleExpand, onApprove, onReject }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Card, { sx: {
            mb: 2,
            backgroundColor: colors.primary[400],
            transition: 'all 0.3s ease',
        }, children: [_jsx(CardContent, { sx: {
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: colors.primary[500],
                    }
                }, onClick: onToggleExpand, children: _jsx(RequestHeader, { request: request, isExpanded: isExpanded }) }), _jsxs(Collapse, { in: isExpanded, children: [_jsx(Divider, {}), _jsx(CardContent, { children: isLoadingContent ? (_jsx(Box, { display: "flex", justifyContent: "center", p: 2, children: _jsx(CircularProgress, { size: 30 }) })) : newsContent ? (_jsxs(Box, { children: [_jsx(ContentPreview, { content: newsContent.content }), request.status === 'Pending' && (_jsx(ActionButtons, { onApprove: onApprove, onReject: onReject })), request.status !== 'Pending' && (_jsx(StatusMessage, { status: request.status, notes: request.admin_notes }))] })) : (_jsx(Typography, { children: "Error loading content." })) })] })] }));
};
const ActionDialog = ({ dialogState, onClose, onProcess, onNotesChange }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { open, action, notes, processing } = dialogState;
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, PaperProps: {
            sx: {
                backgroundColor: colors.primary[400],
            }
        }, children: [_jsxs(DialogTitle, { children: [action === 'approve' ? 'Approve' : 'Reject', " Publication Request"] }), _jsxs(DialogContent, { children: [_jsx(DialogContentText, { gutterBottom: true, children: action === 'approve'
                            ? 'This will publish the news post for all society members to view.'
                            : 'This will mark the post as "Rejected" and return it to the author for further editing. The author will be able to see your feedback and resubmit after making changes.' }), _jsx(TextField, { label: "Admin Notes (optional)", multiline: true, rows: 4, value: notes, onChange: (e) => onNotesChange(e.target.value), fullWidth: true, placeholder: action === 'approve'
                            ? 'Any comments about the approved content...'
                            : 'Reason for rejection or suggestions for improvement...', sx: {
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: colors.grey[500],
                                },
                                '&:hover fieldset': {
                                    borderColor: colors.grey[400],
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: colors.blueAccent[400],
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: colors.grey[300],
                            },
                            '& .MuiInputBase-input': {
                                color: colors.grey[100],
                            }
                        } })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, sx: { color: colors.grey[300] }, children: "Cancel" }), _jsx(Button, { onClick: onProcess, variant: "contained", color: action === 'approve' ? 'success' : 'error', disabled: processing, startIcon: processing ? _jsx(CircularProgress, { size: 20 }) : null, children: action === 'approve' ? 'Approve' : 'Reject' })] })] }));
};
const NewsApprovalDashboard = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [requestsState, setRequestsState] = useState({
        items: [],
        loading: true,
        tabValue: 0,
        expandedRequestId: null
    });
    const [contentsState, setContentsState] = useState({
        items: {},
        loading: {}
    });
    const [dialogState, setDialogState] = useState({
        open: false,
        action: null,
        notes: '',
        processing: false,
        currentRequest: null
    });
    useEffect(() => {
        loadAllRequests();
    }, []);
    const setRequests = (items) => {
        setRequestsState(prev => ({ ...prev, items }));
    };
    const setRequestsLoading = (loading) => {
        setRequestsState(prev => ({ ...prev, loading }));
    };
    const setTabValue = (tabValue) => {
        setRequestsState(prev => ({ ...prev, tabValue }));
    };
    const setExpandedRequestId = (expandedRequestId) => {
        setRequestsState(prev => ({ ...prev, expandedRequestId }));
    };
    const setNewsContent = (newsPostId, content) => {
        setContentsState(prev => ({
            ...prev,
            items: { ...prev.items, [newsPostId]: content }
        }));
    };
    const setContentLoading = (newsPostId, loading) => {
        setContentsState(prev => ({
            ...prev,
            loading: { ...prev.loading, [newsPostId]: loading }
        }));
    };
    const loadAllRequests = async () => {
        setRequestsLoading(true);
        try {
            const data = await fetchAllRequests();
            setRequests(data);
        }
        catch (error) {
            console.error('Error fetching publication requests:', error);
        }
        finally {
            setRequestsLoading(false);
        }
    };
    const loadNewsContent = async (newsPostId) => {
        if (contentsState.items[newsPostId])
            return;
        setContentLoading(newsPostId, true);
        try {
            const content = await fetchNewsContent(newsPostId);
            setNewsContent(newsPostId, content);
        }
        catch (error) {
            console.error('Error fetching news content:', error);
        }
        finally {
            setContentLoading(newsPostId, false);
        }
    };
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setExpandedRequestId(null);
    };
    const handleToggleRequestExpansion = (request) => {
        if (requestsState.expandedRequestId === request.id) {
            setExpandedRequestId(null);
            return;
        }
        setExpandedRequestId(request.id);
        loadNewsContent(request.news_post);
    };
    const handleOpenDialog = (request, action) => {
        setDialogState({
            open: true,
            action,
            notes: '',
            processing: false,
            currentRequest: request
        });
    };
    const handleCloseDialog = () => {
        setDialogState({
            open: false,
            action: null,
            notes: '',
            processing: false,
            currentRequest: null
        });
    };
    const handleNotesChange = (notes) => {
        setDialogState(prev => ({ ...prev, notes }));
    };
    const optimisticallyUpdateRequest = (request, newStatus) => {
        const updatedRequest = { ...request, status: newStatus };
        setRequests(requestsState.items.map(req => req.id === request.id ? updatedRequest : req));
        return updatedRequest;
    };
    const handleProcessRequest = async () => {
        const { currentRequest, action, notes } = dialogState;
        if (!currentRequest || !action)
            return;
        setDialogState(prev => ({ ...prev, processing: true }));
        try {
            const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
            const updatedRequest = optimisticallyUpdateRequest(currentRequest, newStatus);
            setTabValue(action === 'approve' ? 1 : 2);
            handleCloseDialog();
            setExpandedRequestId(updatedRequest.id);
            await updateRequestStatus(currentRequest.id, newStatus, notes);
            await refreshAllData(currentRequest.news_post);
        }
        catch (error) {
            console.error('Error processing request:', error);
            loadAllRequests();
        }
        finally {
            setDialogState(prev => ({ ...prev, processing: false }));
        }
    };
    const refreshAllData = async (newsPostId) => {
        const updatedRequests = await fetchAllRequests();
        setRequests(updatedRequests);
        if (contentsState.items[newsPostId]) {
            const updatedContent = await fetchNewsContent(newsPostId);
            setNewsContent(newsPostId, updatedContent);
        }
    };
    const filteredRequests = filterRequestsByTab(requestsState.items, requestsState.tabValue);
    return (_jsxs(Box, { p: 3, children: [_jsx(PageHeader, { onBack: () => navigate(-1) }), _jsx(StatusTabs, { value: requestsState.tabValue, onChange: handleTabChange, pendingCount: countRequestsByStatus(requestsState.items, 'Pending'), approvedCount: countRequestsByStatus(requestsState.items, 'Approved'), rejectedCount: countRequestsByStatus(requestsState.items, 'Rejected') }), requestsState.loading ? (_jsx(LoadingIndicator, {})) : filteredRequests.length === 0 ? (_jsx(EmptyState, { tabValue: requestsState.tabValue })) : (_jsx(Box, { children: filteredRequests.map((request) => (_jsx(RequestCard, { request: request, isExpanded: requestsState.expandedRequestId === request.id, newsContent: contentsState.items[request.news_post], isLoadingContent: !!contentsState.loading[request.news_post], onToggleExpand: () => handleToggleRequestExpansion(request), onApprove: () => handleOpenDialog(request, 'approve'), onReject: () => handleOpenDialog(request, 'reject') }, request.id))) })), _jsx(ActionDialog, { dialogState: dialogState, onClose: handleCloseDialog, onProcess: handleProcessRequest, onNotesChange: handleNotesChange })] }));
};
export default NewsApprovalDashboard;
