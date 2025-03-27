import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useCallback,
} from "react";
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

interface AdminFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_super_admin: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  fullWidth?: boolean;
}

interface SwitchFieldProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

interface FormSubmitButtonProps {
  saving: boolean;
  canEdit: boolean;
}

interface SnackbarAlertProps {
  state: SnackbarState;
  onClose: () => void;
}

interface LoadingSpinnerProps {
  color?: "primary" | "secondary";
}

interface InfoAlertProps {
  message: string;
}

interface BackButtonProps {
  onClick: () => void;
}

interface AdminDetailFormProps {
  formData: AdminFormData;
  canEdit: boolean;
  saving: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSwitchChange: (
    name: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}

const fetchAdminData = async (adminId: number): Promise<Admin> => {
  const response = await apiClient.get(`${apiPaths.USER.ADMINVIEW(adminId)}`);
  return response.data;
};

const updateAdminData = async (
  adminId: number,
  data: Partial<AdminFormData>
): Promise<Admin> => {
  const response = await apiClient.patch(
    `/api/admin/manage-admin/${adminId}`,
    data
  );
  return response.data.data || response.data;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  color = "secondary",
}) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
  >
    <CircularProgress color={color} />
  </Box>
);

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => (
  <Button variant="contained" onClick={onClick} sx={{ mb: 2 }}>
    ← Back
  </Button>
);

const InfoAlert: React.FC<InfoAlertProps> = ({ message }) => (
  <Alert severity="info" sx={{ maxWidth: "800px", mx: "auto", mb: 2 }}>
    {message}
  </Alert>
);

const FormTextField: React.FC<TextFieldProps> = ({
  label,
  name,
  value,
  onChange,
  disabled,
  fullWidth = true,
}) => (
  <TextField
    fullWidth={fullWidth}
    label={label}
    name={name}
    value={value}
    onChange={onChange}
    disabled={disabled}
    inputProps={{
      readOnly: disabled,
    }}
  />
);

const SwitchField: React.FC<SwitchFieldProps> = ({
  name,
  label,
  checked,
  onChange,
  disabled,
}) => (
  <FormControlLabel
    control={
      <Switch
        checked={checked}
        onChange={onChange}
        name={name}
        disabled={disabled}
      />
    }
    label={label}
  />
);

const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  saving,
  canEdit,
}) => {
  if (!canEdit) return null;

  return (
    <Box mt={3} textAlign="center">
      <Button type="submit" variant="contained" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </Box>
  );
};

const SnackbarAlert: React.FC<SnackbarAlertProps> = ({ state, onClose }) => (
  <Snackbar
    open={state.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert onClose={onClose} severity={state.severity} sx={{ width: "100%" }}>
      {state.message}
    </Alert>
  </Snackbar>
);

const AdminDetailForm: React.FC<AdminDetailFormProps> = ({
  formData,
  canEdit,
  saving,
  onChange,
  onSwitchChange,
  onSubmit,
}) => (
  <Paper
    sx={{
      maxWidth: "800px",
      mx: "auto",
      p: 4,
      borderRadius: "8px",
      boxShadow: 3,
    }}
  >
    <form onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <FormTextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={onChange}
            disabled={!canEdit}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <FormTextField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={onChange}
            disabled={!canEdit}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <FormTextField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={onChange}
            disabled={!canEdit}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <FormTextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={onChange}
            disabled={!canEdit}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <FormTextField
            label="Role"
            name="role"
            value={formData.role}
            onChange={onChange}
            disabled={true}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <SwitchField
            name="is_active"
            label="Active"
            checked={formData.is_active}
            onChange={onSwitchChange("is_active")}
            disabled={!canEdit}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <SwitchField
            name="is_super_admin"
            label="Super Admin"
            checked={formData.is_super_admin}
            onChange={onSwitchChange("is_super_admin")}
            disabled={!canEdit}
          />
        </Grid>
      </Grid>

      <FormSubmitButton saving={saving} canEdit={canEdit} />
    </form>
  </Paper>
);

const ViewAdmin: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { admin_id } = useParams<{ admin_id: string }>();
  const adminId = Number(admin_id);

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<AdminFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const isCurrentUserSuperAdmin = user?.is_super_admin || false;
  const canEdit = isCurrentUserSuperAdmin;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!canEdit) return;

      const { name, value } = e.target;
      setFormData((prevFormData) =>
        prevFormData ? { ...prevFormData, [name]: value } : null
      );
    },
    [canEdit]
  );

  const handleSwitchChange = useCallback(
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canEdit) return;

      setFormData((prev) =>
        prev ? { ...prev, [name]: e.target.checked } : null
      );
    },
    [canEdit]
  );

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error") => {
      setSnackbar({
        open: true,
        message,
        severity,
      });
    },
    []
  );

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminData(adminId);
      console.log("Fetched admin data:", data);
      setAdmin(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching admin details", error);
      showSnackbar("Failed to load admin details", "error");
    } finally {
      setLoading(false);
    }
  }, [adminId, showSnackbar]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
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
          is_super_admin: formData.is_super_admin,
        };

        console.log("Sending data to backend:", dataToSend);

        const updatedAdmin = await updateAdminData(adminId, dataToSend);

        setAdmin(updatedAdmin);
        setFormData(updatedAdmin);

        showSnackbar("Admin updated successfully!", "success");
      } catch (error) {
        console.error("Error updating admin", error);
        showSnackbar("Failed to update admin details", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, admin, canEdit, adminId, showSnackbar]
  );

  if (loading || !formData) {
    return <LoadingSpinner />;
  }

  return (
    <Box minHeight="100vh" p={4}>
      <BackButton onClick={handleGoBack} />

      <Typography variant="h2" textAlign="center" mb={4}>
        Admin Details
      </Typography>

      {!canEdit && (
        <InfoAlert message="View mode: Only Super Admin users can edit admin details." />
      )}

      <AdminDetailForm
        formData={formData}
        canEdit={canEdit}
        saving={saving}
        onChange={handleChange}
        onSwitchChange={handleSwitchChange}
        onSubmit={handleSubmit}
      />

      <SnackbarAlert state={snackbar} onClose={handleCloseSnackbar} />
    </Box>
  );
};

export default ViewAdmin;
