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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";
import { Student } from "../../types";
import {
  StudentFormState,
  SnackbarState,
  TextFieldProps,
  SwitchFieldProps,
  SocietiesFieldProps,
  PresidentFieldProps,
  FormButtonsProps,
  LoadingSpinnerProps,
  BackButtonProps,
  StudentFormProps
} from "../../types/admin/ViewStudent";

const fetchStudentData = async (studentId: number): Promise<Student> => {
  const response = await apiClient.get(
    apiPaths.USER.ADMINSTUDENTVIEW(studentId)
  );
  return response.data;
};

const updateStudentData = async (
  studentId: number,
  formData: FormData
): Promise<void> => {
  await apiClient.patch(`/api/admin/manage-student/${studentId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const createFormDataFromStudent = (student: Student): FormData => {
  const formDataToSend = new FormData();

  formDataToSend.append("username", student.username);
  formDataToSend.append("first_name", student.first_name);
  formDataToSend.append("last_name", student.last_name);
  formDataToSend.append("email", student.email);
  formDataToSend.append("is_active", String(student.is_active));
  formDataToSend.append("role", student.role);
  formDataToSend.append("major", student.major);

  student.societies.forEach((id) => {
    formDataToSend.append("societies", String(id));
  });

  if (student.president_of) {
    formDataToSend.append("president_of", String(student.president_of));
  } else {
    formDataToSend.append("president_of", "");
  }

  formDataToSend.append("is_president", String(student.is_president));

  return formDataToSend;
};

const parseSocietiesString = (value: string): number[] => {
  return value
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((id) => !isNaN(id));
};

const parsePresidentOfString = (value: string): number[] => {
  return value.split(",").map((id) => parseInt(id.trim()));
};

const FormTextField: React.FC<TextFieldProps> = ({
  label,
  name,
  value,
  onChange,
  fullWidth = true,
}) => (
  <TextField
    fullWidth={fullWidth}
    label={label}
    name={name}
    value={value}
    onChange={onChange}
  />
);

const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  name,
  checked,
  onChange,
}) => (
  <FormControlLabel
    control={
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        name={name}
      />
    }
    label={label}
  />
);

const SocietiesField: React.FC<SocietiesFieldProps> = ({ value, onChange }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const societies = parseSocietiesString(e.target.value);
    onChange(societies);
  };

  return (
    <TextField
      fullWidth
      label="Societies"
      name="societies"
      value={value.join(", ")}
      onChange={handleChange}
    />
  );
};

const PresidentField: React.FC<PresidentFieldProps> = ({ value, onChange }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const presidentOf = parsePresidentOfString(e.target.value);
    onChange(presidentOf);
  };

  return (
    <TextField
      fullWidth
      label="President Of (IDs)"
      name="president_of"
      value={value || ""}
      onChange={handleChange}
    />
  );
};

const FormButtons: React.FC<FormButtonsProps> = ({ saving }) => (
  <Box mt={3} textAlign="center">
    <Button type="submit" variant="contained" disabled={saving}>
      {saving ? "Saving..." : "Save Changes"}
    </Button>
  </Box>
);

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

const StudentForm: React.FC<StudentFormProps> = ({
  formData,
  saving,
  onTextChange,
  onSocietiesChange,
  onPresidentOfChange,
  onActiveChange,
  onIsPresidentChange,
  onSubmit,
}) => {
  return (
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
              onChange={onTextChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormTextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={onTextChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormTextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={onTextChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormTextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={onTextChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormTextField
              label="Role"
              name="role"
              value={formData.role}
              onChange={onTextChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormTextField
              label="Major"
              name="major"
              value={formData.major}
              onChange={onTextChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <SocietiesField
            // @ts-expect-error:
              value={formData.societies}
              onChange={onSocietiesChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <PresidentField
              value={formData.president_of}
              onChange={onPresidentOfChange}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <SwitchField
              label="Active"
              name="isActive"
              checked={formData.is_active}
              onChange={onActiveChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <SwitchField
              label="Is President"
              name="is_president"
              checked={formData.is_president}
              onChange={onIsPresidentChange}
            />
          </Grid>
        </Grid>

        <FormButtons saving={saving} />
      </form>
    </Paper>
  );
};

const ViewStudent: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { student_id } = useParams<{ student_id: string }>();
  const studentId = Number(student_id);

  const [formState, setFormState] = useState<StudentFormState>({
    student: null,
    formData: null,
    loading: true,
    saving: false,
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackbarClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      setFormState((prev) => {
        if (!prev.formData) return prev;

        return {
          ...prev,
          formData: { ...prev.formData, [name]: value },
        };
      });
    },
    []
  );

  const handleSocietiesChange = useCallback((societies: number[]) => {
    setFormState((prev: any) => {
      if (!prev.formData) return prev;

      return {
        ...prev,
        formData: { ...prev.formData, societies },
      };
    });
  }, []);

  const handlePresidentOfChange = useCallback((presidentOf: number[]) => {
    setFormState((prev) => {
      if (!prev.formData) return prev;

      return {
        ...prev,
        formData: { ...prev.formData, president_of: presidentOf },
      };
    });
  }, []);

  const handleActiveChange = useCallback((active: boolean) => {
    setFormState((prev) => {
      if (!prev.formData) return prev;

      return {
        ...prev,
        formData: { ...prev.formData, isActive: active },
      };
    });
  }, []);

  const handleIsPresidentChange = useCallback((isPresident: boolean) => {
    setFormState((prev) => {
      if (!prev.formData) return prev;

      return {
        ...prev,
        formData: { ...prev.formData, is_president: isPresident },
      };
    });
  }, []);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const loadStudentData = useCallback(async () => {
    try {
      setFormState((prev) => ({ ...prev, loading: true }));

      const data = await fetchStudentData(studentId);

      setFormState({
        student: data,
        formData: { ...data },
        loading: false,
        saving: false,
      });

      setSnackbar({
        open: true,
        message: "Student details loaded successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error fetching student details", error);

      setFormState((prev) => ({
        ...prev,
        loading: false,
      }));
      setSnackbar({
        open: true,
        message: "Error fetching student details",
        severity: "error",
      });
    }
  }, [studentId]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!formState.formData || !formState.student) return;

      try {
        setFormState((prev) => ({ ...prev, saving: true }));

        const formDataToSend = createFormDataFromStudent(formState.formData);
        await updateStudentData(studentId, formDataToSend);
        setSnackbar({
          open: true,
          message: "Student updated successfully!",
          severity: "success",
        });

      } catch (error) {
        console.error("Error updating student", error);
        setSnackbar({
          open: true,
          message: `Failed to update student: ${error.response?.data?.message || "Unknown error"}`,
          severity: "error",
        });
      } finally {
        setFormState((prev) => ({ ...prev, saving: false }));
      }
    },
    [formState.formData, formState.student, studentId]
  );

  if (formState.loading || !formState.formData) {
    return <LoadingSpinner />;
  }

  return (
    <Box minHeight="100vh" p={4}>
      <BackButton onClick={handleGoBack} />

      <Typography variant="h2" textAlign="center" mb={4}>
        View Student Details
      </Typography>

      <StudentForm
        formData={formState.formData}
        saving={formState.saving}
        onTextChange={handleTextChange}
        onSocietiesChange={handleSocietiesChange}
        onPresidentOfChange={handlePresidentOfChange}
        onActiveChange={handleActiveChange}
        onIsPresidentChange={handleIsPresidentChange}
        onSubmit={handleSubmit}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={snackbar.message}
        ContentProps={{
          sx: {
            backgroundColor: 
              snackbar.severity === "success" ? "green" : 
              snackbar.severity === "error" ? "red" : 
              snackbar.severity === "warning" ? "orange" : "blue"
          }
        }}
      />
    </Box>
  );
};

export default ViewStudent;