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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api.ts";
import { useAuthStore } from "../../stores/auth-store.ts";
import { tokens } from "../../theme/theme.ts";
import { Student } from "../../types.ts";  // Import Student type

const ViewStudent: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { student_id } = useParams<{ student_id: string }>();
  const studentId = Number(student_id);

  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiPaths.USER.ADMINSTUDENTVIEW(studentId));
      setStudent(response.data);
      setFormData({
        ...response.data,
      });
    } catch (error) {
      console.error("Error fetching student details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, [name]: value } : null
    );
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !student) return;
    try {
      setSaving(true);

      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("isActive", String(formData.isActive));
      formDataToSend.append("role", formData.role);
      formDataToSend.append("major", formData.major);
      formDataToSend.append("societies", JSON.stringify(formData.societies));
      formDataToSend.append("presidentOf", JSON.stringify(formData.presidentOf));
      formDataToSend.append("isPresident", String(formData.isPresident));

      await apiClient.patch(`/api/admin-manage-student-details/${studentId}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSnackbar({
        open: true,
        message: "Student updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating student", error);
      alert("There was an error updating the student.");
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

  return (
    <Box minHeight="100vh" p={4}>
      <Button variant="contained" onClick={handleGoBack} sx={{ mb: 2 }}>
        ← Back
      </Button>
      <Typography variant="h2" textAlign="center" mb={4}>
        View Student Details
      </Typography>

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
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Major"
                name="major"
                value={formData.major}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Societies"
                name="societies"
                value={formData.societies.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    societies: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.checked,
                        })
                      }
                    name="isActive"
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="President Of (IDs)"
                name="presidentOf"
                value={formData.presidentOf}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    presidentOf: e.target.value.split(",").map((id) => parseInt(id.trim())),
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPresident}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPresident: e.target.checked,
                      })
                    }
                    name="isPresident"
                  />
                }
                label="Is President"
              />
            </Grid>
          </Grid>

          <Box mt={3} textAlign="center">
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ViewStudent;
