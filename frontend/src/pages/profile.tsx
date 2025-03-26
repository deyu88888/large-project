import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { apiClient, apiPaths } from "../api";
import { tokens } from "../theme/theme";
import { FaTrophy } from "react-icons/fa";

import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
    Container, Box, Paper, Typography, Button,
    Divider, TextField, Avatar, Grid,
    InputAdornment, IconButton, Snackbar, Alert,
} from "@mui/material";
import {User} from "../types/user/user"

interface AwardAssignment {
  id: number;
  award: {
    title: string;
    description: string;
    rank: string;
  };
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
    .min(6, "Too short email id.")
    .test("is-kcl", "Email must end with @kcl.ac.uk", (value) =>
      value ? value.toLowerCase().endsWith("@kcl.ac.uk") : false
    )
});

export default function ProfilePage() {
  const { student_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const [profile, setProfile] = useState<User | null>(null);
  const [awards, setAwards] = useState<AwardAssignment[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const isSelf = user && (!student_id || String(user.id) === student_id);

  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleShowCurrentPassword = () => setShowCurrentPassword((prev) => !prev);
  const toggleShowNewPassword = () => setShowNewPassword((prev) => !prev);
  const toggleShowConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

  const [snackbarData, setSnackbarData] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackbarClose = () => {
    setSnackbarData((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (isSelf) {
      setProfile(user);
      fetchAwards();
    } else {
      apiClient
        .get(`${apiPaths.USER.BASE}/${student_id}`)
        .then((res) => {
          setProfile(res.data);
          setIsFollowing(res.data.is_following || false);
          fetchAwards(res.data.id);
        })
        .catch((err) => {
          console.error(err);
          setProfile(null);
        });
    }
  }, [student_id, user, isSelf]);

  async function fetchAwards(student_id: number = -1) {
    let awardsResponse;
    try {
      if (student_id === -1) {
        awardsResponse = await apiClient.get("/api/awards/students/");
      } else {
        awardsResponse = await apiClient.get("/api/awards/students/" + student_id);
      }
      setAwards(awardsResponse.data);
    } catch (error) {
      console.error(error);
    }
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleToggleFollow = () => {
    if (!profile) return;
    apiClient
      .post(`/api/users/${profile.id}/follow`)
      .then((res) => {
        if (res.data.message === "Followed successfully.") {
          setIsFollowing(true);
        } else if (res.data.message === "Unfollowed successfully.") {
          setIsFollowing(false);
        }
      })
      .catch((err) => console.error(err));
  };

  const sendOTP = async (email: string) => {
    try {
      await apiClient.post("/api/verification/request-otp", { email });
      setOtpSent(true);
      setOtpMessage("OTP sent to your email.");
    } catch (error) {
      setOtpMessage("Failed to send OTP.");
      console.error("OTP send error:", error);
    }
  };

  if (isSelf && !user) {
    return <p>Loading user info...</p>;
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
          Back
        </Button>
        <Paper elevation={2} sx={{ p: 4, textAlign: "center", backgroundColor: colors.primary[400] }}>
          <Avatar sx={{ width: 64, height: 64, mx: "auto", bgcolor: colors.blueAccent[500], color: colors.grey[100] }}>
            ?
          </Avatar>
          <Typography variant="h6" sx={{ mt: 2, color: colors.grey[100] }}>
            No user found
          </Typography>
        </Paper>
      </Container>
    );
  }
  const avatarSrc = profile.icon?.startsWith("/api")
    ? profile.icon
    : profile.icon
    ? `${profile.icon}`
    : undefined;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{ mb: 3, color: colors.grey[100], borderColor: colors.grey[400] }}
      >
        Back
      </Button>

      <Paper
        elevation={2}
        sx={{
          mb: 4,
          overflow: "hidden",
          backgroundColor: colors.primary[400],
          borderRadius: 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            backgroundColor: colors.blueAccent[700],
            color: colors.grey[100],
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar src={avatarSrc} sx={{ width: 64, height: 64 }} />
          {isSelf ? (
            <Box>
              <Typography
                variant="h4"
                sx={{ color: theme.palette.getContrastText(theme.palette.primary.main) }}
              >
                Welcome back, {profile.first_name}!
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ mt: 1, color: theme.palette.getContrastText(theme.palette.primary.main) }}
              >
                Manage your profile information below
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="h4"
                sx={{ color: theme.palette.getContrastText(theme.palette.primary.main) }}
              >
                {profile.first_name}'s Profile
              </Typography>
              <Button variant="contained" color={isFollowing ? "secondary" : "primary"} onClick={handleToggleFollow}>
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </Box>
          )}
        </Box>

        {/* Static Info */}
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
              <Typography variant="caption" sx={{ textTransform: "uppercase", color: theme.palette.text.secondary }}>
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
              <Typography variant="caption" sx={{ textTransform: "uppercase", color: theme.palette.text.secondary }}>
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
              <Typography variant="caption" sx={{ textTransform: "uppercase", color: theme.palette.text.secondary }}>
                Status
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: profile.is_active ? theme.palette.success.main : theme.palette.grey[400],
                    mr: 1,
                  }}
                />
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {profile.is_active ? "Verified" : "Not Verified"}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {isSelf && (
            <>
              {/* Divider for Profile Information */}
              <Divider
                sx={{
                  my: 3,
                  "&::before, &::after": { borderColor: colors.grey[500] },
                  color: colors.grey[100],
                }}
              >
                <Typography variant="h5">Update Profile</Typography>
              </Divider>
              {/* Profile Update Form */}
              <Formik
                initialValues={{
                  first_name: user?.first_name || "",
                  last_name: user?.last_name || "",
                  username: user?.username || "",
                  email: user?.email || "",
                  role: user?.role || "",
                  otp: "",
                }}
                validationSchema={validationSchema}
                context={{ currentEmail: user?.email }}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    await apiClient.put(apiPaths.USER.CURRENT, {
                      first_name: user?.first_name === values.first_name ? undefined : values.first_name,
                      last_name: user?.last_name === values.last_name ? undefined : values.last_name,
                      username: user?.username === values.username ? undefined : values.username,
                      email: user?.email === values.email ? undefined : values.email,
                      role: user?.role === values.role ? undefined : values.role,
                    });
                    setSnackbarData({
                      open: true,
                      message: "Profile updated successfully!",
                      severity: "success",
                    });
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } catch (err) {
                    setSnackbarData({
                      open: true,
                      message: "Profile update failed.",
                      severity: "error",
                    });
                    console.error("Update failed:", err);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {(formik) => {
                  const {
                    values,
                    handleChange,
                    handleBlur,
                    isSubmitting,
                    errors,
                    touched,
                    setFieldError,
                    setFieldValue,
                  } = formik;

                  const verifyOTP = async (email: string, otp: string) => {
                    try {
                      await apiClient.post("/api/verification/verify-otp", { email, otp });
                      setEmailVerified(true);
                      setOtpSent(false);
                      setOtpMessage("");
                      setFieldValue("otp", "");
                      setSnackbarData({
                        open: true,
                        message: "Email verified successfully!",
                        severity: "success",
                      });
                    } catch (error) {
                      setEmailVerified(false);
                      setSnackbarData({
                        open: true,
                        message: "OTP verification failed.",
                        severity: "error",
                      });
                      console.error("OTP verification failed:", error);
                    }
                  };

                  return (
                    <Form>
                      <Grid container spacing={3}>
                        {/* First Name */}
                        <Grid item xs={12}>
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
                                backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                              },
                            }}
                            sx={{
                              "& .MuiFormHelperText-root": {
                                color: isDark ? colors.redAccent[400] : colors.primary[0],
                              },
                            }}
                          />
                        </Grid>

                        {/* Last Name */}
                        <Grid item xs={12}>
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
                                backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                              },
                            }}
                            sx={{
                              "& .MuiFormHelperText-root": {
                                color: isDark ? colors.redAccent[400] : colors.primary[0],
                              },
                            }}
                          />
                        </Grid>

                        {/* Email */}
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            name="email"
                            label="Email"
                            variant="filled"
                            value={values.email}
                            onChange={(e) => {
                              handleChange(e);
                              setOtpSent(false);
                              setOtpMessage("");
                              setEmailVerified(false);
                            }}
                            onBlur={async (e) => {
                              handleBlur(e);
                              const newEmail = e.target.value;
                              if (newEmail.toLowerCase() !== user?.email.toLowerCase()) {
                                try {
                                  const res = await apiClient.post("/api/verification/check-email", { email: newEmail });
                                  if (res.data.inUse) {
                                    setFieldError("email", "This email is already in use.");
                                  }
                                } catch (err) {
                                  setFieldError("email", "Unable to verify email.");
                                  console.error(err);
                                }
                              }
                            }}
                            error={touched.email && Boolean(errors.email)}
                            helperText={touched.email && errors.email}
                            InputLabelProps={{ style: { color: colors.grey[300] } }}
                            InputProps={{
                              style: {
                                color: colors.grey[100],
                                backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                              },
                            }}
                            sx={{
                              "& .MuiFormHelperText-root": {
                                color: isDark ? colors.redAccent[400] : colors.primary[0],
                              },
                            }}
                          />
                        </Grid>

                        {/* OTP */}
                        {values.email.toLowerCase() !== user?.email.toLowerCase() && (
                          <Grid item xs={12}>
                            {!otpSent ? (
                              <Button variant="outlined" color="secondary" onClick={() => sendOTP(values.email)}>
                                Send OTP
                              </Button>
                            ) : (
                              <>
                                <TextField
                                  fullWidth
                                  name="otp"
                                  label="Enter OTP"
                                  variant="filled"
                                  value={values.otp || ""}
                                  onChange={handleChange}
                                  InputLabelProps={{ style: { color: colors.grey[300] } }}
                                  InputProps={{
                                    style: {
                                      color: colors.grey[100],
                                      backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                                    },
                                  }}
                                  sx={{ mt: 1 }}
                                />
                                {otpMessage && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {otpMessage}
                                  </Typography>
                                )}
                                <Button
                                  variant="contained"
                                  sx={{ mt: 1 }}
                                  onClick={() => verifyOTP(values.email, values.otp)}
                                >
                                  Verify Email
                                </Button>
                              </>
                            )}
                          </Grid>
                        )}

                        {/* Submit Button */}
                        <Grid item xs={12}>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              type="submit"
                              variant="contained"
                              disabled={
                                isSubmitting ||
                                (values.email.toLowerCase() !== user?.email.toLowerCase() && !emailVerified)
                              }
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
                  );
                }}
              </Formik>


              {/* Divider for Update Password Section */}
              <Divider
                sx={{
                  my: 3,
                  "&::before, &::after": { borderColor: colors.grey[500] },
                  color: colors.grey[100],
                }}
              >
                <Typography variant="h5">Update Password</Typography>
              </Divider>

              {/* Update Password Form */}
              <Formik
                initialValues={{
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                }}
                validationSchema={Yup.object({
                  currentPassword: Yup.string().required("Must enter current password"),
                  newPassword: Yup.string()
                    .min(8, "New password at lease have 8 characters")
                    .required("Must enter new password"),
                  confirmPassword: Yup.string()
                    .oneOf([Yup.ref("newPassword"), null], "New password and confirm password do not match")
                    .required("Please confirm new password"),
                })}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                  try {
                    await apiClient.put('api/users/password', {
                      current_password: values.currentPassword,
                      new_password: values.newPassword,
                      confirm_password: values.confirmPassword
                    });
                    resetForm();
                    setSnackbarData({
                      open: true,
                      message: "Password updated successfully!",
                      severity: "success",
                    });
                  } catch (err) {
                    setSnackbarData({
                      open: true,
                      message: "Failed to update password.",
                      severity: "error",
                    });
                    console.error("Failed to update password", err);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
                  <Form>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="currentPassword"
                          label="Current Password"
                          variant="filled"
                          type={showCurrentPassword ? "text" : "password"}
                          value={values.currentPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.currentPassword && Boolean(errors.currentPassword)}
                          helperText={touched.currentPassword && errors.currentPassword}
                          InputLabelProps={{ style: { color: colors.grey[300] } }}
                          InputProps={{
                            style: {
                              color: colors.grey[100],
                              backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                            },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={toggleShowCurrentPassword} edge="end">
                                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="newPassword"
                          label="New Password"
                          variant="filled"
                          type={showNewPassword ? "text" : "password"}
                          value={values.newPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.newPassword && Boolean(errors.newPassword)}
                          helperText={touched.newPassword && errors.newPassword}
                          InputLabelProps={{ style: { color: colors.grey[300] } }}
                          InputProps={{
                            style: {
                              color: colors.grey[100],
                              backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                            },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={toggleShowNewPassword} edge="end">
                                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          variant="filled"
                          type={showConfirmPassword ? "text" : "password"}
                          value={values.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                          helperText={touched.confirmPassword && errors.confirmPassword}
                          InputLabelProps={{ style: { color: colors.grey[300] } }}
                          InputProps={{
                            style: {
                              color: colors.grey[100],
                              backgroundColor: isDark ? colors.primary[600] : colors.primary[0],
                            },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={toggleShowConfirmPassword} edge="end">
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                            Update Password
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Form>
                )}
              </Formik>
            </>
          )}

          {/* Awards Section */}
          <Divider
            sx={{
              my: 3,
              "&::before, &::after": { borderColor: colors.grey[500] },
              color: colors.grey[100],
            }}
          >
            <Typography variant="h5">Awards & Achievements</Typography>
          </Divider>

          {awards.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" sx={{ color: colors.grey[300] }}>
                {isSelf ? "You haven't earned any awards yet" : "This user hasn't earned any awards yet"}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                {awards.map((award) => (
                  <Grid item xs={12} sm={6} md={4} key={award.id}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        height: "100%",
                        backgroundColor: colors.primary[500],
                        borderRadius: 2,
                        borderLeft: `4px solid ${
                          award.award.rank === "Gold"
                            ? "#FFD700"
                            : award.award.rank === "Silver"
                              ? "#C0C0C0"
                              : "#CD7F32"
                        }`,
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "translateY(-5px)",
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <FaTrophy
                          size={24}
                          style={{
                            marginRight: 12,
                            color:
                              award.award.rank === "Gold"
                                ? "#FFD700"
                                : award.award.rank === "Silver"
                                  ? "#C0C0C0"
                                  : "#CD7F32",
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            color: colors.grey[100],
                            fontWeight: "bold",
                          }}
                        >
                          {award.award.title}
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: colors.grey[300],
                          mb: 1,
                          display: "inline-block",
                          backgroundColor: award.award.rank === "Gold"
                            ? "rgba(255, 215, 0, 0.1)"
                            : award.award.rank === "Silver"
                              ? "rgba(192, 192, 192, 0.1)"
                              : "rgba(205, 127, 50, 0.1)",
                          px: 1,
                          py: 0.5,
                          borderRadius: "4px",
                        }}
                      >
                        {award.award.rank} Award
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.grey[300], mt: 1 }}>
                        {award.award.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        <Snackbar
          open={snackbarData.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarData.severity} sx={{ width: "100%" }}>
            {snackbarData.message}
          </Alert>
        </Snackbar>

      </Paper>
    </Container>
  );
}
