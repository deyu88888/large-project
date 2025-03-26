import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { apiClient, apiPaths } from "../api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularLoader from "../components/loading/circular-loader";
import { Formik, Form, ErrorMessage } from "formik";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import * as Yup from "yup";
import { Box, Typography, TextField, Button, Snackbar, Alert, CircularProgress, useTheme, InputAdornment, } from "@mui/material";
import { tokens } from "../theme/theme";
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
    const [snackbarData, setSnackbarData] = useState({
        open: false,
        message: "",
        severity: "info",
    });
    const handleSnackbarClose = () => {
        setSnackbarData({ ...snackbarData, open: false });
    };
    const handleNext = () => setActiveStep((prev) => prev + 1);
    // Validation schema using Yup
    const getValidationSchema = (activeStep) => {
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
                        .test("is-kcl-email", "Email must end with @kcl.ac.uk", (value) => value?.endsWith("@kcl.ac.uk") ?? false)
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
                        .matches(/^[a-zA-Z0-9_.-]+$/, "Username must only contain letters, numbers, underscores, hyphens, and dots")
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
        let interval;
        if (resendDisabled && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        else {
            setResendDisabled(false);
        }
        return () => clearInterval(interval);
    }, [resendDisabled, timer]);
    const handleRequestOTP = async (email, setFieldError) => {
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
        }
        catch (error) {
            if (error.response?.data?.error) {
                setFieldError("email", error.response.data.error);
            }
            else {
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
        }
        catch (error) {
            console.log(error);
        }
    };
    const handleVerifyOTP = async (email, otp) => {
        try {
            const res = await apiClient.post(apiPaths.USER.VERIFY_OTP, {
                email,
                otp,
            });
            console.log(res);
            handleNext();
        }
        catch (error) {
            if (error.response?.data?.error) {
                setSnackbarData({
                    open: true,
                    message: error.response.data.error,
                    severity: "error",
                });
            }
            else {
                setSnackbarData({
                    open: true,
                    message: "Error verifying OTP. Please try again.",
                    severity: "error",
                });
            }
        }
    };
    const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
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
        }
        catch (error) {
            if (error.response?.data?.email) {
                setFieldError("email", error.response.data.email[0]);
            }
            else if (error.response?.data?.username) {
                setFieldError("username", error.response.data.username[0]);
            }
            else if (error.response?.data?.error &&
                error.response.data.error.includes("already registered")) {
                setSnackbarData({
                    open: true,
                    message: "This email is already registered. Please log in.",
                    severity: "error",
                });
            }
            else {
                setSnackbarData({
                    open: true,
                    message: "An unexpected error occurred. Please try again.",
                    severity: "error",
                });
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.primary[400],
            padding: 2,
        }, children: [_jsxs(Box, { sx: {
                    width: "100%",
                    maxWidth: 600,
                    backgroundColor: theme.palette.mode === "dark"
                        ? theme.palette.background.default
                        : theme.palette.background.default,
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: 3,
                }, children: [_jsx(Typography, { variant: "h4", sx: {
                            textAlign: "center",
                            fontWeight: "bold",
                            color: colors.grey[100],
                        }, children: "Register as a Student" }), _jsx(Stepper, { activeStep: activeStep, sx: { p: 2.5 }, children: steps.map((label) => (_jsx(Step, { children: _jsx(StepLabel, { children: label }) }, label))) }), _jsx(Formik, { initialValues: {
                            first_name: "",
                            last_name: "",
                            email: "",
                            username: "",
                            password: "",
                            confirm_password: "",
                            major: "",
                            otp: "",
                        }, validationSchema: getValidationSchema(activeStep), onSubmit: handleSubmit, children: ({ isSubmitting, handleChange, setFieldError, values, errors, handleBlur, isValid, dirty, }) => (_jsxs(Form, { className: "grid grid-cols-1 gap-6", children: [activeStep === 0 && (_jsxs(_Fragment, { children: [_jsx(TextField, { fullWidth: true, id: "first_name", name: "first_name", label: "First name", value: values.first_name, onChange: handleChange, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: { style: { color: colors.grey[100] } } }), _jsx(ErrorMessage, { name: "first_name", component: "div", className: "text-red-500 text-sm" }), _jsx(TextField, { fullWidth: true, id: "last_name", name: "last_name", label: "Last name", value: values.last_name, onChange: handleChange, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: { style: { color: colors.grey[100] } } }), _jsx(ErrorMessage, { name: "last_name", component: "div", className: "text-red-500 text-sm" }), _jsx(TextField, { fullWidth: true, id: "email", name: "email", label: "Email", value: values.email, onChange: handleChange, onBlur: handleBlur, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: {
                                                style: { color: colors.grey[100] },
                                                endAdornment: (_jsx(InputAdornment, { position: "end", children: values.email && !errors.email ? (_jsx(CheckCircle, { sx: { color: "green" } })) : (values.email && (_jsx(ErrorOutline, { sx: { color: "red" } }))) })),
                                            } }), _jsx(ErrorMessage, { name: "email", children: (msg) => (_jsx(Typography, { sx: { color: "red", fontSize: "0.85rem", mt: 0.5 }, children: msg })) }), _jsx(Button, { variant: "contained", onClick: () => handleRequestOTP(values.email, setFieldError), sx: {
                                                backgroundColor: colors.blueAccent[500],
                                                color: "#fff",
                                                "&:hover": { backgroundColor: colors.blueAccent[700] },
                                            }, disabled: otpSent || !isValid || !dirty, children: otpSent ? "OTP Sent" : "Get OTP" }), _jsxs(Typography, { sx: {
                                                marginTop: 2,
                                                textAlign: "center",
                                                color: colors.grey[100],
                                            }, children: ["Already signed up?", " ", _jsx("a", { href: "/login", style: {
                                                        color: colors.blueAccent[300],
                                                        textDecoration: "underline",
                                                    }, children: "Please login." })] })] })), activeStep === 1 && (_jsxs(_Fragment, { children: [_jsx(TextField, { fullWidth: true, id: "otp", name: "otp", label: "One-time Password", value: values.otp, onChange: handleChange, 
                                            // @ts-expect-error: ignore it fine
                                            className: "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" }), _jsx(ErrorMessage, { name: "otp", component: "div", className: "text-red-500 text-sm" }), _jsx(Button, { variant: "contained", onClick: () => handleVerifyOTP(values.email, values.otp), sx: {
                                                backgroundColor: colors.blueAccent[500],
                                                color: "#fff",
                                                "&:hover": { backgroundColor: colors.blueAccent[700] },
                                            }, children: "Verify OTP" }), _jsx(Button, { variant: "contained", onClick: handleResendOTP, disabled: resendDisabled, sx: {
                                                color: resendDisabled
                                                    ? colors.grey[500]
                                                    : colors.blueAccent[500],
                                                borderColor: resendDisabled
                                                    ? colors.grey[500]
                                                    : colors.blueAccent[500],
                                            }, children: resendDisabled ? `Resend OTP (${timer}s)` : "Resend OTP" })] })), activeStep === 2 && (_jsxs(_Fragment, { children: [_jsx(TextField, { fullWidth: true, id: "username", name: "username", label: "Username", value: values.username, onChange: handleChange, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: { style: { color: colors.grey[100] } } }), _jsx(ErrorMessage, { name: "username", component: "div", className: "text-red-500 text-sm" }), _jsx(TextField, { fullWidth: true, id: "password", name: "password", label: "Pasword", type: "password", value: values.password, onChange: handleChange, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: {
                                                style: { color: colors.grey[100] },
                                                endAdornment: (_jsx(InputAdornment, { position: "end", children: values.password && !errors.password ? (_jsx(CheckCircle, { sx: { color: "green" } })) : (values.password && (_jsx(ErrorOutline, { sx: { color: "red" } }))) })),
                                            } }), _jsx(ErrorMessage, { name: "password", component: "div", className: "text-red-500 text-sm" }), _jsx(TextField, { fullWidth: true, id: "confirm_password", name: "confirm_password", label: "Confirm Password", type: "password", value: values.confirm_password, onChange: handleChange, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: {
                                                style: { color: colors.grey[100] },
                                                endAdornment: (_jsx(InputAdornment, { position: "end", children: values.confirm_password &&
                                                        values.confirm_password === values.password ? (_jsx(CheckCircle, { sx: { color: "green" } })) : (values.confirm_password && (_jsx(ErrorOutline, { sx: { color: "red" } }))) })),
                                            } }), _jsx(ErrorMessage, { name: "confirm_password", component: "div", className: "text-red-500 text-sm" }), _jsx(TextField, { fullWidth: true, id: "major", name: "major", label: "Major", value: values.major, onChange: handleChange, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: { style: { color: colors.grey[100] } } }), _jsx(ErrorMessage, { name: "major", component: "div", className: "text-red-500 text-sm" }), isSubmitting && (_jsx("div", { className: "flex justify-center mt-4", children: _jsx(CircularLoader, {}) })), _jsx(Button, { fullWidth: true, type: "submit", variant: "contained", sx: {
                                                backgroundColor: colors.blueAccent[500],
                                                color: "#fff",
                                                "&:hover": { backgroundColor: colors.blueAccent[700] },
                                            }, disabled: !isValid || !dirty, children: loading ? _jsx(CircularProgress, { size: 24 }) : "Register" })] }))] })) })] }), _jsx(Snackbar, { open: snackbarData.open, autoHideDuration: 4000, onClose: handleSnackbarClose, anchorOrigin: { vertical: "top", horizontal: "center" }, children: _jsx(Alert, { onClose: handleSnackbarClose, severity: snackbarData.severity, children: snackbarData.message }) })] }));
}
