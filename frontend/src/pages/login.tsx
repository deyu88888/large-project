import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  useTheme,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { apiClient, apiPaths } from "../api";
import { tokens } from "../theme/theme";
import { useAuthStore } from "../stores/auth-store";
import { useMutation } from "react-query";

type LoginPayload = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setRefreshToken } = useAuthStore();

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [showPassword, setShowPassword] = useState(false);

  // ------------------------ FORMIK ------------------------

  const loginFormik = useFormik<LoginPayload>({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: async (data) => {
      loginMutation.mutate(data);
    },
  });

  // ------------------------ MUTATION ------------------------

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      return await apiClient.post(apiPaths.USER.LOGIN, payload);
    },
    onSuccess: (res) => {
      setToken(res.data.access);
      setRefreshToken(res.data.refresh);
      navigate("/");
    },
    onError: (error) => {
      alert(error);
    },
  });

  // ------------------------ RENDER ------------------------

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
          backgroundColor:
            theme.palette.mode === "light" ? "#fff" : colors.primary[500],
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
            marginBottom: 2,
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
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {loginMutation.isLoading && (
          <Box
            display="flex"
            justifyContent="center"
            mb={2}
            data-testid="loading-indicator"
          >
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

        <Typography
          sx={{ marginTop: 2, textAlign: "center", color: colors.grey[100] }}
        >
          Need to sign up?{" "}
          <a
            href="/register"
            style={{
              color: colors.blueAccent[300],
              textDecoration: "underline",
            }}
          >
            Please register.
          </a>
        </Typography>
      </Box>
    </Box>
  );
}
