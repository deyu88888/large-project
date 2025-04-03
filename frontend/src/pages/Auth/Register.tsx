// Refactored
import { apiClient, apiPaths } from "../../api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../../components/loading/CircularLoader";
import { Formik, Form, ErrorMessage } from "formik";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import * as Yup from "yup";
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  InputAdornment,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { ErrorOutline, CheckCircle } from "@mui/icons-material";

const steps = ["Register", "Verification", "Your Details"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [timer, setTimer] = useState(60);
  const [snackbarData, setSnackbarData] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const handleSnackbarClose = () => {
    setSnackbarData({ ...snackbarData, open: false });
  };
  const handleNext = () => setActiveStep((prev) => prev + 1);

  // Validation schema using Yup
  const getValidationSchema = (activeStep: number) => {
    switch (activeStep) {
      case 0:
        return Yup.object({
          first_name: Yup.string()
            .max(50, "First name must be at most 50 characters")
            .required("First name is required"),
          last_name: Yup.string()
            .max(50, "Last name must be at most 50 characters")
            .required("Last name is required"),
          email: Yup.string()
            .email("Invalid email address")
            .test(
              "is-kcl-email",
              "Email must end with @kcl.ac.uk",
              (value) => value?.endsWith("@kcl.ac.uk") ?? false
            )
            .required("Email is required"),
        });
      case 1:
        return Yup.object({
          otp: Yup.string().required("OTP is required"),
        });
      case 2:
        return Yup.object({
          username: Yup.string()
            .min(6, "Username must be at least 6 characters")
            .max(30, "Username must be at most 30 characters")
            .matches(
              /^[a-zA-Z0-9_.-]+$/,
              "Username must only contain letters, numbers, underscores, hyphens, and dots"
            )
            .required("Username is required"),
          password: Yup.string()
            .min(8, "Password must be at least 8 characters")
            .required("Password is required"),
          confirm_password: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords do not match")
            .required("Please confirm your password"),
          major: Yup.string()
            .max(50, "Major must be at most 50 characters")
            .required("Major is required"),
        });
      default:
        return Yup.object();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }

    return () => clearInterval(interval);
  }, [resendDisabled, timer]);

  const handleRequestOTP = async (email: string, setFieldError: any) => {
    try {
      const res = await apiClient.post(apiPaths.USER.REQUEST_OTP, { email });
      console.log(res);
      setOtpSent(true);
      setEmail(email);
      setSnackbarData({
        open: true,
        message: "Check your email for a one-time password.",
        severity: "success",
      });
      handleNext();
      setResendDisabled(true);
      setTimer(60);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setFieldError("email", error.response.data.error);
      } else {
        alert("Error sending OTP. Please try again.");
      }
    }
  };

  const handleResendOTP = async () => {
    setResendDisabled(true);
    setTimer(60);

    try {
      const res = await apiClient.post(apiPaths.USER.REQUEST_OTP, { email });
      console.log(res);
      setSnackbarData({
        open: true,
        message: "Check your email for a one-time password.",
        severity: "success",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleVerifyOTP = async (email: string, otp: string) => {
    try {
      const res = await apiClient.post(apiPaths.USER.VERIFY_OTP, {
        email,
        otp,
      });
      console.log(res);
      handleNext();
    } catch (error: any) {
      if (error.response?.data?.error) {
        setSnackbarData({
          open: true,
          message: error.response.data.error,
          severity: "error",
        });
      } else {
        setSnackbarData({
          open: true,
          message: "Error verifying OTP. Please try again.",
          severity: "error",
        });
      }
    }
  };

  const handleSubmit = async (
    values: any,
    { setSubmitting, setFieldError }: any
  ) => {
    if (values.email !== email) {
      setFieldError("email", "Email must match the one used for OTP.");
      return;
    }
    try {
      const { otp, ...userData } = values;

      const res = await apiClient.post(apiPaths.USER.REGISTER, {
        ...userData,
        societies: [],
        president_of: null,
      });
      console.log(res);
      navigate("/login");
    } catch (error: any) {
      if (error.response?.data?.email) {
        setFieldError("email", error.response.data.email[0]);
      } else if (error.response?.data?.username) {
        setFieldError("username", error.response.data.username[0]);
      } else if (
        error.response?.data?.error &&
        error.response.data.error.includes("already registered")
      ) {
        setSnackbarData({
          open: true,
          message: "This email is already registered. Please log in.",
          severity: "error",
        });
      } else {
        setSnackbarData({
          open: true,
          message: "An unexpected error occurred. Please try again.",
          severity: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primary[400],
        padding: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : theme.palette.background.default,
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            color: colors.grey[100],
          }}
        >
          Register as a Student
        </Typography>
        <Stepper activeStep={activeStep} sx={{ p: 2.5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Formik
          initialValues={{
            first_name: "",
            last_name: "",
            email: "",
            username: "",
            password: "",
            confirm_password: "",
            major: "",
            otp: "",
          }}
          validationSchema={getValidationSchema(activeStep)}
          onSubmit={handleSubmit}
        >
          {({
            isSubmitting,
            handleChange,
            setFieldError,
            values,
            errors,
            handleBlur,
            isValid,
            dirty,
          }) => (
            <Form className="grid grid-cols-1 gap-6">
              {activeStep === 0 && (
                <>
                  <TextField
                    fullWidth
                    id="first_name"
                    name="first_name"
                    label="First name"
                    value={values.first_name}
                    onChange={handleChange}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={{ style: { color: colors.grey[100] } } as any}
                  />
                  <ErrorMessage
                    name="first_name"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <TextField
                    fullWidth
                    id="last_name"
                    name="last_name"
                    label="Last name"
                    value={values.last_name}
                    onChange={handleChange}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={{ style: { color: colors.grey[100] } } as any}
                  />
                  <ErrorMessage
                    name="last_name"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={
                      {
                        style: { color: colors.grey[100] },
                        endAdornment: (
                          <InputAdornment position="end">
                            {values.email && !errors.email ? (
                              <CheckCircle sx={{ color: "green" }} />
                            ) : (
                              values.email && (
                                <ErrorOutline sx={{ color: "red" }} />
                              )
                            )}
                          </InputAdornment>
                        ),
                      } as any
                    }
                  />
                  <ErrorMessage name="email">
                    {(msg: any) => (
                      <Typography
                        sx={{ color: "red", fontSize: "0.85rem", mt: 0.5 }}
                      >
                        {msg}
                      </Typography>
                    )}
                  </ErrorMessage>

                  <Button
                    variant="contained"
                    onClick={() =>
                      handleRequestOTP(values.email, setFieldError)
                    }
                    sx={{
                      backgroundColor: colors.blueAccent[500],
                      color: "#fff",
                      "&:hover": { backgroundColor: colors.blueAccent[700] },
                    }}
                    disabled={otpSent || !isValid || !dirty}
                  >
                    {otpSent ? "OTP Sent" : "Get OTP"}
                  </Button>
                  <Typography
                    sx={{
                      marginTop: 2,
                      textAlign: "center",
                      color: colors.grey[100],
                    }}
                  >
                    Already signed up?{" "}
                    <a
                      href="/login"
                      style={{
                        color: colors.blueAccent[300],
                        textDecoration: "underline",
                      }}
                    >
                      Please login.
                    </a>
                  </Typography>
                </>
              )}
              {activeStep === 1 && (
                <>
                  <TextField
                    fullWidth
                    id="otp"
                    name="otp"
                    label="One-time Password"
                    value={values.otp}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <ErrorMessage
                    name="otp"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <Button
                    variant="contained"
                    onClick={() => handleVerifyOTP(values.email, values.otp)}
                    sx={{
                      backgroundColor: colors.blueAccent[500],
                      color: "#fff",
                      "&:hover": { backgroundColor: colors.blueAccent[700] },
                    }}
                  >
                    Verify OTP
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleResendOTP}
                    disabled={resendDisabled}
                    sx={{
                      color: resendDisabled
                        ? colors.grey[500]
                        : colors.blueAccent[500],
                      borderColor: resendDisabled
                        ? colors.grey[500]
                        : colors.blueAccent[500],
                    }}
                  >
                    {resendDisabled ? `Resend OTP (${timer}s)` : "Resend OTP"}
                  </Button>
                </>
              )}

              {activeStep === 2 && (
                <>
                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    label="Username"
                    value={values.username}
                    onChange={handleChange}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={{ style: { color: colors.grey[100] } } as any}
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Pasword"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={
                      {
                        style: { color: colors.grey[100] },
                        endAdornment: (
                          <InputAdornment position="end">
                            {values.password && !errors.password ? (
                              <CheckCircle sx={{ color: "green" }} />
                            ) : (
                              values.password && (
                                <ErrorOutline sx={{ color: "red" }} />
                              )
                            )}
                          </InputAdornment>
                        ),
                      } as any
                    }
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <TextField
                    fullWidth
                    id="confirm_password"
                    name="confirm_password"
                    label="Confirm Password"
                    type="password"
                    value={values.confirm_password}
                    onChange={handleChange}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={
                      {
                        style: { color: colors.grey[100] },
                        endAdornment: (
                          <InputAdornment position="end">
                            {values.confirm_password &&
                            values.confirm_password === values.password ? (
                              <CheckCircle sx={{ color: "green" }} />
                            ) : (
                              values.confirm_password && (
                                <ErrorOutline sx={{ color: "red" }} />
                              )
                            )}
                          </InputAdornment>
                        ),
                      } as any
                    }
                  />
                  <ErrorMessage
                    name="confirm_password"
                    component="div"
                    className="text-red-500 text-sm"
                  />

                  <TextField
                    fullWidth
                    id="major"
                    name="major"
                    label="Major"
                    value={values.major}
                    onChange={handleChange}
                    InputLabelProps={{ style: { color: colors.grey[300] } }}
                    InputProps={{ style: { color: colors.grey[100] } } as any}
                  />
                  <ErrorMessage
                    name="major"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                  {isSubmitting && (
                    <div className="flex justify-center mt-4">
                      <CircularLoader />
                    </div>
                  )}
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    sx={{
                      backgroundColor: colors.blueAccent[500],
                      color: "#fff",
                      "&:hover": { backgroundColor: colors.blueAccent[700] },
                    }}
                    disabled={!isValid || !dirty}
                  >
                    {loading ? <CircularProgress size={24} /> : "Register"}
                  </Button>
                </>
              )}
            </Form>
          )}
        </Formik>
      </Box>
      {/* Snackbar for OTP Message and error message */}
      <Snackbar
        open={snackbarData.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
  
        <Alert onClose={handleSnackbarClose} severity={snackbarData.severity}>
          {snackbarData.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
