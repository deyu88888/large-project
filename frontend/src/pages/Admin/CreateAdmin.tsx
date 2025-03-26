import React, { useState } from "react";
import { 
  Box, 
  Button,
  IconButton, 
  InputAdornment, 
  TextField, 
  useTheme,
  Paper,
  Typography,
  Alert,
  Snackbar
} from "@mui/material";
import { Formik, Form, FormikHelpers } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import CircularLoader from "../../components/loading/circular-loader";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";
import { Admin } from "../../types";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { tokens } from "../../theme/theme";

/**
 * Form values interface for better type checking
 */
interface AdminFormValues {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Enhanced validation schema for admin creation form
 */
const validationSchema = yup.object().shape({
  first_name: yup.string()
    .trim()
    .max(50, "First name must be at most 50 characters")
    .required("First name is required"),
  last_name: yup.string()
    .trim()
    .max(50, "Last name must be at most 50 characters")
    .required("Last name is required"),
  username: yup.string()
    .trim()
    .min(6, "Username must be at least 6 characters")
    .max(30, "Username must be at most 30 characters")
    .matches(
      /^[a-zA-Z0-9_.-]+$/,
      "Username must only contain letters, numbers, underscores, hyphens, and dots"
    )
    .required("Username is required"),
  email: yup.string()
    .trim()
    .email("Invalid email address")
    .test(
      'is-kcl-email', 
      'Must be a KCL email', 
      (value) => value ? value.endsWith('@kcl.ac.uk') : false
    )
    .required("Email is required"),
  password: yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup.string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm the password"),
});

/**
 * Initial form values
 */
const initialValues: AdminFormValues = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

/**
 * CreateAdmin component - Allows super admins to create new administrators
 */
const CreateAdmin: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { drawer } = useSettingsStore();

  // Component state
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error" as "error" | "success" | "info" | "warning"
  });

  /**
   * Handle password visibility toggle
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Handle form submission to create new admin
   */
  const handleFormSubmit = async (values: AdminFormValues, { resetForm }: FormikHelpers<AdminFormValues>) => {
    if (!user?.is_super_admin) {
      setSnackbar({
        open: true,
        message: "You do not have permission to create admins",
        severity: "error"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(apiPaths.USER.ADMIN, values);
      
      // Store the admin object from the response
      const adminData = response.data.admin;
      setCreatedAdmin(adminData);
      setIsSuccess(true);
      resetForm();
      
      setSnackbar({
        open: true,
        message: "Admin created successfully!",
        severity: "success"
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "An error occurred while creating the admin";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error"
      });
      console.error("Error creating admin:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset the success state to create another admin
   */
  const handleCreateAnother = () => {
    setIsSuccess(false);
    setCreatedAdmin(null);
  };

  /**
   * Handle snackbar close
   */
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Check if user is not a super admin
  if (!user?.is_super_admin) {
    return (
      <Box m="20px" display="flex" justifyContent="center" flexDirection="column" alignItems="center">
        <Header title="Create Admin" subtitle="You are not authorized to create an admin" />
        <Alert severity="error" sx={{ mt: 2, width: "100%", maxWidth: 500 }}>
          This feature is restricted to super administrators only.
        </Alert>
      </Box>
    );
  }

  // Render success message after admin creation
  if (isSuccess && createdAdmin) {
    return (
      <Box m="20px" display="flex" justifyContent="center" flexDirection="column" alignItems="center">
        <Header title="Create Admin" subtitle="New Admin Created Successfully!" />
        
        <Paper
          elevation={3}
          sx={{ 
            width: "100%", 
            maxWidth: "500px", 
            p: 3, 
            mb: 5, 
            borderRadius: 1,           
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body1">
              <strong>First Name:</strong> {createdAdmin.first_name}
            </Typography>
            <Typography variant="body1">
              <strong>Last Name:</strong> {createdAdmin.last_name}
            </Typography>
            <Typography variant="body1">
              <strong>Username:</strong> {createdAdmin.username}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {createdAdmin.email}
            </Typography>
          </Box>
        </Paper>
  
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCreateAnother}
          aria-label="Create another admin"
        >
          Create Another Admin
        </Button>
      </Box>
    );
  }

  // Render form for creating a new admin
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
        p: "20px"
      }}
    >
      <Header title="Create Admin" subtitle="Create a New Admin Profile" />
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3,
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff" 
        }}
      >
        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={validationSchema}
          validateOnBlur
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
            isValid,
            dirty
          }) => (
            <Form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                }}
              >
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="First Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.first_name}
                  name="first_name"
                  error={Boolean(touched.first_name && errors.first_name)}
                  helperText={touched.first_name && errors.first_name}
                  sx={{ gridColumn: "span 2" }}
                  disabled={loading}
                  InputProps={{
                    "aria-label": "First Name",
                  }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Last Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.last_name}
                  name="last_name"
                  error={Boolean(touched.last_name && errors.last_name)}
                  helperText={touched.last_name && errors.last_name}
                  sx={{ gridColumn: "span 2" }}
                  disabled={loading}
                  InputProps={{
                    "aria-label": "Last Name",
                  }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Username"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.username}
                  name="username"
                  error={Boolean(touched.username && errors.username)}
                  helperText={touched.username && errors.username}
                  sx={{ gridColumn: "span 4" }}
                  disabled={loading}
                  InputProps={{
                    "aria-label": "Username",
                  }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  name="email"
                  error={Boolean(touched.email && errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{ gridColumn: "span 4" }}
                  disabled={loading}
                  InputProps={{
                    "aria-label": "Email",
                  }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password}
                  name="password"
                  error={Boolean(touched.password && errors.password)}
                  helperText={touched.password && errors.password}
                  sx={{ gridColumn: "span 4" }}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleTogglePasswordVisibility} 
                          edge="end"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    "aria-label": "Password",
                  }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type={showPassword ? "text" : "password"}
                  label="Confirm Password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.confirmPassword}
                  name="confirmPassword"
                  error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  sx={{ gridColumn: "span 4" }}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleTogglePasswordVisibility} 
                          edge="end"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    "aria-label": "Confirm Password",
                  }}
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mt="20px">
                <Button 
                  type="reset" 
                  color="inherit" 
                  variant="outlined" 
                  disabled={loading}
                  aria-label="Reset form"
                >
                  Reset
                </Button>
                
                <Button 
                  type="submit" 
                  color="secondary" 
                  variant="contained" 
                  disabled={loading || !(isValid && dirty)}
                  endIcon={loading ? <CircularLoader size={20} /> : null}
                  aria-label="Create new admin"
                >
                  {loading ? "Creating..." : "Create New Admin"}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateAdmin;