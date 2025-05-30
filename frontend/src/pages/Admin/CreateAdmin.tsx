import React, { useState, FC } from "react";
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
import CircularLoader from "../../components/loading/CircularLoader";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";
import { Admin } from "../../types";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { tokens } from "../../theme/theme";
import TextFieldComponent from "../../components/TextFieldComponent";
import {
  AdminFormValues,
  FormState,
  PasswordFieldProps,
  SuccessViewProps,
  UnauthorizedViewProps,
  FormViewProps,
  FormFieldsProps,
  ErrorAlertProps,
  SnackbarAlertProps,
  FormButtonsProps,
  AdminInfoItemProps,
  FormikWrapperProps,
  FormContentProps
} from "../../types/admin/CreateAdmin";


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


const initialValues: AdminFormValues = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const ErrorAlert: FC<ErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <Alert 
      severity="error" 
      sx={{ mb: 3 }}
      onClose={onClose}
    >
      {error}
    </Alert>
  );
};


const SnackbarAlert: FC<SnackbarAlertProps> = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};


const FormButtons: FC<FormButtonsProps> = ({ isValid, dirty, loading }) => {
  return (
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
  );
};


const PasswordField: FC<PasswordFieldProps> = ({
  name,
  label,
  value,
  showPassword,
  handleBlur,
  handleChange,
  handleTogglePasswordVisibility,
  error,
  helperText,
  disabled
}) => {
  return (
    <TextField
      fullWidth
      variant="filled"
      type={showPassword ? "text" : "password"}
      label={label}
      onBlur={handleBlur}
      onChange={handleChange}
      value={value}
      name={name}
      error={error}
      helperText={helperText}
      sx={{ gridColumn: "span 4" }}
      disabled={disabled}
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
        "aria-label": label,
      }}
    />
  );
};

const FormFields: FC<FormFieldsProps> = ({ 
  formikProps, 
  isNonMobile, 
  loading, 
  showPassword, 
  onTogglePasswordVisibility 
}) => {
  const { values, errors, touched, handleBlur, handleChange } = formikProps;
  
  return (
    <Box
      display="grid"
      gap="30px"
      gridTemplateColumns="repeat(4, minmax(0, 1fr))"
      sx={{
        "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
      }}
    >
      <TextFieldComponent
        label="First Name"
        name="first_name"
        value={values.first_name}
        handleBlur={handleBlur}
        handleChange={handleChange}
        error={Boolean(touched.first_name && errors.first_name)}
        helperText={touched.first_name && errors.first_name ? errors.first_name : undefined}
        gridSpan="span 2"
        disabled={loading}
      />
      
      <TextFieldComponent
        label="Last Name"
        name="last_name"
        value={values.last_name}
        handleBlur={handleBlur}
        handleChange={handleChange}
        error={Boolean(touched.last_name && errors.last_name)}
        helperText={touched.last_name && errors.last_name ? errors.last_name : undefined}
        gridSpan="span 2"
        disabled={loading}
      />
      
      <TextFieldComponent
        label="Username"
        name="username"
        value={values.username}
        handleBlur={handleBlur}
        handleChange={handleChange}
        error={Boolean(touched.username && errors.username)}
        helperText={touched.username && errors.username ? errors.username : undefined}
        gridSpan="span 4"
        disabled={loading}
      />
      
      <TextFieldComponent
        label="Email"
        name="email"
        value={values.email}
        handleBlur={handleBlur}
        handleChange={handleChange}
        error={Boolean(touched.email && errors.email)}
        helperText={touched.email && errors.email? errors.email : undefined}
        gridSpan="span 4"
        disabled={loading}
      />


      <PasswordField
        name="password"
        label="Password"
        value={values.password}
        showPassword={showPassword}
        handleBlur={handleBlur}
        handleChange={handleChange}
        handleTogglePasswordVisibility={onTogglePasswordVisibility}
        error={Boolean(touched.password && errors.password)}
        helperText={touched.password && errors.password ? errors.password : undefined}
        disabled={loading}
      />
      
      <PasswordField
        name="confirmPassword"
        label="Confirm Password"
        value={values.confirmPassword}
        showPassword={showPassword}
        handleBlur={handleBlur}
        handleChange={handleChange}
        handleTogglePasswordVisibility={onTogglePasswordVisibility}
        error={Boolean(touched.confirmPassword && errors.confirmPassword)}
        helperText={touched.confirmPassword && errors.confirmPassword? errors.confirmPassword : undefined}
        disabled={loading}
      />
    </Box>
  );
};


const UnauthorizedView: FC<UnauthorizedViewProps> = ({ title, subtitle }) => {
  return (
    <Box m="20px" display="flex" justifyContent="center" flexDirection="column" alignItems="center">
      <Header title={title} subtitle={subtitle} />
      <Alert severity="error" sx={{ mt: 2, width: "100%", maxWidth: 500 }}>
        This feature is restricted to super administrators only.
      </Alert>
    </Box>
  );
};


const AdminInfoItem: FC<AdminInfoItemProps> = ({ label, value }) => {
  return (
    <Typography variant="body1">
      <strong>{label}:</strong> {value}
    </Typography>
  );
};


const SuccessView: FC<SuccessViewProps> = ({ createdAdmin, onCreateAnother, colors, theme }) => {
  const firstName = createdAdmin.first_name;
  const lastName = createdAdmin.last_name;
  const paperStyle = { 
    width: "100%", 
    maxWidth: "500px", 
    p: 3, 
    mb: 5, 
    borderRadius: 1,           
    backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
  };
  
  return (
    <Box m="20px" display="flex" justifyContent="center" flexDirection="column" alignItems="center">
      <Header title="Create Admin" subtitle="New Admin Created Successfully!" />
      
      <Paper elevation={3} sx={paperStyle}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <AdminInfoItem label="First Name" value={firstName} />
          <AdminInfoItem label="Last Name" value={lastName} />
          <AdminInfoItem label="Username" value={createdAdmin.username} />
          <AdminInfoItem label="Email" value={createdAdmin.email} />
        </Box>
      </Paper>

      <Button
        variant="contained"
        color="secondary"
        onClick={onCreateAnother}
        aria-label="Create another admin"
      >
        Create Another Admin
      </Button>
    </Box>
  );
};

const FormikWrapper: FC<FormikWrapperProps> = ({ 
  onSubmit, 
  isNonMobile, 
  loading, 
  showPassword, 
  onTogglePasswordVisibility 
}) => {
  return (
    <Formik
      onSubmit={onSubmit}
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnBlur
    >
      {(formikProps) => (
        <FormContent 
          formikProps={formikProps} 
          isNonMobile={isNonMobile} 
          loading={loading} 
          showPassword={showPassword} 
          onTogglePasswordVisibility={onTogglePasswordVisibility} 
        />
      )}
    </Formik>
  );
};


const FormContent: FC<FormContentProps> = ({ 
  formikProps, 
  isNonMobile, 
  loading, 
  showPassword, 
  onTogglePasswordVisibility 
}) => {
  const { handleSubmit, isValid, dirty } = formikProps;
  
  return (
    <Form onSubmit={handleSubmit}>
      <FormFields 
        formikProps={formikProps}
        isNonMobile={isNonMobile}
        loading={loading}
        showPassword={showPassword}
        onTogglePasswordVisibility={onTogglePasswordVisibility}
      />
      
      <FormButtons 
        isValid={isValid}
        dirty={dirty}
        loading={loading}
      />
    </Form>
  );
};


const FormView: FC<FormViewProps> = ({ 
  formState, 
  onSubmit, 
  onTogglePasswordVisibility, 
  onErrorClose, 
  onSnackbarClose, 
  isNonMobile, 
  colors, 
  theme,
  drawer
}) => {
  const { loading, error, snackbar } = formState;
  const containerStyle = {
    height: "calc(100vh - 64px)",
    maxWidth: drawer ? `calc(100% - 3px)`: "100%",
    p: "20px"
  };
  
  const paperStyle = { 
    p: { xs: 2, sm: 3 }, 
    mb: 3,
    backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff" 
  };
  
  return (
    <Box sx={containerStyle}>
      <Header title="Create Admin" subtitle="Create a New Admin Profile" />
      <ErrorAlert error={error ?? ""} onClose={onErrorClose} />
      <Paper elevation={3} sx={paperStyle}>
        <FormikWrapper 
          onSubmit={onSubmit}
          isNonMobile={isNonMobile}
          loading={loading}
          showPassword={formState.showPassword}
          onTogglePasswordVisibility={onTogglePasswordVisibility}
        />
      </Paper>
      
      <SnackbarAlert 
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={onSnackbarClose}
      />
    </Box>
  );
};


const createAdminRequest = async (values: AdminFormValues) => {
  const response = await apiClient.post(apiPaths.USER.ADMIN, values);
  return response.data.admin;
};

const CreateAdmin: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { drawer } = useSettingsStore();

  
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    isSuccess: false,
    createdAdmin: null,
    showPassword: false,
    error: null,
    snackbar: {
      open: false,
      message: "",
      severity: "error"
    }
  });

  
  const handleTogglePasswordVisibility = () => {
    setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const handleCreateAnother = () => {
    setFormState(prev => ({ 
      ...prev, 
      isSuccess: false, 
      createdAdmin: null 
    }));
  };

  const handleErrorClose = () => {
    setFormState(prev => ({ ...prev, error: null }));
  };

  const handleSnackbarClose = () => {
    setFormState(prev => ({ 
      ...prev, 
      snackbar: { ...prev.snackbar, open: false } 
    }));
  };

  const setSnackbarMessage = (message: string, severity: "error" | "success" | "info" | "warning") => {
    setFormState(prev => ({
      ...prev,
      snackbar: {
        open: true,
        message,
        severity
      }
    }));
  };

  const showPermissionError = () => {
    setSnackbarMessage("You do not have permission to create admins", "error");
  };

  const setFormLoading = (isLoading: boolean) => {
    setFormState(prev => ({ ...prev, loading: isLoading }));
  };

  const clearFormError = () => {
    setFormState(prev => ({ ...prev, error: null }));
  };

  const setFormSuccess = (adminData: Admin) => {
    setFormState(prev => ({
      ...prev,
      createdAdmin: adminData,
      isSuccess: true,
      loading: false
    }));
  };

  const setFormError = (errorMessage: string) => {
    setFormState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false
    }));
  };

  const handleFormSubmit = async (values: AdminFormValues, { resetForm }: FormikHelpers<AdminFormValues>) => {
    if (!user?.is_super_admin) {
      showPermissionError();
      return;
    }
    
    setFormLoading(true);
    clearFormError();
    
    try {
      const adminData = await createAdminRequest(values);
      setFormSuccess(adminData);
      resetForm();
      setSnackbarMessage("Admin created successfully!", "success");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "An error occurred while creating the admin";
      setFormError(errorMessage);
      setSnackbarMessage(errorMessage, "error");
      console.error("Error creating admin:", error);
    }
  };

  const shouldShowUnauthorizedView = !user?.is_super_admin;
  const shouldShowSuccessView = formState.isSuccess && formState.createdAdmin !== null;
  
  if (shouldShowUnauthorizedView) {
    return (
      <UnauthorizedView 
        title="Create Admin" 
        subtitle="You are not authorized to create an admin" 
      />
    );
  }
  
  if (shouldShowSuccessView && formState.createdAdmin) {
    return (
      <SuccessView 
        createdAdmin={formState.createdAdmin} 
        onCreateAnother={handleCreateAnother}
        colors={colors}
        theme={theme}
      />
    );
  }
  
  return (
    <FormView 
      formState={formState}
      onSubmit={handleFormSubmit}
      onTogglePasswordVisibility={handleTogglePasswordVisibility}
      onErrorClose={handleErrorClose}
      onSnackbarClose={handleSnackbarClose}
      isNonMobile={isNonMobile}
      colors={colors}
      theme={theme}
      drawer={drawer}
    />
  );
};

export default CreateAdmin;