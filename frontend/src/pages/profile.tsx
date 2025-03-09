import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { apiClient, apiPaths } from "../api";

// MUI imports
import { useTheme } from "@mui/material/styles";
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  TextField,
} from "@mui/material";

const validationSchema = Yup.object().shape({
  first_name: Yup.string()
    .required("First name is required.")
    .matches(/^[A-Za-z]+$/, "Shouldn't contain numerical or special characters.")
    .max(50, "First name is too long."),
  last_name: Yup.string()
    .required("Last name is required.")
    .matches(/^[A-Za-z]+$/, "Shouldn't contain numerical or special characters.")
    .max(50, "Last name is too long."),
  email: Yup.string()
    .matches(
      /^[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      "Invalid email address."
    )
    .required("Email is required.")
    .max(50, "Too long email id.")
    .min(6, "Too short email id."),
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Button variant="contained" onClick={handleGoBack} sx={{ mb: 4 }}>
          Back
        </Button>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: theme.palette.grey[600],
              borderRadius: "50%",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h4" color={theme.palette.grey[300]}>
              ?
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ mt: 2, color: theme.palette.text.secondary }}
          >
            No user found
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button variant="contained" onClick={handleGoBack} sx={{ mb: 2 }}>
        ← Back
      </Button>
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box
          sx={{
            p: 4,
            backgroundColor: theme.palette.primary.main,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: theme.palette.getContrastText(theme.palette.primary.main),
            }}
          >
            Welcome back, {user.first_name}!
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              mt: 1,
              color: theme.palette.getContrastText(theme.palette.primary.main),
            }}
          >
            Manage your profile information below
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              mb: 4,
              gap: 2,
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 2,
                flex: "1 1 30%",
                textAlign: "center",
                backgroundColor: theme.palette.info.light,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  color: theme.palette.text.secondary,
                }}
              >
                Username
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
                {user.username}
              </Typography>
            </Paper>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                flex: "1 1 30%",
                textAlign: "center",
                backgroundColor: theme.palette.success.light,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  color: theme.palette.text.secondary,
                }}
              >
                Role
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
                {user.role}
              </Typography>
            </Paper>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                flex: "1 1 30%",
                textAlign: "center",
                backgroundColor: theme.palette.warning.light,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  color: theme.palette.text.secondary,
                }}
              >
                Status
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: user.is_active
                      ? theme.palette.success.main
                      : theme.palette.grey[400],
                    mr: 1,
                  }}
                />
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {user.is_active ? "Verified" : "Not Verified"}
                </Typography>
              </Box>
            </Paper>
          </Box>
          <Divider sx={{ mb: 4 }}>Profile Information</Divider>
          <Formik
            initialValues={{
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              email: user.email,
              role: user.role,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              const res = await apiClient.put(apiPaths.USER.CURRENT, {
                first_name:
                  user.first_name === values.first_name
                    ? undefined
                    : values.first_name,
                last_name:
                  user.last_name === values.last_name ? undefined : values.last_name,
                username:
                  user.username === values.username ? undefined : values.username,
                email: user.email === values.email ? undefined : values.email,
                role: user.role === values.role ? undefined : values.role,
              });
              console.log(res);
              setSubmitting(false);
            }}
          >
            {({
              values,
              handleChange,
              handleBlur,
              isSubmitting,
              errors,
              touched,
            }) => (
              <Form>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    name="first_name"
                    label="First Name"
                    variant="outlined"
                    value={values.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.first_name && Boolean(errors.first_name)}
                    helperText={touched.first_name && errors.first_name}
                  />
                  <TextField
                    fullWidth
                    name="last_name"
                    label="Last Name"
                    variant="outlined"
                    value={values.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.last_name && Boolean(errors.last_name)}
                    helperText={touched.last_name && errors.last_name}
                  />
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    variant="outlined"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{ mt: 2 }}
                  >
                    Update Profile
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Paper>
    </Container>
  );
}
