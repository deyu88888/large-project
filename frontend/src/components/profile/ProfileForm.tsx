// Refactored
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { apiClient, apiPaths } from "../../api";
import { User } from "../../types/user/user";
import { tokens } from "../../theme/theme";
import React from "react";

interface SnackbarData {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface ProfileFormProps {
  user: User;
  isDark: boolean;
  colors: ReturnType<typeof tokens>;
  sendOTP: (email: string) => Promise<void>;
  otpSent: boolean;
  otpMessage: string;
  setOtpSent: (v: boolean) => void;
  setOtpMessage: (v: string) => void;
  emailVerified: boolean;
  setEmailVerified: (v: boolean) => void;
  setSnackbarData: (data: SnackbarData) => void;
}

const validationSchema = Yup.object().shape({
  first_name: Yup.string()
    .required("First name is required.")
    .matches(/^[A-Za-z]+$/, "Shouldn't contain numbers or special characters.")
    .max(50, "First name is too long."),
  last_name: Yup.string()
    .required("Last name is required.")
    .matches(/^[A-Za-z]+$/, "Shouldn't contain numbers or special characters.")
    .max(50, "Last name is too long."),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required.")
    .max(50, "Email too long.")
    .min(6, "Email too short.")
    .test("is-kcl", "Email must end with @kcl.ac.uk", (value) =>
      value ? value.toLowerCase().endsWith("@kcl.ac.uk") : false
    ),
});

export default function ProfileForm({
  user,
  isDark,
  colors,
  sendOTP,
  otpSent,
  otpMessage,
  setOtpSent,
  setOtpMessage,
  emailVerified,
  setEmailVerified,
  setSnackbarData,
}: ProfileFormProps) {
  return (
    <Formik
      initialValues={{
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
        otp: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await apiClient.put(apiPaths.USER.CURRENT, {
            first_name:
              user.first_name === values.first_name
                ? undefined
                : values.first_name,
            last_name:
              user.last_name === values.last_name
                ? undefined
                : values.last_name,
            username:
              user.username === values.username ? undefined : values.username,
            email: user.email === values.email ? undefined : values.email,
            role: user.role === values.role ? undefined : values.role,
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
          console.error("Update failed:", err);
          setSnackbarData({
            open: true,
            message: "Profile update failed.",
            severity: "error",
          });
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
            await apiClient.post("/api/verification/verify-otp", {
              email,
              otp,
            });
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
            <Divider
              sx={{
                my: 3,
                "&::before, &::after": { borderColor: colors.grey[500] },
                color: colors.grey[100],
              }}
            >
              <Typography variant="h5">Update Profile</Typography>
            </Divider>

            <Box
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{ maxWidth: 1000, mx: "auto", mt: 2 }}
            >
              {/* First Name */}
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
                    backgroundColor: isDark
                      ? colors.primary[600]
                      : colors.primary[0],
                  },
                }}
              />

              {/* Last Name */}
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
                    backgroundColor: isDark
                      ? colors.primary[600]
                      : colors.primary[0],
                  },
                }}
              />

              {/* Email */}
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
                  if (newEmail.toLowerCase() !== user.email.toLowerCase()) {
                    try {
                      const res = await apiClient.post(
                        "/api/verification/check-email",
                        { email: newEmail }
                      );
                      if (res.data.inUse) {
                        setFieldError(
                          "email",
                          "This email is already in use."
                        );
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
                    backgroundColor: isDark
                      ? colors.primary[600]
                      : colors.primary[0],
                  },
                }}
              />

              {/* OTP */}
              {values.email.toLowerCase() !== user.email.toLowerCase() && (
                <>
                  {!otpSent ? (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => sendOTP(values.email)}
                    >
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
                            backgroundColor: isDark
                              ? colors.primary[600]
                              : colors.primary[0],
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
                </>
              )}

              {/* Submit */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    isSubmitting ||
                    (values.email.toLowerCase() !==
                      user.email.toLowerCase() &&
                      !emailVerified)
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
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
}
