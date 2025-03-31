import React, { useState, useEffect, forwardRef } from "react";
import { useNavigate, useParams, Params } from "react-router-dom";
import { useTheme, Snackbar } from "@mui/material";
import { EventForm } from "../../components/EventForm";
import { apiClient } from "../../api";
import { Alert } from "../../components/Alert";
import {
  FormData,
  StyleTagProps,
} from "../../types/president/CreateSocietyEvent";

const removeExistingStyleTag = () => {
  const existingStyle = document.getElementById("event-form-styles");
  if (existingStyle) {
    existingStyle.remove();
  }
};

const generateStyleContent = (isDarkMode: boolean) => {
  return `
    .event-form-wrapper .MuiTypography-root,
    .event-form-wrapper .MuiButton-root,
    .event-form-wrapper .MuiInputLabel-root,
    .event-form-wrapper label,
    .event-form-wrapper .MuiFormHelperText-root,
    .event-form-wrapper .image-upload-text,
    .event-form-wrapper p,
    .event-form-wrapper span {
      color: ${isDarkMode ? "#fff !important" : "#141b2d !important"};
    }
    .event-form-wrapper .MuiButton-outlined {
      border-color: ${isDarkMode ? "#fff !important" : "#141b2d !important"};
    }
  `;
};

const createAndAppendStyleTag = (styleContent: string) => {
  const style = document.createElement("style");
  style.id = "event-form-styles";
  style.innerHTML = styleContent;
  document.head.appendChild(style);
};

const createStyleTag = ({ isDarkMode }: StyleTagProps) => {
  removeExistingStyleTag();
  const styleContent = generateStyleContent(isDarkMode);
  createAndAppendStyleTag(styleContent);
};

const CreateEvent: React.FC = () => {
  const theme = useTheme();
  const { societyId } = useParams<Params>();
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const setupThemeStyles = () => {
    const isDarkMode = theme.palette.mode === "dark";
    createStyleTag({ isDarkMode });
  };

  const cleanupThemeStyles = () => {
    removeExistingStyleTag();
  };

  useEffect(() => {
    setupThemeStyles();
    return cleanupThemeStyles;
  }, [theme.palette.mode]);

  const isSuccessful = (status: number): boolean => status === 201;

  const navigateBack = () => {
    navigate(-1);
  };

  const handleSuccessfulSubmit = () => {
    showSnackbar("Event created successfully!", "success");
    setTimeout(navigateBack, 2000);
  };

  const handleFailedSubmit = (errorMessage: string) => {
    console.error("Error creating event:", errorMessage);
    showSnackbar("Failed to create event.", "error");
  };

  const submitEventRequest = async (formData: FormData) => {
    return await apiClient.post(
      `/api/events/requests/${societyId}/`,
      formData
    );
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await submitEventRequest(formData);
      
      if (isSuccessful(response.status)) {
        handleSuccessfulSubmit();
        return;
      }
      
      throw new Error(`Server error: ${response.statusText}`);
    } catch (error: unknown) {
      handleFailedSubmit(String(error));
    }
  };

  const createAlertComponent = () => (
    <Alert 
      onClose={handleSnackbarClose} 
      severity={snackbarSeverity} 
      sx={{ width: "100%" }}
    >
      {snackbarMessage}
    </Alert>
  );

  const createSnackbarComponent = () => (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={handleSnackbarClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      {createAlertComponent()}
    </Snackbar>
  );

  const createEventFormComponent = () => (
    <EventForm onSubmit={handleSubmit} />
  );

  return (
    <>
      {createEventFormComponent()}
      {createSnackbarComponent()}
    </>
  );
};

export default CreateEvent;