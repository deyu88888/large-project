import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    is_following?: boolean;
}

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
        .email("Invalid email address")
        .required("Email is required.")
        .max(50, "Too long email id.")
        .min(6, "Too short email id."),
});

export default function ProfilePage() {
    const { student_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const theme = useTheme();

    const [profile, setProfile] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const isSelf = user && (!student_id || String(user.id) === student_id);

    useEffect(() => {
    if (isSelf) {
      setProfile(user);
    } else {
      apiClient.get(`${apiPaths.USER.BASE}/${student_id}`)
        .then((res) => {
          setProfile(res.data);
          setIsFollowing(res.data.is_following || false);
        })
        .catch((err) => {
          console.error(err);
          setProfile(null);
        });
    }
    }, [student_id, user, isSelf]);

    const handleGoBack = () => {
    navigate(-1);
    };

    const handleToggleFollow = () => {
        if (!profile) return;

        apiClient.post(`/api/users/${profile.id}/follow`)
          .then((res) => {
            if (res.data.message === "Followed successfully.") {
              setIsFollowing(true);
            } else if (res.data.message === "Unfollowed successfully.") {
              setIsFollowing(false);
            }
          })
          .catch((err) => console.error(err));
      };


    if (!profile) {
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
          <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.secondary }}>
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
          {isSelf ? (
            <>
              <Typography
                variant="h3"
                sx={{
                  color: theme.palette.getContrastText(theme.palette.primary.main),
                }}
              >
                Welcome back, {profile.first_name}!
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
            </>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="h3"
                sx={{
                  color: theme.palette.getContrastText(theme.palette.primary.main),
                }}
              >
                {profile.first_name}'s Profile
              </Typography>

              <Button
                variant="contained"
                color={isFollowing ? "secondary" : "primary"}
                onClick={handleToggleFollow}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </Box>
          )}
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
                {profile.username}
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
                {profile.role}
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
                    bgcolor: profile.is_active
                      ? theme.palette.success.main
                      : theme.palette.grey[400],
                    mr: 1,
                  }}
                />
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {profile.is_active ? "Verified" : "Not Verified"}
                </Typography>
              </Box>
            </Paper>
          </Box>
          <Divider sx={{ mb: 4 }}>Profile Information</Divider>
          {isSelf ? (
            <Formik
              initialValues={{
                first_name: profile.first_name,
                last_name: profile.last_name,
                username: profile.username,
                email: profile.email,
                role: profile.role,
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                const res = await apiClient.put(apiPaths.USER.CURRENT, {
                  first_name:
                    profile.first_name === values.first_name
                      ? undefined
                      : values.first_name,
                  last_name:
                    profile.last_name === values.last_name
                      ? undefined
                      : values.last_name,
                  username:
                    profile.username === values.username
                      ? undefined
                      : values.username,
                  email: profile.email === values.email ? undefined : values.email,
                  role: profile.role === values.role ? undefined : values.role,
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
          ) : (
            <Box>
              <Typography variant="body1">
                First Name: {profile.first_name}
              </Typography>
              <Typography variant="body1">
                Last Name: {profile.last_name}
              </Typography>
              <Typography variant="body1">
                Email: {profile.email}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
    );
}

