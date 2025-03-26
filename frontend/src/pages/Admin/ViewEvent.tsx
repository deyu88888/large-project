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


interface FormErrors {
  title?: string;
  main_description?: string;
  date?: string;
  start_time?: string;
  duration?: string;
  location?: string;
  hosted_by?: string;
  [key: string]: string | undefined;
}

interface Notification {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

interface EventFormState {
  event: Event | null;
  formData: Event | null;
  loading: boolean;
  saving: boolean;
  errors: FormErrors;
}

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  InputLabelProps?: {
    shrink: boolean;
  };
  placeholder?: string;
  fullWidth?: boolean;
}

interface ActionButtonsProps {
  onReset: () => void;
  saving: boolean;
}

interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

interface LoadingSpinnerProps {
  color?: "primary" | "secondary";
}

interface BackButtonProps {
  onClick: () => void;
}

interface EventFormProps {
  formData: Event;
  errors: FormErrors;
  saving: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
}


const createField = (
  formData: Event | null,
  name: string,
  defaultValue: string = ""
): string => {
  if (!formData) return defaultValue;
  return formData[name as keyof Event]?.toString() || defaultValue;
};


const fetchEventData = async (eventId: number): Promise<Event> => {
  const response = await apiClient.get(apiPaths.USER.ADMINEVENTVIEW(eventId));
  return response.data;
};

const updateEventData = async (eventId: number, data: Event): Promise<void> => {
  await apiClient.patch(`/api/admin/manage-event/${eventId}`, data);
};


const validateRequiredField = (value: string | undefined, fieldName: string): string | undefined => {
  if (!value?.trim()) {
    return `${fieldName} is required`;
  }
  return undefined;
};

const validateEventForm = (formData: Event | null): FormErrors => {
  if (!formData) return {};
  
  const errors: FormErrors = {};
  
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

const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0;
};


const FormTextField: React.FC<TextFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  multiline = false,
  rows,
  type,
  InputLabelProps,
  placeholder,
  fullWidth = true
}) => (
  <TextField
    fullWidth={fullWidth}
    label={label}
    name={name}
    value={value}
    onChange={onChange}
    error={error}
    helperText={helperText}
    required={required}
    multiline={multiline}
    rows={rows}
    type={type}
    InputLabelProps={InputLabelProps}
    placeholder={placeholder}
  />
);

const ActionButtons: React.FC<ActionButtonsProps> = ({ onReset, saving }) => (
  <Box mt={3} display="flex" justifyContent="center" gap={2}>
    <Button 
      type="button" 
      variant="outlined" 
      onClick={onReset}
      disabled={saving}
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
);

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ color = "secondary" }) => (
  <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
    <CircularProgress color={color} />
  </Box>
);

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => (
  <Button 
    variant="contained" 
    onClick={onClick} 
    sx={{ mb: 2 }}
    startIcon={<span>←</span>}
  >
    Back
  </Button>
);

const NotificationAlert: React.FC<NotificationProps> = ({ notification, onClose }) => (
  <Snackbar
    open={notification.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert 
      onClose={onClose} 
      severity={notification.severity}
      sx={{ width: "100%" }}
    >
      {notification.message}
    </Alert>
  </Snackbar>
);

const EventForm: React.FC<EventFormProps> = ({
  formData,
  errors,
  saving,
  onChange,
  onSubmit,
  onReset
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
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
      <form onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormTextField
              label="Event Title"
              name="title"
              value={createField(formData, "title")}
              onChange={onChange}
              error={Boolean(errors.title)}
              helperText={errors.title}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormTextField
              label="Description"
              name="main_description"
              multiline
              rows={3}
              value={createField(formData, "main_description")}
              onChange={onChange}
              error={Boolean(errors.main_description)}
              helperText={errors.main_description}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              label="Date"
              name="date"
              type="date"
              value={createField(formData, "date")}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.date)}
              helperText={errors.date}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              label="Start Time"
              name="start_time"
              type="time"
              value={createField(formData, "start_time")}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.start_time)}
              helperText={errors.start_time}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              label="Duration"
              name="duration"
              value={createField(formData, "duration")}
              onChange={onChange}
              error={Boolean(errors.duration)}
              helperText={errors.duration}
              placeholder="e.g., 2 hours"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              label="Location"
              name="location"
              value={createField(formData, "location")}
              onChange={onChange}
              error={Boolean(errors.location)}
              helperText={errors.location}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormTextField
              label="Hosted By"
              name="hosted_by"
              value={createField(formData, "hosted_by")}
              onChange={onChange}
              error={Boolean(errors.hosted_by)}
              helperText={errors.hosted_by}
              required
            />
          </Grid>
        </Grid>

        <ActionButtons 
          onReset={onReset}
          saving={saving}
        />
      </form>
    </Paper>
  );
};

/**
 * ViewEvent component for displaying and editing event details
 */
const ViewEvent: React.FC = () => {
  const navigate = useNavigate();
  const { event_id } = useParams<{ event_id: string }>();
  const eventId = Number(event_id);

  
  const [formState, setFormState] = useState<EventFormState>({
    event: null,
    formData: null,
    loading: true,
    saving: false,
    errors: {}
  });
  
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: "",
    severity: "info",
  });

  
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const showNotificationMessage = useCallback((
    message: string, 
    severity: "success" | "error" | "info" | "warning" = "info"
  ) => {
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
    } catch (error) {
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

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formState.formData || !formState.event) return;
    
    const isValid = validateAndSetErrors();
    if (!isValid) return;
    
    try {
      setFormState(prev => ({ ...prev, saving: true }));
      
      await updateEventData(eventId, formState.formData);
      
      showNotificationMessage("Event updated successfully!", "success");
    } catch (error) {
      console.error("Error updating event", error);
      showNotificationMessage("Failed to update event", "error");
    } finally {
      setFormState(prev => ({ ...prev, saving: false }));
    }
  }, [formState.formData, formState.event, eventId, validateAndSetErrors, showNotificationMessage]);

  
  if (formState.loading || !formState.formData) {
    return <LoadingSpinner />;
  }

  
  return (
    <Box minHeight="100vh" p={4}>
      <BackButton onClick={handleGoBack} />
      
      <Typography variant="h2" textAlign="center" mb={4}>
        View Event Details
      </Typography>

      <EventForm
        formData={formState.formData}
        errors={formState.errors}
        saving={formState.saving}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      <NotificationAlert
        notification={notification}
        onClose={handleNotificationClose}
      />
    </Box>
  );
};

export default ViewEvent;