import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { apiClient } from '../api';

interface NewsPublicationRequestButtonProps {
  newsId: number;
  onSuccess?: () => void;
  disabled?: boolean;
  skipConfirmation?: boolean; // New prop to skip confirmation dialog
}

const NewsPublicationRequestButton: React.FC<NewsPublicationRequestButtonProps> = ({
  newsId,
  onSuccess,
  disabled = false,
  skipConfirmation = false
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClickOpen = () => {
    if (skipConfirmation) {
      // Skip dialog and submit directly
      handleSubmit();
    } else {
      setOpen(true);
      setError(null);
    }
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
    } catch (err: any) {
      setLoading(false);
      if (skipConfirmation) {
        // If we're in skipConfirmation mode, still call onSuccess even on error
        // This ensures the UI updates in view mode
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(err.response?.data?.error || 'Failed to submit publication request');
      }
      console.error('Error submitting publication request:', err);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? null : <SendIcon />}
        onClick={handleClickOpen}
        disabled={disabled || loading}
        sx={{
          backgroundColor: '#4caf50',
          '&:hover': {
            backgroundColor: '#388e3c',
          }
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit for Approval'}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Submit News Post for Approval
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Your news post will be submitted to administrators for review and approval before publishing.
            Once approved, it will be visible to all society members.
          </DialogContentText>
          {error && (
            <DialogContentText color="error" sx={{ mt: 2 }}>
              Error: {error}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            autoFocus
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewsPublicationRequestButton;