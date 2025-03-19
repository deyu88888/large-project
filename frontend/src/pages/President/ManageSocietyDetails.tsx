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
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";
import SocietyPreviewModal from "./SocietyPreviewModal";

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

interface RouteParams {
  society_id: string;
}

const ManageSocietyDetails: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { societyId } = useParams<{ societyId: string }>();
  const numericSocietyId = Number(societyId);

  // Debug logging to help diagnose the issue
  console.log("URL params:", { societyId });
  console.log("Numeric society ID:", numericSocietyId);

  const [society, setSociety] = useState<SocietyData | null>(null);
  const [formData, setFormData] = useState<SocietyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if societyId is valid
    if (!societyId) {
      console.error("societyId is missing from URL params");
      setError("Missing society ID parameter");
      setLoading(false);
      return;
    }

    if (isNaN(numericSocietyId) || numericSocietyId <= 0) {
      console.error("Invalid societyId format:", societyId);
      setError("Invalid society ID format");
      setLoading(false);
      return;
    }

    fetchSociety();
  }, [societyId]);

  const fetchSociety = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(societyId));
      setSociety(response.data);
      setFormData({
        ...response.data,
        social_media_links: response.data.social_media_links || {
          WhatsApp: "",
          Facebook: "",
          Instagram: "",
          X: "",
          Other: ""
        },
        tags: response.data.tags || [],
      });
    } catch (error) {
      console.error("Error fetching society details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, [name]: value } : null
    );
  };

  const handleSocialMediaChange = (platform: string, value: string): void => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      social_media_links: {
        ...formData.social_media_links,
        [platform]: value
      }
    });
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
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

      // Convert social_media_links to JSON string
      formDataToSend.append("social_media_links", JSON.stringify(formData.social_media_links));

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

  const handlePreviewOpen = (): void => {
    setOpenPreview(true);
  };

  const handlePreviewClose = (): void => {
    setOpenPreview(false);
  };

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";

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
        backgroundColor,
        color: textColor,
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{ color: textColor }}
        >
          Manage My Society
        </Typography>
      </Box>

      <Paper
        sx={{
          maxWidth: "800px",
          mx: "auto",
          p: 4,
          backgroundColor: paperBackgroundColor,
          color: textColor,
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

          <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
            Social Media Links
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Social media input fields */}
            {['WhatsApp', 'Facebook', 'Instagram', 'X', 'Other'].map((platform) => (
              <Grid item xs={12} key={platform}>
                <Box display="flex" alignItems="center">
                  <Typography
                    sx={{ 
                      minWidth: '100px', 
                      fontWeight: 'medium',
                      color: textColor
                    }}
                  >
                    {platform}:
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder={`Enter ${platform} link`}
                    value={formData.social_media_links[platform] || ''}
                    onChange={(e) => handleSocialMediaChange(platform, e.target.value)}
                    sx={{ ml: 1 }}
                    size="small"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

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