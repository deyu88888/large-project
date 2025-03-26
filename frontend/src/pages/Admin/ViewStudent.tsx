import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api.ts";
import { useAuthStore } from "../../stores/auth-store.ts";
import { tokens } from "../../theme/theme.ts";
import { Student } from "../../types.ts";


interface StudentFormState {
  student: Student | null;
  formData: Student | null;
  loading: boolean;
  saving: boolean;
}

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

interface StudentFormProps {
  formData: Student;
  saving: boolean;
  onTextChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSocietiesChange: (societies: number[]) => void;
  onPresidentOfChange: (presidentOf: number[]) => void;
  onActiveChange: (active: boolean) => void;
  onIsPresidentChange: (isPresident: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}


const fetchStudentData = async (studentId: number): Promise<Student> => {
  const response = await apiClient.get(apiPaths.USER.ADMINSTUDENTVIEW(studentId));
  return response.data;
};

const updateStudentData = async (studentId: number, formData: FormData): Promise<void> => {
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
  return value
    .split(",")
    .map((id) => parseInt(id.trim()));
};


const FormTextField: React.FC<TextFieldProps> = ({
  label,
  name,
  value,
  onChange,
  fullWidth = true
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
  onChange
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

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ color = "secondary" }) => (
  <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
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
  onSubmit
}) => {
  return (
    <Paper sx={{ maxWidth: "800px", mx: "auto", p: 4, borderRadius: "8px", boxShadow: 3 }}>
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
              checked={formData.isActive}
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
  
  
  const [formState, setFormState] = useState<StudentFormState>({
    student: null,
    formData: null,
    loading: true,
    saving: false
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success"
  });

  
  const handleTextChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormState(prev => {
      if (!prev.formData) return prev;
      
      return {
        ...prev,
        formData: { ...prev.formData, [name]: value }
      };
    });
  }, []);

  const handleSocietiesChange = useCallback((societies: number[]) => {
    setFormState(prev => {
      if (!prev.formData) return prev;
      
      return {
        ...prev,
        formData: { ...prev.formData, societies }
      };
    });
  }, []);

  const handlePresidentOfChange = useCallback((presidentOf: number[]) => {
    setFormState(prev => {
      if (!prev.formData) return prev;
      
      return {
        ...prev,
        formData: { ...prev.formData, president_of: presidentOf }
      };
    });
  }, []);

  const handleActiveChange = useCallback((active: boolean) => {
    setFormState(prev => {
      if (!prev.formData) return prev;
      
      return {
        ...prev,
        formData: { ...prev.formData, isActive: active }
      };
    });
  }, []);

  const handleIsPresidentChange = useCallback((isPresident: boolean) => {
    setFormState(prev => {
      if (!prev.formData) return prev;
      
      return {
        ...prev,
        formData: { ...prev.formData, is_president: isPresident }
      };
    });
  }, []);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  
  const loadStudentData = useCallback(async () => {
    try {
      setFormState(prev => ({ ...prev, loading: true }));
      
      const data = await fetchStudentData(studentId);
      
      setFormState({
        student: data,
        formData: { ...data },
        loading: false,
        saving: false
      });
      
      setSnackbar({
        open: true,
        message: "Student updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error fetching student details", error);
      
      setFormState(prev => ({
        ...prev,
        loading: false
      }));
    }
  }, [studentId]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formState.formData || !formState.student) return;
    
    try {
      setFormState(prev => ({ ...prev, saving: true }));
      
      const formDataToSend = createFormDataFromStudent(formState.formData);
      await updateStudentData(studentId, formDataToSend);
      
      alert("Student updated successfully!");
    } catch (error) {
      console.error("Error updating student", error);
      alert("There was an error updating the student.");
    } finally {
      setFormState(prev => ({ ...prev, saving: false }));
    }
  }, [formState.formData, formState.student, studentId]);

  
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
    </Box>
  );
};

export default ViewStudent;