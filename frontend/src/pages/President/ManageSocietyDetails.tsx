import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, Params } from "react-router-dom";
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
import {
  ThemeStyles,
} from "../../types/president/ManageSocietyDetails";

const ManageSocietyDetails: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  useAuthStore();
  const navigate = useNavigate();

  const { societyId } = useParams<Params>();
  const numericSocietyId = Number(societyId);

  const [society, setSociety] = useState<SocietyData | null>(null);
  const [formData, setFormData] = useState<SocietyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getThemeStyles = (): ThemeStyles => {
    return {
      backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
      textColor: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      paperBackgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff"
    };
  };

  const themeStyles = getThemeStyles();

  const validateSocietyId = (): boolean => {
    if (!societyId) {
      console.error("societyId is missing from URL params");
      setError("Missing society ID parameter");
      setLoading(false);
      return false;
    }

    if (isNaN(numericSocietyId) || numericSocietyId <= 0) {
      console.error("Invalid societyId format:", societyId);
      setError("Invalid society ID format");
      setLoading(false);
      return false;
    }

    return true;
  };

  const processSocietyResponse = (data: SocietyData): void => {
    setSociety(data);
    setFormData({
      ...data,
      social_media_links: data.social_media_links || {
        WhatsApp: "",
        Facebook: "",
        Instagram: "",
        X: "",
        Other: "",
      },
      tags: data.tags || [],
      description: data.description || "",
    });

    setPreviewUrlFromData(data);
  };

  const setPreviewUrlFromData = (data: SocietyData): void => {
    if (data.icon && typeof data.icon === "string") {
      setPreviewUrl(data.icon);
    }
  };

  const handleFetchError = (error: unknown): void => {
    console.error("Error fetching society details", error);
  };

  const finishLoading = (): void => {
    setLoading(false);
  };

  const fetchSociety = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        apiPaths.SOCIETY.MANAGE_DETAILS(numericSocietyId)
      );
      processSocietyResponse(response.data);
    } catch (error) {
      handleFetchError(error);
    } finally {
      finishLoading();
    }
  };

  const initializeComponent = (): void => {
    if (validateSocietyId()) {
      fetchSociety();
    }
  };

  useEffect(() => {
    initializeComponent();
  }, [societyId]);

  const updateFormField = (name: string, value: any): void => {
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, [name]: value } : null
    );
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    updateFormField(name, value);
  };

  const updateSocialMediaLinks = (prevFormData: SocietyData, platform: string, value: string): SocietyData => {
    return {
      ...prevFormData,
      social_media_links: {
        ...prevFormData.social_media_links,
        [platform]: value,
      },
    };
  };

  const handleSocialMediaChange = (platform: string, value: string): void => {
    if (!formData) return;
    
    setFormData(updateSocialMediaLinks(formData, platform, value));
  };

  const createFilePreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const updateFormWithSelectedFile = (file: File): void => {
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, icon: file } : null
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setSelectedFile(file);

    const fileUrl = createFilePreviewUrl(file);
    setPreviewUrl(fileUrl);

    updateFormWithSelectedFile(file);
  };

  const createFormDataToSend = (): FormData => {
    if (!formData) throw new Error("Form data is null");
    
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("tags", JSON.stringify(formData.tags));
    formDataToSend.append(
      "social_media_links",
      JSON.stringify(formData.social_media_links)
    );

    if (selectedFile) {
      formDataToSend.append("icon", selectedFile);
    }

    return formDataToSend;
  };

  const sendUpdateRequest = async (formDataToSend: FormData): Promise<void> => {
    await apiClient.patch(
      apiPaths.SOCIETY.MANAGE_DETAILS(numericSocietyId),
      formDataToSend,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  };

  const showSuccessMessage = (): void => {
    alert("Society update request submitted. Await admin approval.");
  };

  const navigateToSocietyPage = (): void => {
    navigate(`/president-page/${societyId}`);
  };

  const handleSubmitSuccess = (): void => {
    showSuccessMessage();
    navigateToSocietyPage();
  };

  const handleSubmitError = (error: unknown): void => {
    console.error("Error updating society", error);
    alert("There was an error submitting your update request.");
  };

  const setSavingState = (state: boolean): void => {
    setSaving(state);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData || !society) return;
    
    try {
      setSavingState(true);
      const formDataToSend = createFormDataToSend();
      await sendUpdateRequest(formDataToSend);
      handleSubmitSuccess();
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setSavingState(false);
    }
  };

  const handlePreviewOpen = (): void => {
    setOpenPreview(true);
  };

  const handlePreviewClose = (): void => {
    setOpenPreview(false);
  };

  const updateTags = (tagString: string): void => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      tags: tagString.split(",").map((tag) => tag.trim()),
    });
  };

  const createLoadingView = (): JSX.Element => {
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
  };

  const createPageHeader = (): JSX.Element => {
    return (
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" fontWeight="bold" sx={{ color: themeStyles.textColor }}>
          Manage My Society
        </Typography>
      </Box>
    );
  };

  const createBasicInfoFields = (): JSX.Element => {
    if (!formData) return <></>;
    
    return (
      <>
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
      </>
    );
  };

  const createIconPreview = (): JSX.Element | null => {
    if (!previewUrl) return null;
    
    return (
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
          border: `1px solid ${colors.grey[300]}`,
        }}
      />
    );
  };

  const createIconUploadButton = (): JSX.Element => {
    return (
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
        <Typography
          variant="caption"
          display="block"
          sx={{ mt: 1, color: colors.grey[500] }}
        >
          Recommended size: 100x100px
        </Typography>
      </Box>
    );
  };

  const createIconSection = (): JSX.Element => {
    return (
      <Box sx={{ mb: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Society Icon
        </Typography>
        <Box display="flex" alignItems="center">
          {createIconPreview()}
          {createIconUploadButton()}
        </Box>
      </Box>
    );
  };

  const createSocialMediaField = (platform: string): JSX.Element => {
    if (!formData) return <></>;
    
    return (
      <Grid size={{ xs: 12 }} key={platform}>
        <Box display="flex" alignItems="center">
          <Typography
            sx={{
              minWidth: "100px",
              fontWeight: "medium",
              color: themeStyles.textColor,
            }}
          >
            {platform}:
          </Typography>
          <TextField
            fullWidth
            placeholder={`Enter ${platform} link`}
            value={formData.social_media_links[platform] || ""}
            onChange={(e) => handleSocialMediaChange(platform, e.target.value)}
            sx={{ ml: 1 }}
            size="small"
          />
        </Box>
      </Grid>
    );
  };

  const createSocialMediaSection = (): JSX.Element => {
    return (
      <>
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
          Social Media Links
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {["WhatsApp", "Facebook", "Instagram", "X", "Other"].map(
            (platform) => createSocialMediaField(platform)
          )}
        </Grid>
      </>
    );
  };

  const createDescriptionSection = (): JSX.Element => {
    if (!formData) return <></>;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{
            mb: 1,
            fontWeight: "medium",
            color: themeStyles.textColor,
          }}
        >
          Description
        </Typography>
        <Box
          component="div"
          sx={{
            border: `1px solid ${
              theme.palette.mode === "dark"
                ? colors.grey[600]
                : colors.grey[300]
            }`,
            borderRadius: "4px",
            padding: "16.5px 14px",
            backgroundColor: "transparent",
            "&:hover": {
              borderColor: theme.palette.text.primary,
            },
            "&:focus-within": {
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
              color: themeStyles.textColor,
              resize: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          />
        </Box>
      </Box>
    );
  };

  const createTagsField = (): JSX.Element => {
    if (!formData) return <></>;
    
    return (
      <TextField
        fullWidth
        label="Tags (comma separated)"
        name="tags"
        value={formData.tags.join(", ")}
        onChange={(e) => updateTags(e.target.value)}
        sx={{ mb: 3 }}
      />
    );
  };

  const createSubmitButton = (): JSX.Element => {
    return (
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
    );
  };

  const createPreviewButton = (): JSX.Element => {
    return (
      <Button
        variant="outlined"
        onClick={handlePreviewOpen}
        disabled={saving}
        sx={{
          fontWeight: "bold",
          borderColor: colors.blueAccent[500],
          color: colors.blueAccent[500],
          "&:hover": {
            borderColor: colors.blueAccent[600],
            color: colors.blueAccent[600],
          },
        }}
      >
        Preview
      </Button>
    );
  };

  const createFormButtons = (): JSX.Element => {
    return (
      <Box display="flex" justifyContent="space-between" mt={3}>
        {createSubmitButton()}
        {createPreviewButton()}
      </Box>
    );
  };

  const createSocietyForm = (): JSX.Element => {
    return (
      <form onSubmit={handleSubmit}>
        {createBasicInfoFields()}
        {createIconSection()}
        {createSocialMediaSection()}
        {createDescriptionSection()}
        {createTagsField()}
        {createFormButtons()}
      </form>
    );
  };

  const createSocietyPreviewComponent = (): JSX.Element => {
    if (!formData) return <></>;
    
    return (
      <SocietyPreview
        open={openPreview}
        onClose={handlePreviewClose}
        society={formData}
        loading={false}
        joined={0}
        onJoinSociety={() => {}}
      />
    );
  };

  const createPaperContent = (): JSX.Element => {
    return (
      <Paper
        sx={{
          maxWidth: "800px",
          mx: "auto",
          p: 4,
          backgroundColor: themeStyles.paperBackgroundColor,
          color: themeStyles.textColor,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {createSocietyForm()}
      </Paper>
    );
  };

  const createMainContent = (): JSX.Element => {
    return (
      <Box
        minHeight="100vh"
        p={4}
        sx={{
          backgroundColor: themeStyles.backgroundColor,
          color: themeStyles.textColor,
        }}
      >
        {createPageHeader()}
        {createPaperContent()}
        {createSocietyPreviewComponent()}
      </Box>
    );
  };

  if (loading || !formData) {
    return createLoadingView();
  }

  return createMainContent();
};

export default ManageSocietyDetails;