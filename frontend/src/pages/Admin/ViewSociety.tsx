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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api.ts";
import { useAuthStore } from "../../stores/auth-store.ts";
import { tokens } from "../../theme/theme.ts";
import { Society } from "../../types.ts";


const ViewSociety: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();
  const societyId = Number(society_id);

  const [society, setSociety] = useState<Society | null>(null);
  const [formData, setFormData] = useState<Society | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  useEffect(() => {
    fetchSociety();
  }, []);

  const fetchSociety = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiPaths.USER.ADMINSOCIETYVIEW(societyId));
      setSociety(response.data);
      setFormData({
        ...response.data,
        social_media_links: response.data.social_media_links || {},
        tags: response.data.tags || [],
      });
    } catch (error) {
      console.error("Error fetching society details", error);
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
    if (!formData || !society) return;
    try {
      setSaving(true);

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("timetable", formData.timetable);
      formDataToSend.append("membership_requirements", formData.membership_requirements);
      formDataToSend.append("upcoming_projects_or_plans", formData.upcoming_projects_or_plans);
      formDataToSend.append("tags", JSON.stringify(formData.tags));

      Object.entries(formData.social_media_links).forEach(([platform, link]) => {
        formDataToSend.append(`social_media_links[${platform}]`, link);
      });

      if (formData.icon && formData.icon instanceof File) {
        formDataToSend.append("icon", formData.icon);
      }

      await apiClient.patch(`/api/admin-manage-society-details/${societyId}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSnackbar({
        open: true,
        message: "Society updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating society", error);
      alert("There was an error updating the society.");
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
        View Society Details
      </Typography>

      <Paper sx={{ maxWidth: "800px", mx: "auto", p: 4, borderRadius: "8px", boxShadow: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Society Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Leader"
                name="leader"
                value={formData.leader}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Approved By"
                name="approved_by"
                value={formData.approved_by}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                name="tags"
                value={formData.tags.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((tag) => tag.trim()),
                  })
                }
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

export default ViewSociety;