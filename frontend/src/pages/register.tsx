import { apiClient, apiPaths } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../components/loading/circular-loader";
import { Formik, Form, ErrorMessage } from "formik";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
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
  } from "@mui/material";
  import { tokens } from "../theme/theme";


const steps = ["Register", "Verification", "Your Details"];

export default function RegisterPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    const handleCloseSnackbar = () => setSnackbarOpen(false);
    const handleNext = () => setActiveStep((prev) => prev + 1);


    // Validation schema using Yup
    const validationSchema = Yup.object({
        first_name: Yup.string()
            .max(50, "First name must be at most 50 characters")
            .required("First name is required"),
        last_name: Yup.string()
            .max(50, "Last name must be at most 50 characters")
            .required("Last name is required"),
        email: Yup.string()
            .email("Invalid email address")
            .required("Email is required"),
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
        major: Yup.string()
            .max(50, "Major must be at most 50 characters")
            .required("Major is required"),
    });

    const handleRequestOTP = async (email: string, setFieldError: any) => {
        try {
            const res = await apiClient.post(apiPaths.USER.REQUEST_OTP, { email });
            console.log(res);
            setOtpSent(true);
            setEmail(email);
            setSnackbarOpen(true);
            handleNext();
        } catch (error: any) {
            if (error.response?.data?.error) {
                setFieldError("email", error.response.data.error);
            } else {
                alert("Error sending OTP. Please try again.");
            }
        }
    };

    const handleVerifyOTP = async (email: string, otp: string, setFieldError: any) => {
        try {
          const res = await apiClient.post(apiPaths.USER.VERIFY_OTP, { email, otp });
          console.log(res);
          handleNext();
        } catch (error: any) {
          if (error.response?.data?.error) {
            setFieldError("otp", error.response.data.error);
          } else {
            setFieldError("otp", "Error verifying OTP. Please try again.");
          }
        }
      };

    const handleSubmit = async (values: any, { setSubmitting, setFieldError }: any) => {
        if (values.email !== email) {
            setFieldError("email", "Email must match the one used for OTP.");
            return;
        }
        try {
            const res = await apiClient.post(apiPaths.USER.REGISTER, {
                ...values,
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
            } else {
                alert("Error during registration. Please try again.");
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
                sx={{ textAlign: "center", fontWeight: "bold", color: colors.grey[100] }}
                >
                Register as a Student
            </Typography>
            <Stepper activeStep={activeStep} sx={{p: 2.5}}>
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
                        major: "",
                        otp: "",
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting,  handleChange, setFieldError, values }) => (
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
                                InputProps={{ style: { color: colors.grey[100] } }}
                            />
                                <ErrorMessage name="first_name" component="div" className="text-red-500 text-sm"/>

                            <TextField
                                fullWidth
                                id="last_name"
                                name="last_name"
                                label="Last name"
                                value={values.last_name}
                                onChange={handleChange}
                                InputLabelProps={{ style: { color: colors.grey[300] } }}
                                InputProps={{ style: { color: colors.grey[100] } }}
                            />
                            <ErrorMessage name="last_name" component="div" className="text-red-500 text-sm"/>

                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email"
                                value={values.email}
                                onChange={handleChange}
                                InputLabelProps={{ style: { color: colors.grey[300] } }}
                                InputProps={{ style: { color: colors.grey[100] } }}
                            />
                            <ErrorMessage name="email" component="div" className="text-red-500 text-sm"/>
                            <Button
                                variant="contained"
                                onClick={() => handleRequestOTP(values.email, setFieldError)}
                                sx={{
                                    backgroundColor: colors.blueAccent[500],
                                    color: "#fff",
                                    "&:hover": { backgroundColor: colors.blueAccent[700] },
                                  }}
                                disabled={otpSent}
                            >
                                {otpSent ? "OTP Sent" : "Get OTP"}
                            </Button>
                            <Typography sx={{ marginTop: 2, textAlign: "center", color: colors.grey[100] }}>
                                Already signed up?{" "}
                                <a href="/login" style={{ color: colors.blueAccent[300], textDecoration: "underline" }}>
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
                                label="Temporary password"
                                value={values.otp}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="otp" component="div" className="text-red-500 text-sm" />

                                <Button
                                variant="contained"
                                onClick={() => handleVerifyOTP(values.email, values.otp, setFieldError)}
                                sx={{
                                    backgroundColor: colors.blueAccent[500],
                                    color: "#fff",
                                    "&:hover": { backgroundColor: colors.blueAccent[700] },
                                  }}
                                >
                                Verify OTP
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
                                InputProps={{ style: { color: colors.grey[100] } }}
                            />
                            <ErrorMessage name="username" component="div" className="text-red-500 text-sm"/>

                            <TextField
                                fullWidth
                                id="password"
                                name="password"
                                label="Pasword"
                                value={values.password}
                                onChange={handleChange}
                                InputLabelProps={{ style: { color: colors.grey[300] } }}
                                InputProps={{ style: { color: colors.grey[100] } }}
                            />
                            <ErrorMessage name="password" component="div" className="text-red-500 text-sm"/>

                            <TextField
                                fullWidth
                                id="major"
                                name="major"
                                label="Major"
                                value={values.major}
                                onChange={handleChange}
                                InputLabelProps={{ style: { color: colors.grey[300] } }}
                                InputProps={{ style: { color: colors.grey[100] } }}
                            />
                            <ErrorMessage name="major" component="div" className="text-red-500 text-sm"/>
                            {isSubmitting && (
                                <div className="flex justify-center mt-4">
                                    <CircularLoader/>
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
                            >
                                {loading ? <CircularProgress size={24} /> : "Register"}
                            </Button>
                            </>
                            )}
                        </Form>
                    )}
                </Formik>
            </Box>
            {/* Snackbar for OTP Message */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success">
                Check your email for a temporary password.
                </Alert>
            </Snackbar>
        </Box>
    );
}