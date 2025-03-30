import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useCallback,
  useMemo,
} from "react";
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
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { Society } from "../../types";
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  [key: string]: string | undefined;
}

interface Notification {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  inputProps?: Record<string, any>;
  variant?: "outlined" | "filled" | "standard";
  fullWidth?: boolean;
}

interface FileUploadProps {
  onFileChange: (file: File) => void;
  currentIcon: string | File | null;
}

interface ActionButtonsProps {
  saving: boolean;
}

interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

interface LoadingSpinnerProps {
  message?: string;
}

interface BackButtonProps {
  onClick: () => void;
}

interface SocietyFormProps {
  formData: Society;
  errors: FormErrors;
  saving: boolean;
  onTextChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onTagsChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (file: File) => void;
  onSubmit: (e: FormEvent) => void;
}

const fetchSocietyData = async (societyId: number): Promise<Society> => {
  try {
    const response = await apiClient.get(
      apiPaths.USER.ADMINSOCIETYVIEW(societyId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching society details:", error);
    throw error;
  }
};

const updateSocietyData = async (
  societyId: number,
  formData: FormData
): Promise<void> => {
  await apiClient.patch(`/api/admin/manage-society/${societyId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const createFormDataFromSociety = (society: Society, icon?: File): FormData => {
  const formDataToSend = new FormData();
  formDataToSend.append("name", society.name || "");
  formDataToSend.append("description", society.description || "");
  formDataToSend.append("category", society.category || "");
  formDataToSend.append("tags", JSON.stringify(society.tags || []));

  if (icon instanceof File) {
    formDataToSend.append("icon", icon);
  }

  if (
    society.social_media_links &&
    typeof society.social_media_links === "object"
  ) {
    Object.entries(society.social_media_links).forEach(([platform, link]) => {
      if (link) {
        formDataToSend.append(`social_media_links[${platform}]`, link);
      }
    });
  }

  return formDataToSend;
};

const formatTagsString = (tags: string[] | null | undefined): string => {
  if (!tags || !Array.isArray(tags)) return "";
  return tags.join(", ");
};

const parseTagsString = (tagsString: string): string[] => {
  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

const validateSocietyForm = (formData: Society | null): FormErrors => {
  const errors: FormErrors = {};

  if (!formData) return errors;

  if (!formData.name?.trim()) {
    errors.name = "Society name is required";
  }

  if (!formData.description?.trim()) {
    errors.description = "Description is required";
  }

  if (!formData.category?.trim()) {
    errors.category = "Category is required";
  }

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
  disabled = false,
  multiline = false,
  rows,
  placeholder,
  inputProps,
  variant = "outlined",
  fullWidth = true,
}) => (
  <TextField
    label={label}
    name={name}
    value={value}
    onChange={onChange}
    error={error}
    helperText={helperText}
    required={required}
    disabled={disabled}
    multiline={multiline}
    rows={rows}
    placeholder={placeholder}
    inputProps={inputProps}
    variant={variant}
    fullWidth={fullWidth}
  />
);

const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  currentIcon,
}) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Upload Icon
      </Typography>
      <Button
        variant="contained"
        component="label"
        sx={{ borderRadius: "8px", mb: 2 }}
      >
        Choose File
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </Button>

      {/* Preview current icon */}
      {currentIcon && typeof currentIcon === "string" && (
        <Box mb={4}>
          <Typography variant="caption" color="textSecondary">
            Current Icon:
          </Typography>
          <Box mt={1}>
            <img
              src={currentIcon}
              alt="Society Icon"
              style={{ maxWidth: "120px", borderRadius: "8px" }}
            />
          </Box>
        </Box>
      )}

      {/* Preview new upload */}
      {currentIcon instanceof File && (
        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            New Icon Preview:
          </Typography>
          <Box mt={1}>
            <img
              src={URL.createObjectURL(currentIcon)}
              alt="New Society Icon"
              style={{ maxWidth: "120px", borderRadius: "8px" }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ saving }) => (
  <Box mt={4} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
    <Button
      type="submit"
      variant="contained"
      color="primary"
      disabled={saving}
      sx={{
        minWidth: 150,
        borderRadius: "8px",
      }}
    >
      {saving ? (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} color="inherit" />
          <span>Saving...</span>
        </Box>
      ) : (
        "Save Changes"
      )}
    </Button>
  </Box>
);

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading society details...",
}) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress color="secondary" size={40} />
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => (
  <Tooltip title="Go back">
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        mb: 2,
        borderRadius: "8px",
      }}
      startIcon={<ArrowBackIcon />}
    >
      Back
    </Button>
  </Tooltip>
);

const NotificationAlert: React.FC<NotificationProps> = ({
  notification,
  onClose,
}) => (
  <Snackbar
    open={notification.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert
      onClose={onClose}
      severity={notification.severity}
      variant="filled"
      sx={{ width: "100%" }}
      elevation={6}
    >
      {notification.message}
    </Alert>
  </Snackbar>
);

const SocietyForm: React.FC<SocietyFormProps> = ({
  formData,
  errors,
  saving,
  onTextChange,
  onTagsChange,
  onFileChange,
  onSubmit,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const commonTextFieldProps = useMemo(
    () => ({
      variant: "outlined" as const,
      fullWidth: true,
    }),
    []
  );

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: "800px",
        mx: "auto",
        p: { xs: 2, sm: 4 },
        borderRadius: "12px",
        boxShadow: 3,
        backgroundColor: colors.primary[400],
        transition: "all 0.3s ease",
      }}
    >
      <form onSubmit={onSubmit}>
        <Grid container>
          {/* Upload Icon */}
          <Grid item md={6} xs={12}>
            <FileUpload
              onFileChange={onFileChange}
              currentIcon={formData.icon}
            />
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="Society Name"
                name="name"
                value={formData.name || ""}
                onChange={onTextChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description || ""}
                onChange={onTextChange}
                error={Boolean(errors.description)}
                helperText={errors.description}
                required
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>

            <Grid item md={6} xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="Category"
                name="category"
                value={formData.category || ""}
                onChange={onTextChange}
                error={Boolean(errors.category)}
                helperText={errors.category}
                required
                inputProps={{ maxLength: 50 }}
              />
            </Grid>

            <Grid item md={6} xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="President"
                name="president"
                value={
                  formData.president
                    ? `${formData.president.first_name} ${formData.president.last_name}`
                    : ""
                }
                onChange={onTextChange}
                disabled
              />
            </Grid>

            <Grid item md={6} xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="Approved By"
                name="approved_by"
                value={formData.approved_by || ""}
                onChange={onTextChange}
                disabled
              />
            </Grid>

            <Grid item md={6} xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="Status"
                name="status"
                value={formData.status || ""}
                onChange={onTextChange}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <FormTextField
                {...commonTextFieldProps}
                label="Tags (comma separated)"
                name="tags"
                value={
                  Array.isArray(formData.tags) ? formData.tags.join(", ") : ""
                }
                onChange={(e) => onTagsChange(e as any)}
                error={Boolean(errors.tags)}
                helperText={errors.tags || "Enter tags separated by commas"}
                placeholder="e.g., academic, sports, cultural"
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
          </Grid>

          <ActionButtons saving={saving} />
        </Grid>
      </form>
    </Paper>
  );
};

/**
 * ViewSociety component for viewing and editing society details
 */
const ViewSociety: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();
  const societyId = Number(society_id);

  const [formData, setFormData] = useState<Society | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: "",
    severity: "info",
  });

  const fetchSocietyDataWrapper = useCallback(async () => {
    try {
      return await fetchSocietyData(societyId);
    } catch (error) {
      console.error("Error fetching society details:", error);
      throw error;
    }
  }, [societyId]);

  const { 
    data: society, 
    loading, 
    error: wsError, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<Society>(
    `society/${societyId}`, 
    fetchSocietyDataWrapper
  );

  useEffect(() => {
    if (society) {
      setFormData({
        ...society,
        social_media_links: society.social_media_links || {},
        tags: society.tags || [],
      });
    }
  }, [society]);

  useEffect(() => {
    if (wsError) {
      setNotification({
        open: true,
        message: `Error loading data: ${wsError}`,
        severity: "error"
      });
    }
  }, [wsError]);

  const showNotification = useCallback(
    (
      message: string,
      severity: "success" | "error" | "info" | "warning" = "info"
    ) => {
      setNotification({
        open: true,
        message,
        severity,
      });
    },
    []
  );

  const handleNotificationClose = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => {
        if (!prev) return null;
        return { ...prev, [name]: value };
      });

      setErrors((prev) => {
        const updatedErrors = { ...prev };
        if (updatedErrors[name]) {
          delete updatedErrors[name];
        }
        return updatedErrors;
      });
    },
    []
  );

  const handleTagsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const tagsValue = e.target.value;
    const tagsArray = parseTagsString(tagsValue);

    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, tags: tagsArray };
    });

    setErrors((prev) => {
      const updatedErrors = { ...prev };
      if (updatedErrors.tags) {
        delete updatedErrors.tags;
      }
      return updatedErrors;
    });
  }, []);

  const handleFileChange = useCallback((file: File) => {
    setIconFile(file);
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, icon: file };
    });
  }, []);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const resetForm = useCallback(() => {
    if (society) {
      setFormData({
        ...society,
        social_media_links: society.social_media_links || {},
        tags: society.tags || [],
      });
      setIconFile(null);
      setErrors({});
    }
    
    showNotification("Form has been reset to original values", "info");
  }, [society, showNotification]);

  const validateAndSetErrors = useCallback(() => {
    const newErrors = validateSocietyForm(formData);
    setErrors(newErrors);
    return isFormValid(newErrors);
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!formData || !society) return;

      const isValid = validateAndSetErrors();
      if (!isValid) {
        showNotification("Please correct the errors in the form", "error");
        return;
      }

      try {
        setSaving(true);

        const formDataToSend = createFormDataFromSociety(
          formData,
          iconFile
        );

        await updateSocietyData(societyId, formDataToSend);
        
        refresh();
        setIconFile(null);
        
        showNotification("Society updated successfully!", "success");
      } catch (error) {
        console.error("Error updating society:", error);
        showNotification("Failed to update society", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, society, societyId, iconFile, validateAndSetErrors, showNotification, refresh]
  );

  if (loading || !formData) {
    return <LoadingSpinner />;
  }

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: colors.primary[500],
      }}
    >
      <Box>
        <BackButton onClick={handleGoBack} />
      </Box>

      <Typography
        variant="h2"
        textAlign="center"
        mb={4}
        color={colors.grey[100]}
        fontWeight="bold"
      >
        View Society Details
      </Typography>

      <SocietyForm
        formData={formData}
        errors={errors}
        saving={saving}
        onTextChange={handleTextChange}
        onTagsChange={handleTagsChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
      />

      <NotificationAlert
        notification={notification}
        onClose={handleNotificationClose}
      />
    </Box>
  );
};

export default ViewSociety;