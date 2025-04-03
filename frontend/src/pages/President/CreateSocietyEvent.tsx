import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme, Snackbar, Box } from "@mui/material";
import { EventForm } from "../../components/EventForm";
import { apiClient } from "../../api";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof MuiAlert>>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface FormData {
  [key: string]: any;
}

const createStyleTag = (isDarkMode: boolean) => {
  const existingStyle = document.getElementById("event-form-styles");
  if (existingStyle) {
    existingStyle.remove();
  }
  const style = document.createElement("style");
  style.id = "event-form-styles";
  style.innerHTML = `
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
  document.head.appendChild(style);
};

const CreateEvent: React.FC = () => {
  const theme = useTheme();
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const isDarkMode = theme.palette.mode === "dark";
    createStyleTag(isDarkMode);
    return () => {
      const styleTag = document.getElementById("event-form-styles");
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [theme.palette.mode]);

  const isSuccessful = (status: number) => status === 201;

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await apiClient.post(`/api/events/requests/${societyId}/`, formData);
      if (isSuccessful(response.status)) {
        showSnackbar("Event created successfully!", "success");
        navigate(-1);
        return;
      }
      throw new Error(`Server error: ${response.statusText}`);
    } catch (error) {
      console.error("Error creating event:", error);
      showSnackbar("Failed to create event.", "error");
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <EventForm onSubmit={handleSubmit} />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          "& .MuiSnackbar-root": {
            top: "24px"
          }
        }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateEvent;
