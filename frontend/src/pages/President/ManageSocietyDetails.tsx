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
import UploadIcon from "@mui/icons-material/Upload";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";
import { SocietyPreview } from "../../components/SocietyPreview";
import { SocietyData } from "../../types/president/society";

const ManageSocietyDetails: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  useAuthStore();
  const navigate = useNavigate();

  const { societyId } = useParams<{ societyId: string }>();
  const numericSocietyId = Number(societyId);

  const [society, setSociety] = useState<SocietyData | null>(null);
  const [formData, setFormData] = useState<SocietyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      const response = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(numericSocietyId));
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
        description: response.data.description || ""
      });
      
      // Set preview URL if icon exists
      if (response.data.icon && typeof response.data.icon === 'string') {
        setPreviewUrl(response.data.icon);
      }
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected file
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      
      // Update formData with the new file
      setFormData((prevFormData) =>
        prevFormData ? { ...prevFormData, icon: file } : null
      );
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData || !society) return;
    try {
      setSaving(true);

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("tags", JSON.stringify(formData.tags));
      // Convert social_media_links to JSON string
      formDataToSend.append("social_media_links", JSON.stringify(formData.social_media_links));

      if (selectedFile) {
        formDataToSend.append("icon", selectedFile);
      }

      await apiClient.patch(apiPaths.SOCIETY.MANAGE_DETAILS(numericSocietyId), formDataToSend, {
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

          <Box sx={{ mb: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Society Icon
            </Typography>
            <Box display="flex" alignItems="center">
              {previewUrl && (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Society Icon"
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: "8px",
                    mr: 2,
                    border: `1px solid ${colors.grey[300]}`
                  }}
                />
              )}
              <Box>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="icon-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="icon-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadIcon />}
                    sx={{
                      backgroundColor: colors.blueAccent[500],
                      color: "#ffffff",
                      "&:hover": { backgroundColor: colors.blueAccent[600] },
                    }}
                  >
                    Upload Icon
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: colors.grey[500] }}>
                  Recommended size: 100x100px
                </Typography>
              </Box>
            </Box>
          </Box>

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

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 1,
                fontWeight: "medium",
                color: textColor
              }}
            >
              Description
            </Typography>
            <Box
              component="div"
              sx={{
                border: `1px solid ${theme.palette.mode === "dark" ? colors.grey[600] : colors.grey[300]}`,
                borderRadius: "4px",
                padding: "16.5px 14px",
                backgroundColor: "transparent",
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                },
                '&:focus-within': {
                  borderColor: colors.blueAccent[500],
                  borderWidth: "2px",
                  padding: "15.5px 13px", // Adjust for border width change
                },
                overflow: "hidden",
              }}
            >
              <Box
                component="textarea"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                sx={{
                  width: "100%",
                  height: "120px",
                  border: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: "1rem",
                  backgroundColor: "transparent",
                  color: textColor,
                  resize: "none",
                  '&::-webkit-scrollbar': {
                    display: "none"
                  },
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              />
            </Box>
          </Box>

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

      <SocietyPreview
        open={openPreview}
        onClose={handlePreviewClose}
        society={formData}
        loading={false}
        joined={0}
        onJoinSociety={() => {}}
      />
    </Box>
  );
};

export default ManageSocietyDetails;