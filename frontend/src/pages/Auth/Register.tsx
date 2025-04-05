import { apiClient, apiPaths } from "../../api";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage, FormikProps } from "formik";
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
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  AlertColor,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { ErrorOutline, CheckCircle } from "@mui/icons-material";

const steps = ["Register", "Verification", "Your Details"];

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

type FormValues = typeof initialFormValues;

const initialFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  username: "",
  password: "",
  confirm_password: "",
  major: "",
  otp: "",
};

const stepOneSchema = Yup.object({
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
      (value): value is string =>
        typeof value === "string" && value.endsWith("@kcl.ac.uk")
    )
    .required("Email is required"),
});

const stepTwoSchema = Yup.object({
  otp: Yup.string()
    .matches(/^[0-9]{6}$/, "OTP must be 6 digits")
    .required("OTP is required"),
});

const stepThreeSchema = Yup.object({
  username: Yup.string()
    .min(6, "Username must be at least 6 characters")
    .max(30, "Username must be at most 30 characters")
    .matches(
      /^[a-zA-Z0-9_.-]+$/,
      "Username can only contain letters, numbers, and . - _"
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

const getValidationSchema = (step: number) => {
  switch (step) {
    case 0:
      return stepOneSchema;
    case 1:
      return stepTwoSchema;
    case 2:
      return stepThreeSchema;
    default:
      return Yup.object();
  }
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [activeStep, setActiveStep] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [isOtpRequesting, setIsOtpRequesting] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [timer, setTimer] = useState(60);
  const [snackbarData, setSnackbarData] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });
  const formikRef = useRef<FormikProps<FormValues> | null>(null);

  useEffect(() => {
    if (activeStep === 2 && formikRef.current) {
      formikRef.current.validateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const showSnackbar = useCallback(
    (message: string, severity: AlertColor = "error") => {
      setSnackbarData({ open: true, message, severity });
    },
    []
  );

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbarData((prev) => ({ ...prev, open: false }));
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (activeStep === 1 && resendDisabled && timer > 0) {
      intervalId = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer <= 0 && resendDisabled) {
      setResendDisabled(false);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeStep, resendDisabled, timer]);

  const handleRequestOTP = async (
    email: string,
    setFieldError: (field: string, message: string | undefined) => void
  ) => {
    setIsOtpRequesting(true);
    try {
      await apiClient.post(apiPaths.USER.REQUEST_OTP, { email });
      setVerifiedEmail(email);
      showSnackbar("Check your email for a one-time password.", "success");
      handleNext();
      setTimer(60);
      setResendDisabled(true);
    } catch (error: any) {
      console.error("Request OTP Error:", error);
      const errorMsg =
        error.response?.data?.error || "Error sending OTP. Please try again.";
      if (error.response?.data?.error)
        setFieldError("email", error.response.data.error);
      showSnackbar(errorMsg);
    } finally {
      setIsOtpRequesting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!verifiedEmail) {
      showSnackbar(
        "Cannot resend OTP without a verified email address.",
        "warning"
      );
      return;
    }
    setResendDisabled(true);
    setTimer(60);
    try {
      await apiClient.post(apiPaths.USER.REQUEST_OTP, { email: verifiedEmail });
      showSnackbar("New OTP sent. Check your email.", "success");
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      const errorMsg =
        error.response?.data?.error || "Error resending OTP. Please try again.";
      showSnackbar(errorMsg);
      setResendDisabled(false);
      setTimer(0);
    }
  };

  const handleVerifyOTP = async (
    otp: string,
    setFieldError: (field: string, message: string | undefined) => void
  ) => {
    if (!verifiedEmail) {
      showSnackbar("Email not found for verification.", "warning");
      return;
    }
    setIsOtpVerifying(true);
    try {
      await stepTwoSchema.validateSyncAt("otp", { otp });
      await apiClient.post(apiPaths.USER.VERIFY_OTP, {
        email: verifiedEmail,
        otp,
      });
      showSnackbar("OTP Verified!", "success");
      handleNext();
    } catch (error: any) {
      console.error("Verify OTP Error:", error);
      let errorMsg = "Error verifying OTP. Please try again.";
      if (error instanceof Yup.ValidationError) {
        errorMsg = error.message;
        setFieldError("otp", errorMsg);
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
        setFieldError("otp", errorMsg);
      }
      showSnackbar(errorMsg);
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const handleFinalSubmit = async (
    values: FormValues,
    {
      setFieldError,
    }: Pick<FormikProps<FormValues>, "setFieldError" | "setSubmitting">
  ) => {
    const registrationData = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: verifiedEmail,
      username: values.username,
      password: values.password,
      major: values.major,
      societies: [],
      president_of: null,
    };
    try {
      await apiClient.post(apiPaths.USER.REGISTER, registrationData);
      navigate("/login", { state: { registrationSuccess: true } });
    } catch (error: any) {
      console.error("Registration Submit Error:", error);
      if (error.response?.data) {
        const errors = error.response.data;
        let shownSnackbar = false;
        if (errors.email) {
          setFieldError("email", errors.email[0] || errors.email);
          showSnackbar(errors.email[0] || errors.email);
          shownSnackbar = true;
        }
        if (errors.username) {
          setFieldError("username", errors.username[0] || errors.username);
          showSnackbar(errors.username[0] || errors.username);
          shownSnackbar = true;
        }
        if (!shownSnackbar && errors.error) {
          showSnackbar(errors.error);
          shownSnackbar = true;
        }
        if (!shownSnackbar)
          showSnackbar("An unexpected registration error occurred.");
      } else {
        showSnackbar(
          "Could not connect to the server. Please check your network."
        );
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: colors.primary[400],
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          bgcolor: theme.palette.background.default,
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            color: colors.grey[100],
            mb: 3,
          }}
        >
          Register as a Student
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              {" "}
              <StepLabel>{label}</StepLabel>{" "}
            </Step>
          ))}
        </Stepper>

        <Formik
          innerRef={formikRef}
          initialValues={initialFormValues}
          validationSchema={getValidationSchema(activeStep)}
          validateOnChange={true}
          validateOnBlur={true}
          onSubmit={handleFinalSubmit}
        >
          {(formikProps) => {
            const {
              isSubmitting,
              values,
              errors,
              touched,
              isValid,
              setFieldError,
              dirty,
            } = formikProps;
            const isStep0Invalid =
              !!(errors.first_name && touched.first_name) ||
              !!(errors.last_name && touched.last_name) ||
              !!(errors.email && touched.email);
            const areStep0FieldsEmpty = !(
              values.first_name &&
              values.last_name &&
              values.email
            );

            return (
              <Form>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  {activeStep === 0 && (
                    <>
                      <Field
                        as={TextField}
                        fullWidth
                        name="first_name"
                        label="First name"
                        required
                        error={touched.first_name && !!errors.first_name}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="first_name">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Field
                        as={TextField}
                        fullWidth
                        name="last_name"
                        label="Last name"
                        required
                        error={touched.last_name && !!errors.last_name}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="last_name">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Field
                        as={TextField}
                        fullWidth
                        name="email"
                        label="Email"
                        type="email"
                        required
                        error={touched.email && !!errors.email}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{
                          style: { color: colors.grey[100] },
                          endAdornment: (
                            <InputAdornment position="end">
                              {touched.email && !errors.email ? (
                                <CheckCircle color="success" />
                              ) : touched.email && errors.email ? (
                                <ErrorOutline color="error" />
                              ) : null}
                            </InputAdornment>
                          ),
                        }}
                      />
                      <ErrorMessage name="email">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Button
                        variant="contained"
                        onClick={async () => {
                          const fieldsToValidate: (keyof FormValues)[] = [
                            "first_name",
                            "last_name",
                            "email",
                          ];
                          let stepIsValid = true;
                          for (const field of fieldsToValidate) {
                            try {
                              await stepOneSchema.validateSyncAt(field, values);
                              setFieldError(field, undefined);
                            } catch (err) {
                              if (err instanceof Yup.ValidationError)
                                setFieldError(field, err.message);
                              stepIsValid = false;
                            }
                          }
                          if (stepIsValid)
                            handleRequestOTP(values.email, setFieldError);
                          else
                            showSnackbar(
                              "Please fix the errors before proceeding.",
                              "warning"
                            );
                        }}
                        sx={{
                          bgcolor: colors.blueAccent[500],
                          color: "#fff",
                          "&:hover": { bgcolor: colors.blueAccent[700] },
                        }}
                        disabled={
                          isOtpRequesting ||
                          isStep0Invalid ||
                          areStep0FieldsEmpty
                        }
                      >
                        {isOtpRequesting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Get OTP"
                        )}
                      </Button>
                      <Typography
                        sx={{
                          mt: 2,
                          textAlign: "center",
                          color: colors.grey[100],
                        }}
                      >
                        Already signed up?{" "}
                        <Button
                          variant="text"
                          onClick={() => navigate("/login")}
                          sx={{
                            color: colors.blueAccent[300],
                            textTransform: "none",
                            p: 0,
                            "&:hover": { bgcolor: "transparent" },
                          }}
                        >
                          {" "}
                          Please login.{" "}
                        </Button>
                      </Typography>
                    </>
                  )}
                  {activeStep === 1 && (
                    <>
                      <Typography
                        variant="body1"
                        sx={{ color: colors.grey[200], textAlign: "center" }}
                      >
                        Enter the 6-digit code sent to {verifiedEmail}.
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="otp"
                        label="One-time Password"
                        required
                        inputProps={{
                          maxLength: 6,
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                        }}
                        error={touched.otp && !!errors.otp}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="otp">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Button
                        variant="contained"
                        onClick={() =>
                          handleVerifyOTP(values.otp, setFieldError)
                        }
                        sx={{
                          bgcolor: colors.blueAccent[500],
                          color: "#fff",
                          "&:hover": { bgcolor: colors.blueAccent[700] },
                        }}
                        disabled={isOtpVerifying || !values.otp || !!errors.otp}
                      >
                        {isOtpVerifying ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleResendOTP}
                        disabled={resendDisabled}
                        sx={{
                          color: resendDisabled
                            ? colors.grey[500]
                            : colors.blueAccent[300],
                          borderColor: resendDisabled
                            ? colors.grey[700]
                            : colors.blueAccent[300],
                          "&:hover": {
                            borderColor: colors.blueAccent[200],
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        {resendDisabled
                          ? `Resend OTP (${timer}s)`
                          : "Resend OTP"}
                      </Button>
                    </>
                  )}
                  {activeStep === 2 && (
                    <>
                      <Field
                        as={TextField}
                        fullWidth
                        name="username"
                        label="Username"
                        required
                        error={touched.username && !!errors.username}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="username">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Field
                        as={TextField}
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        required
                        error={touched.password && !!errors.password}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="password">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Field
                        as={TextField}
                        fullWidth
                        name="confirm_password"
                        label="Confirm Password"
                        type="password"
                        required
                        error={
                          touched.confirm_password && !!errors.confirm_password
                        }
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="confirm_password">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Field
                        as={TextField}
                        fullWidth
                        name="major"
                        label="Major"
                        required
                        error={touched.major && !!errors.major}
                        InputLabelProps={{ style: { color: colors.grey[300] } }}
                        InputProps={{ style: { color: colors.grey[100] } }}
                      />
                      <ErrorMessage name="major">
                        {(msg) => (
                          <Typography color="error.main" variant="caption">
                            {msg}
                          </Typography>
                        )}
                      </ErrorMessage>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{
                          bgcolor: colors.blueAccent[500],
                          color: "#fff",
                          "&:hover": { bgcolor: colors.blueAccent[700] },
                        }}
                        disabled={!isValid || !dirty || isSubmitting}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </>
                  )}
                </Box>
              </Form>
            );
          }}
        </Formik>
      </Box>
      <Snackbar
        open={snackbarData.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          key={snackbarData.message + snackbarData.severity}
          onClose={handleSnackbarClose}
          severity={snackbarData.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarData.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
