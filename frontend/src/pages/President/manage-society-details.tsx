import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme.ts";
import SocietyPreviewModal from "./society-preview-modal";  

interface SocietyData {
  id: number;
  name: string;
  category: string;
  social_media_links: Record<string, string>;
  membership_requirements: string;
  upcoming_projects_or_plans: string;
  tags: string[];
  icon: string | File | null;
}

const ManageSocietyDetails: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();
  const societyId = Number(society_id);

  const [society, setSociety] = useState<SocietyData | null>(null);
  const [formData, setFormData] = useState<SocietyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [openPreview, setOpenPreview] = useState<boolean>(false);

  useEffect(() => {
    fetchSociety();
  }, []);

  const fetchSociety = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(societyId));
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      formDataToSend.append("category", formData.category);
      formDataToSend.append("membership_requirements", formData.membership_requirements);
      formDataToSend.append("upcoming_projects_or_plans", formData.upcoming_projects_or_plans);
      formDataToSend.append("tags", JSON.stringify(formData.tags));

      
      Object.entries(formData.social_media_links).forEach(([platform, link]) => {
        formDataToSend.append(`social_media_links[${platform}]`, link);
      });

      
      if (formData.icon && formData.icon instanceof File) {
        formDataToSend.append("icon", formData.icon);
      }

      
      await apiClient.patch(`/api/manage-society-details/${societyId}/`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Society update request submitted. Await admin approval.");
      navigate(`/president-page/${societyId}`);
    } catch (error) {
      console.error("Error updating society", error);
      alert("There was an error submitting your update request.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewOpen = () => {
    setOpenPreview(true);
  };

  const handlePreviewClose = () => {
    setOpenPreview(false);
  };

  if (loading || !formData) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ backgroundColor: colors.primary[400] }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{ color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d" }}
        >
          Manage My Society
        </Typography>
      </Box>

      <Paper
        sx={{
          maxWidth: "800px",
          mx: "auto",
          p: 4,
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
          color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Society Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Membership Requirements"
            name="membership_requirements"
            multiline
            rows={3}
            value={formData.membership_requirements}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Upcoming Projects or Plans"
            name="upcoming_projects_or_plans"
            multiline
            rows={3}
            value={formData.upcoming_projects_or_plans}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          
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
            sx={{ mb: 3 }}
          />

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              sx={{
                backgroundColor: colors.blueAccent[500],
                color: "#ffffff",
                fontWeight: "bold",
                "&:hover": { backgroundColor: colors.blueAccent[600] },
              }}
            >
              {saving ? "Submitting..." : "Submit Update Request"}
            </Button>
            <Button
              variant="outlined"
              onClick={handlePreviewOpen}
              disabled={saving}
              sx={{
                fontWeight: "bold",
                borderColor: colors.blueAccent[500],
                color: colors.blueAccent[500],
                "&:hover": { borderColor: colors.blueAccent[600], color: colors.blueAccent[600] },
              }}
            >
              Preview
            </Button>
          </Box>
        </form>
      </Paper>

      
      <SocietyPreviewModal open={openPreview} onClose={handlePreviewClose} formData={formData} />
    </Box>
  );
};

export default ManageSocietyDetails;
