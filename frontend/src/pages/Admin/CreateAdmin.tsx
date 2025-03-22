import { Box, Button, colors, IconButton, InputAdornment, TextField, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { useState } from "react";
import CircularLoader from "../../components/loading/circular-loader";
import { apiClient, apiPaths } from "../../api";
import { useSettingsStore } from "../../stores/settings-store";
import { useAuthStore } from "../../stores/auth-store";
import {Admin} from "../../types"
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { tokens } from "../../theme/theme";

const Form = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<Admin | null>(null);
  const { drawer } = useSettingsStore();
  const [showPassword, setShowPassword] = useState(false);

  if (user?.is_super_admin) {
    const handleFormSubmit = async (values: any) => {
      setLoading(true);
      try {
        console.log(values);
        const res = await apiClient.post(apiPaths.USER.ADMIN, values);
        console.log("API response:", res.data);
        
        // Store the admin object from the response
        const adminData = res.data.admin;
        setCreatedAdmin(adminData);
        setIsSuccess(true);
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    };

    if (isSuccess) {
      return (
        <Box m="20px" display={"flex"} justifyContent={"center"} flexDirection={"column"} alignItems={"center"}>
          <Header title="Create Admin" subtitle="New Admin Created Successfully!" />
          
          {createdAdmin && (
            <Box sx={{ width: "100%", maxWidth: "500px", p: 3, mb: 5, borderRadius: 1,           
              backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
            }}>
              <Box sx={{ display: "flex", mb: 1 }}>
                <strong>First Name: {createdAdmin.firsName}</strong>
              </Box>
              <Box sx={{ display: "flex", mb: 1 }}>
                <strong>Last Name: {createdAdmin.lastName}</strong> 
              </Box>
              <Box sx={{ display: "flex", mb: 1 }}>
                <strong>Username: {createdAdmin.username}</strong> 
              </Box>
              <Box sx={{ display: "flex"}}>
                <strong>Email: {createdAdmin.email}</strong> 
              </Box>
            </Box>
          )}
    
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsSuccess(false)}
          >
            Create Another Admin
          </Button>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          maxWidth: drawer ? `calc(100% - 3px)`: "100%",
        }}
      >
        <Header title="Create Admin" subtitle="Create a New Admin Profile" />
        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={checkoutSchema}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
          }) => (
            <form onSubmit={handleSubmit}>
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
                  value={values.firstName}
                  name="firstName"
                  error={!!touched.firstName && !!errors.firstName}
                  helperText={touched.firstName && errors.firstName}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Last Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.lastName}
                  name="lastName"
                  error={!!touched.lastName && !!errors.lastName}
                  helperText={touched.lastName && errors.lastName}
                  sx={{ gridColumn: "span 2" }}
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
                  error={!!touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                  sx={{ gridColumn: "span 4" }}
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
                  error={!!touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  sx={{ gridColumn: "span 4" }}
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
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  sx={{ gridColumn: "span 4" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
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
                  error={!!touched.confirmPassword && !!errors.confirmPassword}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  sx={{ gridColumn: "span 4" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              {loading && (
                <Box display="flex" justifyContent="center" mt="20px">
                  <CircularLoader />
                </Box>
              )}
              <Box display="flex" justifyContent="end" mt="20px">
                <Button type="submit" color="secondary" variant="contained">
                  Create New Admin
                </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    );
  } else {
    return (
      <Box m="20px" display={"flex"} justifyContent={"center"} flexDirection={"column"} alignItems={"center"}>
        <Header title="CREATE ADMIN" subtitle="You are not authorized to create an admin" />
      </Box>
    );
  }
}

// Enhanced validation schema based on the RegisterPage
const checkoutSchema = yup.object().shape({
  firstName: yup.string()
    .max(50, "First name must be at most 50 characters")
    .required("First name is required"),
  lastName: yup.string()
    .max(50, "Last name must be at most 50 characters")
    .required("Last name is required"),
  username: yup.string()
    .min(6, "Username must be at least 6 characters")
    .max(30, "Username must be at most 30 characters")
    .matches(
      /^[a-zA-Z0-9_.-]+$/,
      "Username must only contain letters, numbers, underscores, hyphens, and dots"
    )
    .required("Username is required"),
    email: yup.string()
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

const initialValues = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default Form;