import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
  useTheme
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { EventForm } from "../../components/EventForm";
import { apiClient } from "../../api";

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
  const colors = tokens(theme.palette.mode);
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  React.useEffect(() => {
    const isDarkMode = theme.palette.mode === "dark";
    createStyleTag(isDarkMode);
    
    return () => {
      const styleTag = document.getElementById("event-form-styles");
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [theme.palette.mode]);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/events/requests/${societyId}/`, formData);
      if (response.status === 201) {
        setSnackbar({
          open: true,
          message: "Event created successfully!",
          severity: "success",
        });
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        throw new Error(`Server error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      setSnackbar({
        open: true,
        message: "Failed to create event.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";

  return (
    <Box minHeight="100vh" p={4} sx={{ backgroundColor, color: textColor }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" fontWeight="bold" sx={{ color: textColor }}>
          Create New Event
        </Typography>
        <Typography variant="h6" sx={{ color: colors.grey[500] }}>
          Add a new event for Society {societyId}
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          mx: "auto",
          maxWidth: "800px",
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
          borderRadius: "8px",
          boxShadow: 3,
          "& .MuiTypography-root": {
            color: textColor,
          },
          "& .MuiButton-root": {
            color: textColor,
          },
        }}
        className="event-form-wrapper"
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <>
            <div className="event-form-wrapper">
              <EventForm onSubmit={handleSubmit} />
            </div>
            
            <Box mt={4} display="flex" justifyContent="space-between">
              <Button
                onClick={handleCancel}
                variant="outlined"
                sx={{
                  color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[700],
                  borderColor: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[700],
                  "&:hover": {
                    borderColor: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800],
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateEvent;