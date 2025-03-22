import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import {
  Box, Typography, TextField, Button, CircularProgress, useTheme, InputAdornment, IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { apiClient, apiPaths } from "../api";
import { tokens } from "../theme/theme";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
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
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } catch (error) {
        alert(error);
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