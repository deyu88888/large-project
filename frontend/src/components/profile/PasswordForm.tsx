import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Grid, TextField, Button, InputAdornment, IconButton, Box, Typography, Divider
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";
import { useState } from "react";

interface SnackbarData {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface PasswordFormProps {
  isDark: boolean;
  colors: ReturnType<typeof tokens>;
  setSnackbarData: (data: SnackbarData) => void;
}

export default function PasswordForm({ isDark, colors, setSnackbarData }: PasswordFormProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleCurrent = () => setShowCurrent(prev => !prev);
  const toggleNew = () => setShowNew(prev => !prev);
  const toggleConfirm = () => setShowConfirm(prev => !prev);

  return (
    <Formik
      initialValues={{
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }}
      validationSchema={Yup.object({
        currentPassword: Yup.string().required("Must enter current password"),
        newPassword: Yup.string()
          .min(8, "New password must be at least 8 characters")
          .required("Must enter new password"),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("newPassword")], "Passwords do not match")
          .required("Please confirm new password"),
      })}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await apiClient.put("api/users/password", {
            current_password: values.currentPassword,
            new_password: values.newPassword,
            confirm_password: values.confirmPassword,
          });
          resetForm();
          setSnackbarData({
            open: true,
            message: "Password updated successfully!",
            severity: "success",
          });
        } catch (err) {
          console.error("Failed to update password", err);
          setSnackbarData({
            open: true,
            message: "Failed to update password.",
            severity: "error",
          });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
        <Form>
          <Divider
            sx={{
              my: 3,
              "&::before, &::after": { borderColor: colors.grey[500] },
              color: colors.grey[100],
            }}
          >
            <Typography variant="h5">Update Password</Typography>
          </Divider>

          <Grid container spacing={3}>
            {/* Current Password */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="currentPassword"
                label="Current Password"
                variant="filled"
                type={showCurrent ? "text" : "password"}
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
                      <IconButton onClick={toggleCurrent} edge="end">
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* New Password */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="newPassword"
                label="New Password"
                variant="filled"
                type={showNew ? "text" : "password"}
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
                      <IconButton onClick={toggleNew} edge="end">
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Confirm Password */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                variant="filled"
                type={showConfirm ? "text" : "password"}
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
                      <IconButton onClick={toggleConfirm} edge="end">
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Submit */}
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
  );
}
