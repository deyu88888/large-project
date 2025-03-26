import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import { Box, Typography, TextField, Button, CircularProgress, useTheme, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { apiClient, apiPaths } from "../api";
import { tokens } from "../theme/theme";
import { jwtDecode } from "jwt-decode";
export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const loginFormik = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        onSubmit: async (data) => {
            setLoading(true);
            try {
                const res = await apiClient.post(apiPaths.USER.LOGIN, data);
                // Save tokens
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                // Decode token to get user role
                const decoded = jwtDecode(res.data.access);
                const userRole = decoded.role || "student";
                // Check if user was trying to visit a protected page before login
                const from = location.state?.from?.pathname || `/${userRole}`;
                navigate(from, { replace: true });
            }
            catch (error) {
                alert("Login failed. Please check your username and password.");
                console.error(error);
            }
            finally {
                setLoading(false);
            }
        },
    });
    return (_jsx(Box, { sx: {
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.primary[400],
            padding: 2,
        }, children: _jsxs(Box, { component: "form", onSubmit: loginFormik.handleSubmit, sx: {
                width: "100%",
                maxWidth: 400,
                backgroundColor: theme.palette.mode === "light" ? "#fff" : colors.primary[500],
                padding: 4,
                borderRadius: 2,
                boxShadow: 3,
            }, children: [_jsx(Typography, { variant: "h4", sx: {
                        textAlign: "center",
                        fontWeight: "bold",
                        color: colors.grey[100],
                        marginBottom: 2
                    }, "data-testid": "login-heading", children: "Login" }), _jsx(TextField, { fullWidth: true, id: "username", name: "username", label: "Username", placeholder: "Enter your username here", value: loginFormik.values.username, onChange: loginFormik.handleChange, sx: { marginBottom: 2 }, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: { style: { color: colors.grey[100] } } }), _jsx(TextField, { fullWidth: true, id: "password", name: "password", label: "Password", type: showPassword ? "text" : "password", placeholder: "Enter your password here", value: loginFormik.values.password, onChange: loginFormik.handleChange, sx: { marginBottom: 2 }, InputLabelProps: { style: { color: colors.grey[300] } }, InputProps: {
                        style: { color: colors.grey[100] },
                        endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: () => setShowPassword(!showPassword), edge: "end", children: showPassword ? _jsx(VisibilityOff, {}) : _jsx(Visibility, {}) }) })),
                    } }), loading && (_jsx(Box, { display: "flex", justifyContent: "center", mb: 2, "data-testid": "loading-indicator", children: _jsx(CircularProgress, { role: "progressbar", "aria-label": "Loading" }) })), _jsx(Button, { fullWidth: true, type: "submit", variant: "contained", sx: {
                        backgroundColor: colors.blueAccent[500],
                        color: "#fff",
                        "&:hover": { backgroundColor: colors.blueAccent[700] },
                    }, "data-testid": "login-button", children: "Login" }), _jsxs(Typography, { sx: { marginTop: 2, textAlign: "center", color: colors.grey[100] }, children: ["Need to sign up?", " ", _jsx("a", { href: "/register", style: { color: colors.blueAccent[300], textDecoration: "underline" }, children: "Please register." })] })] }) }));
}
