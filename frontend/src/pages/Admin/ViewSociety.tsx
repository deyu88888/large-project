import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback, useMemo } from "react";
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { Society } from "../../types";

/**
 * Interface for form validation errors
 */
interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  [key: string]: string | undefined;
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
 * ViewSociety component for viewing and editing society details
 */
const ViewSociety: React.FC = () => {
  // Hooks
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();
  const societyId = Number(society_id);

  // State management
  const [society, setSociety] = useState<Society | null>(null);
  const [formData, setFormData] = useState<Society | null>(null);
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
   * Show notification message
   */
  const showNotification = useCallback(
    (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
      setNotification({
        open: true,
        message,
        severity,
      });
    },
    []
  );
  
  /**
   * Fetch society details from API
   */
  const fetchSociety = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiPaths.USER.ADMINSOCIETYVIEW(societyId));
      setSociety(response.data);
      setFormData({
        ...response.data,
        social_media_links: response.data.social_media_links || {},
        tags: response.data.tags || [],
      });
      setSnackbar({
        open: true,
        message: "Society updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error fetching society details:", error);
      showNotification("Failed to load society details", "error");
    } finally {
      setLoading(false);
    }
  }, [societyId, showNotification]);

  // Load society data on component mount
  useEffect(() => {
    fetchSociety();
  }, [fetchSociety]);

  /**
   * Handle form field changes
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prevFormData) =>
        prevFormData ? { ...prevFormData, [name]: value } : null
      );
      
      // Clear error when field is edited
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  /**
   * Handle tags field change with special processing
   */
  const handleTagsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!formData) return;
      
      const tagsValue = e.target.value;
      const tagsArray = tagsValue
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      
      setFormData((prevData) => {
        if (!prevData) return null;
        return {
          ...prevData,
          tags: tagsArray,
        };
      });
      
      if (errors.tags) {
        setErrors((prev) => ({ ...prev, tags: undefined }));
      }
    },
    [formData, errors.tags]
  );

  /**
   * Validate form before submission
   */
  const validateForm = useCallback((): boolean => {
    if (!formData) return false;
    
    const newErrors: FormErrors = {};
    let isValid = true;

    // Required fields validation
    if (!formData.name?.trim()) {
      newErrors.name = "Society name is required";
      isValid = false;
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    if (!formData.category?.trim()) {
      newErrors.category = "Category is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  /**
   * Handle notification close
   */
  const handleNotificationClose = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!formData || !society) return;
      
      if (!validateForm()) {
        showNotification("Please correct the errors in the form", "error");
        return;
      }
      
      try {
        setSaving(true);

        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("description", formData.description);
        formDataToSend.append("category", formData.category);
        formDataToSend.append("tags", JSON.stringify(formData.tags));

        if (formData.icon && formData.icon instanceof File) {
          formDataToSend.append("icon", formData.icon);
        }
        
        // Add social media links if they exist
        if (formData.social_media_links && typeof formData.social_media_links === 'object') {
          Object.entries(formData.social_media_links).forEach(([platform, link]) => {
            if (link) {
              formDataToSend.append(`social_media_links[${platform}]`, link);
            }
          });
        }

        // Add icon if it's a File
        if (formData.icon && formData.icon instanceof File) {
          formDataToSend.append("icon", formData.icon);
        }

        await apiClient.patch(
          `/api/admin/manage-society/${societyId}`, 
          formDataToSend, 
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        showNotification("Society updated successfully!", "success");
        await fetchSociety(); // Refresh data after successful update
      } catch (error) {
        console.error("Error updating society:", error);
        showNotification("Failed to update society", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, society, societyId, validateForm, showNotification, fetchSociety]
  );

  /**
   * Reset form to original values
   */
  const handleReset = useCallback(() => {
    if (society) {
      setFormData({
        ...society,
        social_media_links: society.social_media_links || {},
        tags: society.tags || [],
      });
      setErrors({});
      showNotification("Form has been reset to original values", "info");
    }
  }, [society, showNotification]);

  /**
   * Navigate back to previous screen
   */
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Memoized text field props for consistent styling
  const commonTextFieldProps = useMemo(() => ({
    variant: "outlined" as const,
    fullWidth: true,
  }), []);

  // Loading state UI
  if (loading || !formData) {
    return (
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
          Loading society details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      minHeight="100vh" 
      p={4}
      sx={{
        backgroundColor: colors.primary[500],
      }}
    >
      <Tooltip title="Go back">
        <Button 
          variant="contained" 
          onClick={handleGoBack} 
          sx={{ 
            mb: 2,
            borderRadius: "8px",
          }}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
      </Tooltip>
      
      <Typography 
        variant="h2" 
        textAlign="center" 
        mb={4}
        color={colors.grey[100]}
        fontWeight="bold"
      >
        View Society Details
      </Typography>

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
        <form onSubmit={handleSubmit}>
  <Grid container>
    {/* Upload Icon */}
    <Grid item xs={12} md={6}>
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFormData((prev) =>
                prev ? { ...prev, icon: file } : prev
              );
            }
          }}
        />
      </Button>

      {/* Preview current icon */}
      {formData.icon && typeof formData.icon === "string" && (
        <Box mb={4}>
          <Typography variant="caption" color="textSecondary">
            Current Icon:
          </Typography>
          <Box mt={1}>
            <img
              src={formData.icon}
              alt="Society Icon"
              style={{ maxWidth: "120px", borderRadius: "8px" }}
            />
          </Box>
        </Box>
      )}

      {/* Preview new upload */}
      {formData.icon instanceof File && (
        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            New Icon Preview:
          </Typography>
          <Box mt={1}>
            <img
              src={URL.createObjectURL(formData.icon)}
              alt="New Society Icon"
              style={{ maxWidth: "120px", borderRadius: "8px" }}
            />
          </Box>
        </Box>
      )}
    </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                {...commonTextFieldProps}
                label="Society Name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                {...commonTextFieldProps}
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description || ""}
                onChange={handleChange}
                error={Boolean(errors.description)}
                helperText={errors.description}
                required
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                {...commonTextFieldProps}
                label="Category"
                name="category"
                value={formData.category || ""}
                onChange={handleChange}
                error={Boolean(errors.category)}
                helperText={errors.category}
                required
                inputProps={{ maxLength: 50 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                {...commonTextFieldProps}
                label="President"
                name="president"
                value={
                  formData.president
                    ? `${formData.president.first_name} ${formData.president.last_name}`
                    : ""
                }
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                {...commonTextFieldProps}
                label="Approved By"
                name="approved_by"
                value={formData.approved_by || ""}
                onChange={handleChange}
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                {...commonTextFieldProps}
                label="Status"
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                {...commonTextFieldProps}
                label="Tags (comma separated)"
                name="tags"
                value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
                onChange={handleTagsChange}
                error={Boolean(errors.tags)}
                helperText={errors.tags || "Enter tags separated by commas"}
                placeholder="e.g., academic, sports, cultural"
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
          </Grid>

          <Box 
            mt={4} 
            display="flex" 
            justifyContent="center" 
            gap={2}
            flexWrap="wrap"
          >
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
          </Grid>
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
          variant="filled"
          sx={{ width: "100%" }}
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewSociety;