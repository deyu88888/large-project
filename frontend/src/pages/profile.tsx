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
          <Avatar 
            sx={{ 
              bgcolor: colors.grey[900],
              color: colors.blueAccent[400],
              fontWeight: 'bold',
              width: 56,
              height: 56
            }}
          >
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
          <Box>
            <Typography variant="h4" color={colors.grey[100]}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body1" color={colors.grey[200]}>
              Manage your profile information
            </Typography>
          </Box>
        </Box>
        
        {/* User info cards */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: colors.primary[500]
                }}
              >
                <Typography variant="h6" color={colors.grey[300]} gutterBottom>
                  Username
                </Typography>
                <Typography variant="h5" color={colors.grey[100]}>
                  {user.username}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: colors.greenAccent[700]
                }}
              >
                <Typography variant="h6" color={colors.grey[900]} gutterBottom>
                  Role
                </Typography>
                <Typography variant="h5" color={colors.grey[100]}>
                  {user.role}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: user.isActive ? colors.blueAccent[700] : colors.grey[600]
                }}
              >
                <Typography variant="h6" color={user.isActive ? colors.grey[100] : colors.grey[300]} gutterBottom>
                  Status
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{
                    color: user.isActive ? colors.grey[100] : colors.grey[400],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      bgcolor: user.isActive ? colors.greenAccent[400] : colors.grey[500],
                      display: 'inline-block'
                    }}
                  />
                  {user.isActive ? "Verified" : "Not Verified"}
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
              first_name: user.firstName,
              last_name: user.lastName,
              username: user.username,
              email: user.email,
              role: user.role,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const res = await apiClient.put(apiPaths.USER.CURRENT, {
                  first_name:
                    user.firstName === values.first_name
                      ? undefined
                      : values.first_name,
                  last_name:
                    user.lastName === values.last_name ? undefined : values.last_name,
                  username:
                    user.username === values.username ? undefined : values.username,
                  email: user.email === values.email ? undefined : values.email,
                  role: user.role === values.role ? undefined : values.role,
                });
                console.log(res);
              } catch (error) {
                console.error("Error updating profile:", error);
              } finally {
                setSubmitting(false);
              }
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