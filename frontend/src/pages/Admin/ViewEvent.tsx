import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { Event } from "../../types";

/**
 * Interface for form error state
 */
interface FormErrors {
  title?: string;
  main_description?: string;
  date?: string;
  start_time?: string;
  duration?: string;
  location?: string;
  hosted_by?: string;
}

/**
 * Interface for notification state
 */
interface Notification {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

/**
 * ViewEvent component for displaying and editing event details
 */
const ViewEvent: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { event_id } = useParams<{ event_id: string }>();
  const eventId = Number(event_id);

  // State management
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: "",
    severity: "info",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  /**
   * Fetch event details from API
   */
  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiPaths.USER.ADMINEVENTVIEW(eventId));
      setEvent(response.data);
      setFormData(response.data);
      setSnackbar({
        open: true,
        message: "Event updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error fetching event details", error);
      showNotification("Failed to load event details", "error");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  /**
   * Handle input field changes
   */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, [name]: value } : null
    );
    
    // Clear field-specific error when user edits field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData?.title?.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }

    if (!formData?.main_description?.trim()) {
      newErrors.main_description = "Description is required";
      isValid = false;
    }

    if (!formData?.date) {
      newErrors.date = "Date is required";
      isValid = false;
    }

    if (!formData?.start_time) {
      newErrors.start_time = "Start time is required";
      isValid = false;
    }

    if (!formData?.location?.trim()) {
      newErrors.location = "Location is required";
      isValid = false;
    }

    if (!formData?.hosted_by?.toString().trim()) {
      newErrors.hosted_by = "Host information is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Show notification message
   */
  const showNotification = (
    message: string, 
    severity: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  /**
   * Handle notification close
   */
  const handleNotificationClose = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData || !event) return;
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      await apiClient.patch(
        `/api/admin/manage-event/${eventId}`,
        formData
      );
      showNotification("Event updated successfully!", "success");
    } catch (error) {
      console.error("Error updating event", error);
      showNotification("Failed to update event", "error");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Navigate back to previous page
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  /**
   * Reset form to original event data
   */
  const handleReset = () => {
    setFormData(event);
    setErrors({});
    showNotification("Form has been reset to original values", "info");
  };

  if (loading || !formData) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" p={4}>
      <Button 
        variant="contained" 
        onClick={handleGoBack} 
        sx={{ mb: 2 }}
        startIcon={<span>←</span>}
      >
        Back
      </Button>
      
      <Typography variant="h2" textAlign="center" mb={4}>
        View Event Details
      </Typography>

      <Paper
        sx={{
          maxWidth: "800px",
          mx: "auto",
          p: 4,
          borderRadius: "8px",
          boxShadow: 3,
          backgroundColor: colors.primary[400],
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                error={Boolean(errors.title)}
                helperText={errors.title}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.main_description || ""}
                onChange={handleChange}
                error={Boolean(errors.main_description)}
                helperText={errors.main_description}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.date)}
                helperText={errors.date}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time"
                name="start_time"
                type="time"
                value={formData.start_time || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.start_time)}
                helperText={errors.start_time}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration"
                name="duration"
                value={formData.duration || ""}
                onChange={handleChange}
                error={Boolean(errors.duration)}
                helperText={errors.duration}
                placeholder="e.g., 2 hours"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                error={Boolean(errors.location)}
                helperText={errors.location}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hosted By"
                name="hosted by"
                value={formData.hosted_by || ""}
                onChange={handleChange}
                error={Boolean(errors.hosted_by)}
                helperText={errors.hosted_by}
                required
              />
            </Grid>
          </Grid>

          <Box mt={3} display="flex" justifyContent="center" gap={2}>
            <Button 
              type="button" 
              variant="outlined" 
              onClick={handleReset}
              disabled={saving}
              color="secondary"
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewEvent;