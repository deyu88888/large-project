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
import { Student } from "../../types.ts";
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface TextFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  fullWidth?: boolean;
}

interface SwitchFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SocietiesFieldProps {
  value: number[];
  onChange: (societies: number[]) => void;
}

interface PresidentFieldProps {
  value: any;
  onChange: (presidentOf: number[]) => void;
}

interface FormButtonsProps {
  saving: boolean;
}

interface LoadingSpinnerProps {
  color?: "primary" | "secondary";
}

interface BackButtonProps {
  onClick: () => void;
}

interface SnackbarAlertProps {
  state: SnackbarState;
  onClose: () => void;
}

interface StudentFormProps {
  formData: Student;
  saving: boolean;
  onTextChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSocietiesChange: (societies: number[]) => void;
  onPresidentOfChange: (presidentOf: number[]) => void;
  onActiveChange: (active: boolean) => void;
  onIsPresidentChange: (isPresident: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}

const fetchStudentData = async (studentId: number): Promise<Student> => {
  try {
    const response = await apiClient.get(
      apiPaths.USER.ADMINSTUDENTVIEW(studentId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching student details", error);
    throw error;
  }
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

const SnackbarAlert: React.FC<SnackbarAlertProps> = ({ state, onClose }) => (
  <Snackbar
    open={state.open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert
      onClose={onClose}
      severity={state.severity}
      sx={{ width: "100%" }}
    >
      {state.message}
    </Alert>
  </Snackbar>
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
          <Grid item xs={12}>
            <FormTextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={onTextChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormTextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={onTextChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormTextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={onTextChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormTextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={onTextChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormTextField
              label="Role"
              name="role"
              value={formData.role}
              onChange={onTextChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormTextField
              label="Major"
              name="major"
              value={formData.major}
              onChange={onTextChange}
            />
          </Grid>

          <Grid item xs={6}>
            <SocietiesField
              value={formData.societies}
              onChange={onSocietiesChange}
            />
          </Grid>

          <Grid item xs={12}>
            <PresidentField
              value={formData.president_of}
              onChange={onPresidentOfChange}
            />
          </Grid>

          <Grid item xs={6}>
            <SwitchField
              label="Active"
              name="isActive"
              checked={formData.is_active}
              onChange={onActiveChange}
            />
          </Grid>

          <Grid item xs={12}>
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

  const [formData, setFormData] = useState<Student | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchStudentDataWrapper = useCallback(async () => {
    try {
      return await fetchStudentData(studentId);
    } catch (error) {
      console.error("Error fetching student details", error);
      throw error;
    }
  }, [studentId]);

  const { 
    data: student, 
    loading, 
    error: wsError, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<Student>(
    `student/${studentId}`, 
    fetchStudentDataWrapper
  );

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    }
  }, [student]);

  useEffect(() => {
    if (wsError) {
      setSnackbar({
        open: true,
        message: `Error loading data: ${wsError}`,
        severity: "error"
      });
    }
  }, [wsError]);

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => {
        if (!prev) return null;
        return { ...prev, [name]: value };
      });
    },
    []
  );

  const handleSocietiesChange = useCallback((societies: number[]) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, societies };
    });
  }, []);

  const handlePresidentOfChange = useCallback((presidentOf: number[]) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, president_of: presidentOf };
    });
  }, []);

  const handleActiveChange = useCallback((active: boolean) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, is_active: active };
    });
  }, []);

  const handleIsPresidentChange = useCallback((isPresident: boolean) => {
    setFormData((prev) => {
      if (!prev) return null;
      return { ...prev, is_president: isPresident };
    });
  }, []);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!formData || !student) return;

      try {
        setSaving(true);

        const formDataToSend = createFormDataFromStudent(formData);
        await updateStudentData(studentId, formDataToSend);
        
        refresh();
        
        setSnackbar({
          open: true,
          message: "Student updated successfully!",
          severity: "success"
        });
      } catch (error) {
        console.error("Error updating student", error);
        setSnackbar({
          open: true,
          message: "There was an error updating the student.",
          severity: "error"
        });
      } finally {
        setSaving(false);
      }
    },
    [formData, student, studentId, refresh]
  );

  if (loading || !formData) {
    return <LoadingSpinner />;
  }

  return (
    <Box minHeight="100vh" p={4}>
      <Box>
        <BackButton onClick={handleGoBack} />
      </Box>

      <Typography variant="h2" textAlign="center" mb={4}>
        View Student Details
      </Typography>

      <StudentForm
        formData={formData}
        saving={saving}
        onTextChange={handleTextChange}
        onSocietiesChange={handleSocietiesChange}
        onPresidentOfChange={handlePresidentOfChange}
        onActiveChange={handleActiveChange}
        onIsPresidentChange={handleIsPresidentChange}
        onSubmit={handleSubmit}
      />
      
      <SnackbarAlert 
        state={snackbar}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

export default ViewStudent;