import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { apiClient, apiPaths } from "../api";
import { tokens } from "../theme/theme";

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
  Avatar,
  Card,
  Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
  const colors = tokens(theme.palette.mode);

  const handleGoBack = () => {
    navigate(-1);
  };

  // Get user initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack} 
          sx={{ 
            mb: 4, 
            color: colors.grey[100], 
            borderColor: colors.grey[400] 
          }}
        >
          Back
        </Button>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            textAlign: "center",
            backgroundColor: colors.primary[400]
          }}
        >
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              mx: "auto", 
              bgcolor: colors.blueAccent[500],
              color: colors.grey[100]
            }}
          >
            ?
          </Avatar>
          <Typography variant="h6" sx={{ mt: 2, color: colors.grey[100] }}>
            No user found
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack} 
        sx={{ 
          mb: 3, 
          color: colors.grey[100], 
          borderColor: colors.grey[400] 
        }}
      >
        Back
      </Button>
      
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 4, 
          overflow: 'hidden',
          backgroundColor: colors.primary[400],
          borderRadius: 1
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            backgroundColor: colors.blueAccent[700],
            color: colors.grey[100],
            display: 'flex',
            alignItems: 'center',
            gap: 2
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
              </Card>
            </Grid>
          </Grid>
          
          <Divider 
            sx={{ 
              my: 3, 
              "&::before, &::after": {
                borderColor: colors.grey[500],
              },
              color: colors.grey[100]
            }}
          >
            <Typography variant="h5">Profile Information</Typography>
          </Divider>
          
          {/* Form */}
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
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="first_name"
                      label="First Name"
                      variant="filled"
                      value={values.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.first_name && Boolean(errors.first_name)}
                      helperText={touched.first_name && errors.first_name}
                      InputLabelProps={{ style: { color: colors.grey[300] } }}
                      InputProps={{ 
                        style: { 
                          color: colors.grey[100],
                          backgroundColor: colors.primary[600]
                        } 
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[600],
                          "&:hover": {
                            backgroundColor: colors.primary[500],
                          },
                          "&.Mui-focused": {
                            backgroundColor: colors.primary[500],
                          }
                        },
                        "& .MuiFormHelperText-root": {
                          color: colors.redAccent[400]
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="last_name"
                      label="Last Name"
                      variant="filled"
                      value={values.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.last_name && Boolean(errors.last_name)}
                      helperText={touched.last_name && errors.last_name}
                      InputLabelProps={{ style: { color: colors.grey[300] } }}
                      InputProps={{ 
                        style: { 
                          color: colors.grey[100],
                          backgroundColor: colors.primary[600]
                        } 
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[600],
                          "&:hover": {
                            backgroundColor: colors.primary[500],
                          },
                          "&.Mui-focused": {
                            backgroundColor: colors.primary[500],
                          }
                        },
                        "& .MuiFormHelperText-root": {
                          color: colors.redAccent[400]
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="email"
                      label="Email"
                      variant="filled"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      InputLabelProps={{ style: { color: colors.grey[300] } }}
                      InputProps={{ 
                        style: { 
                          color: colors.grey[100],
                          backgroundColor: colors.primary[600]
                        } 
                      }}
                      sx={{
                        "& .MuiFilledInput-root": {
                          backgroundColor: colors.primary[600],
                          "&:hover": {
                            backgroundColor: colors.primary[500],
                          },
                          "&.Mui-focused": {
                            backgroundColor: colors.primary[500],
                          }
                        },
                        "& .MuiFormHelperText-root": {
                          color: colors.redAccent[400]
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{
                          backgroundColor: colors.blueAccent[600],
                          color: colors.grey[100],
                          fontSize: "14px",
                          fontWeight: "bold",
                          padding: "10px 20px",
                          "&:hover": {
                            backgroundColor: colors.blueAccent[500],
                          },
                        }}
                      >
                        Update Profile
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Paper>
    </Container>
  );
}