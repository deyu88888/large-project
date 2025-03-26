import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
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

  const isSuccessful = (status: number): boolean => status === 201;

  const showSuccessAndNavigateBack = () => {
    alert("Event created successfully!");
    navigate(-1);
  };

  const showError = (error: unknown) => {
    console.error("Error creating event:", error);
    alert("Failed to create event.");
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await apiClient.post(
        `/api/events/requests/${societyId}/`,
        formData
      );

      if (isSuccessful(response.status)) {
        showSuccessAndNavigateBack();
        return;
      }

      throw new Error(`Server error: ${response.statusText}`);
    } catch (error: unknown) {
      showError(error);
    }
  };

  return <EventForm onSubmit={handleSubmit} />;
};

export default CreateEvent;
