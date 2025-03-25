import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api.ts";
import { useAuthStore } from "../../stores/auth-store.ts";
import { tokens } from "../../theme/theme.ts";
import { Admin } from "../../types.ts";

const ViewAdmin: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { admin_id } = useParams<{ admin_id: string }>();
  const adminId = Number(admin_id);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });
  
  const isCurrentUserSuperAdmin = user?.is_super_admin || false;
  const canEdit = isCurrentUserSuperAdmin;

  useEffect(() => {
    fetchAdmin();
  }, [adminId]);

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${apiPaths.USER.ADMINVIEW(adminId)}`);
      console.log('Fetched admin data:', response.data);
      setAdmin(response.data);
      setFormData({
        ...response.data,
      });
    } catch (error) {
      console.error("Error fetching admin details", error);
      setSnackbar({
        open: true,
        message: "Failed to load admin details",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!canEdit) return;
    
    const { name, value } = e.target;
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, [name]: value } : null
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !admin || !canEdit) return;
    
    try {
      setSaving(true);
      
      const dataToSend = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        is_active: formData.is_active,
        role: formData.role,
        is_super_admin: formData.is_super_admin
      };

      console.log("Sending data to backend:", dataToSend);
      
      const response = await apiClient.patch(
        `/api/admin/manage-admin/${adminId}`, 
        dataToSend
      );
      
      console.log("Response from backend:", response.data);
      
      if (response.data.data) {
        setAdmin(response.data.data);
        setFormData(response.data.data);
      }
      
      setSnackbar({
        open: true,
        message: "Admin updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating admin", error);
      setSnackbar({
        open: true,
        message: "Failed to update admin details",
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box minHeight="100vh" p={4}>
      <Button variant="contained" onClick={handleGoBack} sx={{ mb: 2 }}>
        ← Back
      </Button>
      <Typography variant="h2" textAlign="center" mb={4}>
        Admin Details
      </Typography>

      {!canEdit && (
        <Alert severity="info" sx={{ maxWidth: "800px", mx: "auto", mb: 2 }}>
          View mode: Only Super Admin users can edit admin details.
        </Alert>
      )}

      <Paper sx={{ maxWidth: "800px", mx: "auto", p: 4, borderRadius: "8px", boxShadow: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!canEdit}
                inputProps={{
                  readOnly: !canEdit
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!canEdit}
                inputProps={{
                  readOnly: !canEdit
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!canEdit}
                inputProps={{
                  readOnly: !canEdit
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!canEdit}
                inputProps={{
                  readOnly: !canEdit
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={true}
                inputProps={{
                  readOnly: true
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e: any) => {
                      if (!canEdit) return;
                      setFormData((prev) => 
                        prev ? { ...prev, is_active: e.target.checked } : null
                      );
                    }}
                    name="is_active"
                    disabled={!canEdit}
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_super_admin}
                    onChange={(e: any) => {
                      if (!canEdit) return;
                      setFormData((prev) => 
                        prev ? { ...prev, is_super_admin: e.target.checked } : null
                      );
                    }}
                    name="is_super_admin"
                    disabled={!canEdit}
                  />
                }
                label="Super Admin"
              />
            </Grid>
          </Grid>

          <Box mt={3} textAlign="center">
            {canEdit ? (
              <Button 
                type="submit" 
                variant="contained" 
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            ) : null }
          </Box>
        </form>
      </Paper>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewAdmin;