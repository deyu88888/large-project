import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import {
  Box, Typography, TextField, Button, CircularProgress, useTheme, InputAdornment, IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { login } = useAuth();

  const loginFormik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: async (data) => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.post(apiPaths.USER.LOGIN, data);

        // Extract tokens from response
        const { access, refresh } = res.data;
        
        // Use the auth context login method to store tokens
        login(access, refresh);

        // Decode token to get user role
        const decoded = jwtDecode<{ user_id: number; role: "admin" | "student" }>(access);
        const userRole = decoded.role || "student";

        // Check if user was trying to visit a protected page before login
        const from = location.state?.from?.pathname || `/${userRole}`;
        navigate(from, { replace: true });

      } catch (error) {
        setError("Login failed. Please check your username and password.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
  });

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
        component="form"
        onSubmit={loginFormik.handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: theme.palette.mode === "light" ? "#fff" : colors.primary[500],
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
            marginBottom: 2
          }}
          data-testid="login-heading"
        >
          Login
        </Typography>

        {error && (
          <Typography 
            color="error" 
            sx={{ marginBottom: 2, textAlign: "center" }}
            data-testid="error-message"
          >
            {error}
          </Typography>
        )}

        <TextField
          fullWidth
          id="username"
          name="username"
          label="Username"
          placeholder="Enter your username here"
          value={loginFormik.values.username}
          onChange={loginFormik.handleChange}
          sx={{ marginBottom: 2 }}
          InputLabelProps={{ style: { color: colors.grey[300] } }}
          InputProps={{ style: { color: colors.grey[100] } }}
        />

        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password here"
          value={loginFormik.values.password}
          onChange={loginFormik.handleChange}
          sx={{ marginBottom: 2 }}
          InputLabelProps={{ style: { color: colors.grey[300] } }}
          InputProps={{
            style: { color: colors.grey[100] },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {loading && (
          <Box display="flex" justifyContent="center" mb={2} data-testid="loading-indicator">
            <CircularProgress role="progressbar" aria-label="Loading" />
          </Box>
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
          data-testid="login-button"
          disabled={loading}
        >
          Login
        </Button>

        <Typography sx={{ marginTop: 2, textAlign: "center", color: colors.grey[100] }}>
          Need to sign up?{" "}
          <a href="/register" style={{ color: colors.blueAccent[300], textDecoration: "underline" }}>
            Please register.
          </a>
        </Typography>
      </Box>
    </Box>
  );
}