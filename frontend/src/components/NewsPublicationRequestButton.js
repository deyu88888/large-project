import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { apiClient } from '../api';
const NewsPublicationRequestButton = ({ newsId, onSuccess, disabled = false }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleClickOpen = () => {
        setOpen(true);
        setError(null);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/api/news/publication-request/', {
                news_post: newsId
            });
            setLoading(false);
            setOpen(false);
            if (onSuccess) {
                onSuccess();
            }
        }
        catch (err) {
            setLoading(false);
            setError(err.response?.data?.error || 'Failed to submit publication request');
            console.error('Error submitting publication request:', err);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(SendIcon, {}), onClick: handleClickOpen, disabled: disabled, sx: {
                    backgroundColor: '#4caf50',
                    '&:hover': {
                        backgroundColor: '#388e3c',
                    }
                }, children: "Submit for Approval" }), _jsxs(Dialog, { open: open, onClose: handleClose, "aria-labelledby": "alert-dialog-title", "aria-describedby": "alert-dialog-description", children: [_jsx(DialogTitle, { id: "alert-dialog-title", children: "Submit News Post for Approval" }), _jsxs(DialogContent, { children: [_jsx(DialogContentText, { id: "alert-dialog-description", children: "Your news post will be submitted to administrators for review and approval before publishing. Once approved, it will be visible to all society members." }), error && (_jsxs(DialogContentText, { color: "error", sx: { mt: 2 }, children: ["Error: ", error] }))] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleClose, color: "primary", children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, color: "primary", autoFocus: true, disabled: loading, startIcon: loading ? _jsx(CircularProgress, { size: 20 }) : null, children: "Submit" })] })] })] }));
};
export default NewsPublicationRequestButton;
