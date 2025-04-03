import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  CircularProgress,
  Grid,
  Divider,
  Menu,
  Switch,
  FormControlLabel,
  Avatar,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  PushPin as PushPinIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import RichTextEditor from "../../components/RichTextEditor";
import { apiClient } from "../../api";
import NewsPublicationRequestButton from "../../components/NewsPublicationRequestButton";

interface NewsPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: "Draft" | "PendingApproval" | "Rejected" | "Published" | "Archived";
  admin_notes?: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  view_count: number;
  image_url: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  author_data: {
    id: number;
    username: string;
    full_name: string;
  };
  comment_count: number;
}

interface SocietyNewsManagerProps {
  onBack?: () => void;
}

const SocietyNewsManager: React.FC<SocietyNewsManagerProps> = ({ onBack }) => {
  const { societyId } = useParams<{ societyId: string }>();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [tab, setTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsPost | null>(null);
  const [editorMode, setEditorMode] = useState<"view" | "create" | "edit">(
    "view"
  );


  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<
    "Draft" | "PendingApproval" | "Rejected" | "Published"
  >("Draft");
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [attachmentInfo, setAttachmentInfo] = useState<{name: string, url: string} | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (societyId) {
      fetchNews();
    }
  }, [societyId]);


  useEffect(() => {
    if (selectedNews && selectedNews.attachment_name) {
      fetchPdfUrl();
    }
  }, [selectedNews]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/society/${societyId}/news/`);
      setNews(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleCreateNews = () => {

    setTitle("");
    setContent("");
    setStatus("Draft");
    setIsPinned(false);
    setIsFeatured(false);
    setTags([]);
    setTagInput("");
    setImage(null);
    setImagePreview(null);
    setAttachment(null);


    setEditorMode("create");
  };

  const handleEditNews = (news: NewsPost) => {
    setSelectedNews(news);
    setTitle(news.title);
    setContent(news.content);
    setStatus(news.status as "Draft" | "Published");
    setIsPinned(news.is_pinned);
    setIsFeatured(news.is_featured);
    setTags(news.tags || []);
    setTagInput("");
    setImage(null);
    setImagePreview(news.image_url);
    setAttachment(null);
    if (news.attachment_name) {

      setAttachmentInfo({
        name: news.attachment_name,
        url: news.attachment_url
      });
    } else {
      setAttachmentInfo(null);
    }
    setEditorMode("edit");
    handleMenuClose();
  };

  const handleDeleteNews = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this news post?")) {
      try {
        await apiClient.delete(`/api/news/${id}/detail/`);
        setNews((prevNews) => prevNews.filter((news) => news.id !== id));
        handleMenuClose();
      } catch (error) {
        console.error("Error deleting news:", error);
      }
    }
  };

  const handleViewNews = (id: number) => {
    const post = news.find((n) => n.id === id);
    if (post) {
      setSelectedNews(post);
      setEditorMode("view");
    }
    handleMenuClose();
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);


      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      

      const fileType = file.type;
      const validTypes = ['application/pdf'];
      
      if (!validTypes.includes(fileType)) {
        alert("Please upload PDF files only.");

        event.target.value = '';
        return;
      }
      
      setAttachment(file);
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const formData = new FormData();
      

      formData.append("title", title);
      formData.append("content", content);
      formData.append("status", status);
      

      formData.append("is_pinned", isPinned ? "true" : "false");
      formData.append("is_featured", isFeatured ? "true" : "false");


      if (tags && Array.isArray(tags) && tags.length > 0) {
        const cleanTags = tags.map(tag => String(tag).trim()).filter(Boolean);
        

        cleanTags.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag);
        });
      } else {
        formData.append("tags[]", "");
      }
      

      if (image) {
        formData.append("image", image);
      }

      if (attachment) {
        formData.append("attachment", attachment);
      } else if (attachmentInfo && editorMode === "edit") {


        console.log("Keeping existing attachment:", attachmentInfo.name);
      } else if (!attachmentInfo && editorMode === "edit") {


        formData.append("remove_attachment", "true");
      }
  

      console.log("Submitting FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
  
      let response;
      let statusChanged = false;
  
      if (editorMode === "create") {
        response = await apiClient.post(
          `/api/society/${societyId}/news/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        

        statusChanged = true;
      } else if (editorMode === "edit" && selectedNews) {

        statusChanged = (selectedNews.status === "Draft" && status === "PendingApproval");
        
        response = await apiClient.put(
          `/api/news/${selectedNews.id}/detail/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }
  

      if (status === "PendingApproval" && response?.data?.id && statusChanged) {
        try {
          await apiClient.post("/api/news/publication-request/", {
            news_post: response.data.id,
          });
          alert("Submitted for admin approval!");
        } catch (err) {
          console.error("Failed to create publication request:", err);
          

          if (err.response && err.response.data && err.response.data.error) {
            alert(`Failed to request publication: ${err.response.data.error}`);
          } else {
            alert("News post saved, but failed to request publication. It may already have a pending request.");
          }
        }
      } else if (editorMode === "edit") {
        alert("News post updated successfully!");
      }
  

      fetchNews();
  

      setEditorMode("view");
      setSelectedNews(null);
    } catch (error) {
      console.error("Error submitting news:", error);
      

      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        console.error("Server error details:", error.response.data);
        

        let errorMessage = "An error occurred while submitting the news post.";
        
        if (typeof error.response.data === 'object' && error.response.data !== null) {
          if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else {
            const errorDetails = Object.entries(error.response.data)
              .map(([field, messages]) => `${field}: ${messages}`)
              .join('\n');
            if (errorDetails) {
              errorMessage = errorDetails;
            }
          }
        }
        
        alert(`Error: ${errorMessage}`);
      } else {
        alert(`Error: ${error.message || "Unknown error occurred"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (editorMode !== "view") {
      if (
        title ||
        content ||
        isPinned ||
        isFeatured ||
        tags.length > 0 ||
        image ||
        attachment
      ) {
        if (window.confirm("Discard changes?")) {
          setEditorMode("view");
          setSelectedNews(null);
        }
      } else {
        setEditorMode("view");
        setSelectedNews(null);
      }
    } else if (selectedNews) {
      setSelectedNews(null);
    } else {

      if (onBack) {
        onBack();
      } else {

        navigate(-1);
      }
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return colors.greenAccent[500];
      case "PendingApproval":
        return colors.blueAccent[500];
      case "Rejected":
        return colors.redAccent[500];
      case "Draft":
        return colors.grey[500];
      case "Archived":
        return colors.redAccent[500];
      default:
        return colors.grey[500];
    }
  };

  const fetchPdfUrl = () => {
    if (selectedNews && selectedNews.attachment_url) {

      console.log("Using PDF URL from backend:", selectedNews.attachment_url);
      setPdfUrl(selectedNews.attachment_url);
    } else {
      setPdfUrl(null);
    }
  };


  const renderNewsItem = (post: NewsPost) => {
    const isPublished = post.status === "Published";
    const formattedDate = new Date(
      isPublished ? post.published_at || post.created_at : post.created_at
    ).toLocaleDateString();

    return (
      <Card
        key={post.id}
        elevation={3}
        sx={{
          mb: 3,
          backgroundColor: colors.primary[400],
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 12px 24px -10px rgba(0,0,0,0.3)",
          },
          borderLeft: post.is_pinned
            ? `4px solid ${colors.greenAccent[500]}`
            : "none",
          overflow: "visible",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ display: "flex", alignItems: "center", mb: 1.5 }}
              >
                {post.is_pinned && (
                  <Tooltip title="Pinned">
                    <PushPinIcon
                      sx={{ mr: 1, color: colors.greenAccent[500] }}
                    />
                  </Tooltip>
                )}
                {post.title || "(Untitled)"}
              </Typography>

              <Box
                display="flex"
                alignItems="center"
                gap={1}
                flexWrap="wrap"
                mb={2}
              >
                <Chip
                  label={post.status}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(post.status),
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
                {post.is_featured && (
                  <Chip
                    icon={<StarIcon sx={{ color: "white" }} />}
                    label="Featured"
                    size="small"
                    sx={{
                      backgroundColor: colors.blueAccent[500],
                      color: "white"
                    }}
                  />
                )}
              </Box>
            </Box>

            <IconButton
              onClick={(e) => handleMenuOpen(e, post.id)}
              sx={{
                backgroundColor: alpha(colors.grey[500], 0.1),
                "&:hover": {
                  backgroundColor: alpha(colors.grey[500], 0.2),
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              mb: 2,
              maxHeight: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: alpha(colors.grey[100], 0.8),
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html:
                  post.content.length > 150
                    ? post.content.substring(0, 150) + "..."
                    : post.content,
              }}
            />
          </Box>

          {post.tags && post.tags.length > 0 && (
            <Box
              display="flex"
              alignItems="center"
              sx={{ flexWrap: "wrap", gap: 0.5, mb: 2 }}
            >
              {post.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: alpha(colors.grey[500], 0.2),
                    color: colors.grey[100],
                  }}
                />
              ))}
              {post.tags.length > 3 && (
                <Typography
                  variant="caption"
                  sx={{ ml: 1, color: colors.grey[300] }}
                >
                  +{post.tags.length - 3} more
                </Typography>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center">
                <CalendarIcon
                  sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }}
                />
                <Typography variant="caption" color={colors.grey[300]}>
                  {formattedDate}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center">
                <PersonIcon
                  sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }}
                />
                <Typography variant="caption" color={colors.grey[300]}>
                  {post.author_data?.full_name || "Unknown"}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center">
                <VisibilityIcon
                  sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }}
                />
                <Typography variant="caption" color={colors.grey[300]}>
                  {post.view_count}
                </Typography>
              </Box>

              {post.comment_count > 0 && (
                <Box display="flex" alignItems="center">
                  <CommentIcon
                    sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }}
                  />
                  <Typography variant="caption" color={colors.grey[300]}>
                    {post.comment_count}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 0 }}>
          <Button
            fullWidth
            onClick={() => handleViewNews(post.id)}
            sx={{
              py: 1,
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: alpha(colors.blueAccent[700], 0.2),
              },
            }}
            startIcon={<VisibilityIcon />}
          >
            View Details
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, md: 3 } }}>
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        sx={{
          pb: 2,
          borderBottom: `1px solid ${alpha(colors.grey[500], 0.3)}`,
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            mr: 1.5,
            backgroundColor: alpha(colors.grey[500], 0.1),
            "&:hover": {
              backgroundColor: alpha(colors.grey[500], 0.2),
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
        {editorMode === "view"
          ? selectedNews
            ? "News Details"
            : "Society News Management"
          : editorMode === "create"
          ? "Create New News Post"
          : "Edit News Post"}
        </Typography>
      </Box>

      {editorMode === "view" && !selectedNews && (
        <>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            mb={3}
            gap={2}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
              sx={{
                ".MuiTabs-indicator": {
                  backgroundColor: colors.blueAccent[500],
                },
                ".MuiTab-root": {
                  color: colors.grey[300],
                  "&.Mui-selected": {
                    color: colors.blueAccent[500],
                    fontWeight: "bold",
                  },
                  "&:hover": {
                    color: colors.blueAccent[400],
                  },
                },
              }}
            >
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>All News</span>
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>Published</span>
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>Drafts</span>
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>Rejected</span>
                  </Box>
                }
              />
            </Tabs>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNews}
              sx={{
                backgroundColor: colors.greenAccent[600],
                "&:hover": { backgroundColor: colors.greenAccent[700] },
                fontWeight: "bold",
                px: 3,
                py: 1,
                borderRadius: "8px",
              }}
            >
              Create News
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : news.length === 0 ? (
            <Paper
              elevation={3}
              sx={{
                p: 6,
                textAlign: "center",
                backgroundColor: colors.primary[400],
                borderRadius: "10px",
              }}
            >
              <ImageIcon
                sx={{ fontSize: 60, color: colors.grey[500], mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                No news posts found
              </Typography>
              <Typography color={colors.grey[300]} mb={3}>
                Create your first news post to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNews}
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  "&:hover": { backgroundColor: colors.greenAccent[700] },
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                }}
              >
                Create News
              </Button>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {news
                .filter((post) => {
                  console.log(
                    `Post ID=${post.id}, Title=${post.title}, Status=${post.status}`
                  );
                  if (tab === 0) return true;
                  if (tab === 1) return post.status === "Published";
                  if (tab === 2) return post.status === "Draft";
                  if (tab === 3) return post.status === "Rejected";
                  return true;
                })
                .map(renderNewsItem)}
            </Box>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: colors.primary[400],
                borderRadius: "8px",
                boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
              },
            }}
          >
            <MenuItem onClick={() => selectedId && handleViewNews(selectedId)}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} />
              View
            </MenuItem>
            <MenuItem
              onClick={() => {
                const post = news.find((n) => n.id === selectedId);
                if (post) handleEditNews(post);
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => selectedId && handleDeleteNews(selectedId)}
              sx={{ color: colors.redAccent[500] }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
              Delete
            </MenuItem>
          </Menu>
        </>
      )}

      {editorMode === "view" && selectedNews && (
        <Paper
          sx={{
            p: 4,
            backgroundColor: colors.primary[400],
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h4" fontWeight="bold">
              {selectedNews.title || "(Untitled)"}
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => handleEditNews(selectedNews)}
              sx={{
                backgroundColor: colors.blueAccent[600],
                "&:hover": { backgroundColor: colors.blueAccent[700] },
                fontWeight: "bold",
                borderRadius: "8px",
              }}
            >
              Edit
            </Button>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
            mb={3}
          >
            <Chip
              label={selectedNews.status}
              sx={{
                backgroundColor: getStatusColor(selectedNews.status),
                color: "white",
                fontWeight: "bold",
              }}
            />
            {selectedNews.is_pinned && (
              <Chip
                icon={<PushPinIcon sx={{ color: "white" }} />}
                label="Pinned"
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            )}
            {selectedNews.is_featured && (
              <Chip
                icon={<StarIcon sx={{ color: "white" }} />}
                label="Featured"
                sx={{
                  backgroundColor: colors.blueAccent[600],
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            )}
          </Box>

          <Box
            display="flex"
            alignItems="center"
            gap={2}
            mb={3}
            sx={{
              backgroundColor: alpha(colors.grey[500], 0.1),
              borderRadius: "8px",
              p: 2,
            }}
          >
            <Avatar sx={{ bgcolor: colors.blueAccent[500] }}>
              {selectedNews.author_data?.full_name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">
                {selectedNews.author_data?.full_name || "Unknown"}
              </Typography>
              <Typography variant="body2" color={colors.grey[300]}>
                {selectedNews.status === "Published"
                  ? `Published on ${new Date(
                      selectedNews.published_at || selectedNews.created_at
                    ).toLocaleString()}`
                  : `Created on ${new Date(
                      selectedNews.created_at
                    ).toLocaleString()}`}
              </Typography>
            </Box>
          </Box>

          {selectedNews.image_url && (
            <Box mb={4} sx={{ borderRadius: "10px", overflow: "hidden" }}>
              <img
                src={selectedNews.image_url}
                alt={selectedNews.title}
                style={{
                  width: "100%",
                  maxHeight: "500px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
            </Box>
          )}

          <Box
            mb={4}
            className="quill-content-viewer"
            sx={{
              "& p": {
                lineHeight: 1.7,
                color: colors.grey[100],
              },
              "& h1, & h2, & h3": {
                color: colors.grey[100],
                my: 2,
              },
              "& ul, & ol": {
                pl: 3,
              },
              "& li": {
                mb: 1,
              },
              "& blockquote": {
                borderLeft: `4px solid ${colors.blueAccent[500]}`,
                pl: 2,
                py: 1,
                ml: 0,
                my: 2,
                backgroundColor: alpha(colors.grey[500], 0.1),
                borderRadius: "4px",
              },
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
          </Box>

          {/* Replace the attachment section in the view mode (around line 1048-1123) */}
          {selectedNews.attachment_name && (
            <Box
              mb={3}
              sx={{
                backgroundColor: alpha(colors.grey[500], 0.1),
                p: 2,
                borderRadius: "8px",
              }}
            >
              <Typography variant="subtitle2" mb={1} fontWeight="bold">
                Attachment
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  size="medium"
                  onClick={() => {
                    if (selectedNews.attachment_url) {
                      window.open(selectedNews.attachment_url, '_blank');
                    }
                  }}
                  sx={{
                    mb: 2,
                    color: colors.blueAccent[400],
                    borderColor: colors.blueAccent[400],
                    "&:hover": {
                      backgroundColor: alpha(colors.blueAccent[400], 0.1),
                      borderColor: colors.blueAccent[300],
                    },
                  }}
                >
                  View PDF: {selectedNews.attachment_name}
                </Button>
              </Box>
            </Box>
          )}

          {selectedNews.tags && selectedNews.tags.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" mb={1} fontWeight="bold">
                Tags
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedNews.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="medium"
                    sx={{
                      backgroundColor: alpha(colors.grey[500], 0.2),
                      color: colors.grey[100],
                      "&:hover": {
                        backgroundColor: alpha(colors.grey[500], 0.3),
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Box display="flex" alignItems="center">
                <VisibilityIcon sx={{ mr: 1, color: colors.grey[300] }} />
                <Typography variant="body2" color={colors.grey[300]}>
                  {selectedNews.view_count} views
                </Typography>
              </Box>

              {selectedNews.comment_count > 0 && (
                <Box display="flex" alignItems="center">
                  <CommentIcon sx={{ mr: 1, color: colors.grey[300] }} />
                  <Typography variant="body2" color={colors.grey[300]}>
                    {selectedNews.comment_count} comments
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteNews(selectedNews.id)}
              sx={{
                fontWeight: "bold",
                "&:hover": { backgroundColor: colors.redAccent[600] },
                borderRadius: "8px",
              }}
            >
              Delete
            </Button>
          </Box>

          {selectedNews.status === "Rejected" && (
            <Box
              mt={3}
              p={3}
              bgcolor={alpha(colors.redAccent[500], 0.1)}
              borderRadius={1}
              border={`1px solid ${alpha(colors.redAccent[500], 0.3)}`}
            >
              <Typography
                variant="h6"
                color={colors.redAccent[500]}
                fontWeight="bold"
              >
                This post was rejected by the admin
              </Typography>
              {selectedNews.admin_notes ? (
                <Box
                  mt={2}
                  p={2}
                  bgcolor={alpha(colors.primary[800], 0.3)}
                  borderRadius={1}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color={colors.grey[100]}
                  >
                    Admin Feedback:
                  </Typography>
                  <Typography variant="body1" color={colors.grey[100]} mt={1}>
                    {selectedNews.admin_notes}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color={colors.grey[300]} mt={1}>
                  No specific feedback was provided.
                </Typography>
              )}
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  backgroundColor: colors.greenAccent[600],
                  "&:hover": { backgroundColor: colors.greenAccent[700] },
                }}
                onClick={() => handleEditNews(selectedNews)}
              >
                Revise and Resubmit
              </Button>
            </Box>
          )}

          {(selectedNews.status === "Draft" ||
            selectedNews.status === "Rejected") && (
            <Box mt={2}>
              <NewsPublicationRequestButton
                newsId={selectedNews.id}
                skipConfirmation={true}
                onSuccess={() => {

                  setSelectedNews({
                    ...selectedNews,
                    status: "PendingApproval"
                  });
                  

                  fetchNews();
                }}
              />
            </Box>
          )}
        </Paper>
      )}

      {(editorMode === "create" || editorMode === "edit") && (
        <Paper
          sx={{
            p: 4,
            backgroundColor: colors.primary[400],
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Enhanced Title Section */}
            <Box mb={4}>
              <Typography variant="h6" mb={2} fontWeight="bold" sx={{
                display: "flex",
                alignItems: "center",
                "&:after": {
                  content: '""',
                  height: "3px",
                  flexGrow: 1,
                  ml: 2,
                  borderRadius: "4px",
                  backgroundColor: alpha(colors.grey[500], 0.2)
                }
              }}>
                Title
              </Typography>
              <TextField
                placeholder="Enter compelling title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                variant="filled"
                required
                autoComplete="off"
                InputProps={{
                  style: {
                    color: colors.grey[100],
                    backgroundColor: alpha(colors.primary[600], 0.6),
                    padding: "16px 16px",
                    fontSize: "18px",
                    fontWeight: "500",
                    borderRadius: "8px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: `0 2px 8px ${alpha(colors.primary[900], 0.2)}`
                  },
                  disableUnderline: true,
                  startAdornment: (
                    <EditIcon sx={{ mr: 1.5, color: alpha(colors.grey[300], 0.7) }} />
                  )
                }}
                sx={{
                  mb: 3,
                  "& .MuiFilledInput-root": {
                    backgroundColor: alpha(colors.primary[600], 0.6),
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: alpha(colors.primary[600], 0.8),
                      transform: "translateY(-2px)",
                      boxShadow: `0 4px 12px ${alpha(colors.primary[900], 0.3)}`
                    },
                    "&.Mui-focused": {
                      backgroundColor: alpha(colors.primary[600], 0.8),
                      boxShadow: `0 0 0 2px ${alpha(colors.blueAccent[500], 0.5)}`,
                      transform: "translateY(-2px)"
                    }
                  },
                  "& .MuiAutocomplete-popper": {
                    "& .MuiPaper-root": {
                      backgroundColor: colors.primary[400],
                      color: colors.grey[100],
                      borderRadius: "8px",
                      boxShadow: `0 4px 20px ${alpha(colors.primary[900], 0.3)}`
                    },
                    "& .MuiAutocomplete-option": {
                      color: colors.grey[100],
                      "&:hover, &.Mui-focused": {
                        backgroundColor: alpha(colors.primary[500], 0.6)
                      }
                    }
                  },

                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 100px ${alpha(colors.primary[600], 0.8)} inset !important`,
                    WebkitTextFillColor: `${colors.grey[100]} !important`,
                    caretColor: `${colors.grey[100]} !important`,
                    borderRadius: "inherit"
                  },
                  "& input:-webkit-autofill:hover": {
                    WebkitBoxShadow: `0 0 0 100px ${alpha(colors.primary[600], 0.8)} inset !important`
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: `0 0 0 100px ${alpha(colors.primary[600], 0.8)} inset !important`
                  },

                  "& input[type=text]": {
                    backgroundColor: "transparent !important"
                  },

                  "& input": {
                    "&:-webkit-autofill": {
                      transition: "background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s"
                    },
                    "&:-moz-autofill": {
                      transition: "background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s"
                    },
                    "&:-ms-autofill": {
                      transition: "background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s"
                    }
                  }
                }}
              />
            </Box>

            {/* Enhanced Content Section */}
            <Box mb={4}>
              <Typography variant="subtitle1" mb={1} fontWeight="bold">
                Content
              </Typography>
              <div className="tiptap-wrapper">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your news content here..."
                />
                <style>
                  {`.tiptap-wrapper .rich-text-editor {
                    border: 1px solid ${alpha(colors.grey[500], 0.3)};
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px ${alpha(colors.primary[900], 0.2)};
                  }
                  
                  .tiptap-wrapper .editor-menu {
                    display: flex;
                    flex-wrap: wrap;
                    background-color: ${alpha(colors.primary[300], 0.2)};
                    border-bottom: 1px solid ${alpha(colors.grey[500], 0.3)};
                    padding: 10px;
                    gap: 8px;
                  }
                  
                  .tiptap-wrapper .editor-menu-group {
                    display: flex;
                    background-color: ${alpha(colors.primary[500], 0.3)};
                    border-radius: 6px;
                    padding: 2px;
                    margin-right: 8px;
                  }
                  
                  .tiptap-wrapper .editor-menu button {
                    color: ${colors.grey[100]};
                    background-color: transparent;
                    border: none;
                    border-radius: 4px;
                    padding: 5px 10px;
                    margin: 0 2px;
                    font-weight: 500;
                    transition: all 0.2s;
                    font-size: 13px;
                  }
                  
                  .tiptap-wrapper .editor-menu button:hover {
                    background-color: ${alpha(colors.blueAccent[700], 0.3)};
                    color: white;
                  }
                  
                  .tiptap-wrapper .editor-menu button.is-active {
                    background-color: ${colors.blueAccent[600]};
                    color: white;
                    font-weight: bold;
                  }
                  
                  .tiptap-wrapper .editor-content {
                    background-color: ${alpha(colors.primary[600], 0.4)};
                    padding: 16px;
                    min-height: 250px;
                  }
                  
                  .tiptap-wrapper .ProseMirror {
                    outline: none;
                    min-height: 200px;
                    color: ${colors.grey[100]};
                    line-height: 1.6;
                  }
                  
                  .tiptap-wrapper .ProseMirror p {
                    margin-bottom: 1rem;
                  }
                  
                  .tiptap-wrapper .ProseMirror h1, 
                  .tiptap-wrapper .ProseMirror h2, 
                  .tiptap-wrapper .ProseMirror h3 {
                    color: ${colors.grey[100]};
                    font-weight: bold;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    border-bottom: 1px solid ${alpha(colors.grey[400], 0.2)};
                    padding-bottom: 5px;
                  }
                  
                  .tiptap-wrapper .ProseMirror h1 { font-size: 1.75rem; }
                  .tiptap-wrapper .ProseMirror h2 { font-size: 1.5rem; }
                  .tiptap-wrapper .ProseMirror h3 { font-size: 1.25rem; }
                  
                  .tiptap-wrapper .ProseMirror ul, 
                  .tiptap-wrapper .ProseMirror ol {
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                  }
                  
                  .tiptap-wrapper .ProseMirror li {
                    margin-bottom: 0.5rem;
                  }
                  
                  .tiptap-wrapper .ProseMirror blockquote {
                    border-left: 3px solid ${colors.blueAccent[400]};
                    padding-left: 1rem;
                    margin-left: 0;
                    margin-right: 0;
                    font-style: italic;
                    color: ${alpha(colors.grey[100], 0.7)};
                    background-color: ${alpha(colors.primary[400], 0.3)};
                    padding: 8px 16px;
                    border-radius: 0 4px 4px 0;
                  }
                  
                  .tiptap-wrapper .ProseMirror a {
                    color: ${colors.blueAccent[300]};
                    text-decoration: underline;
                  }
                  
                  .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: ${alpha(colors.grey[100], 0.4)};
                    pointer-events: none;
                    height: 0;
                  }
                  
                  .tiptap-wrapper .ProseMirror:focus {
                    outline: none;
                  }`}
                </style>
              </div>
            </Box>

            {/* Enhanced Publication Settings & Tags Sections - Already implemented in your code */}
            <Grid container spacing={3} mb={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: alpha(colors.primary[500], 0.5),
                    borderRadius: "12px",
                    height: "100%",
                    boxShadow: `0 4px 20px ${alpha(colors.primary[900], 0.2)}`,
                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: `0 8px 30px ${alpha(colors.primary[900], 0.3)}`,
                      transform: "translateY(-4px)"
                    }
                  }}
                >
                  <Typography variant="h6" mb={3} fontWeight="bold" sx={{
                    display: "flex",
                    alignItems: "center",
                    "&:before": {
                      content: '""',
                      width: "24px",
                      height: "3px",
                      mr: 2,
                      borderRadius: "4px",
                      backgroundColor: colors.greenAccent[500]
                    }
                  }}>
                    Publication Settings
                  </Typography>

                  <Box mb={3} sx={{ 
                    backgroundColor: alpha(colors.primary[600], 0.3),
                    borderRadius: "8px",
                    p: 2
                  }}>
                    <Typography variant="body1" mb={1.5} fontWeight="medium" sx={{
                      display: "flex",
                      alignItems: "center",
                    }}>
                      <ScheduleIcon sx={{ mr: 1, fontSize: 20, color: colors.grey[300] }} />
                      Publication Status
                    </Typography>
                    <FormControl
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: colors.grey[100],
                          "& fieldset": {
                            borderColor: alpha(colors.grey[500], 0.3),
                            borderWidth: "2px",
                            transition: "all 0.2s"
                          },
                          "&:hover fieldset": {
                            borderColor: colors.blueAccent[400],
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: colors.blueAccent[400],
                            borderWidth: "2px"
                          },
                        },
                      }}
                    >
                      <Select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as "Draft" | "Published")
                        }
                        displayEmpty
                        sx={{
                          backgroundColor: alpha(colors.primary[600], 0.6),
                          borderRadius: "8px",
                          boxShadow: `0 2px 8px ${alpha(colors.primary[900], 0.15)}`,
                          "& .MuiSelect-select": {
                            display: "flex",
                            alignItems: "center",
                            py: 1.5
                          }
                        }}
                      >
                        <MenuItem value="Draft" sx={{ 
                          display: "flex", 
                          alignItems: "center",
                          gap: 1
                        }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: "50%", 
                            backgroundColor: colors.grey[400],
                            mr: 1
                          }}/>
                          Draft
                        </MenuItem>
                        <MenuItem value="PendingApproval" sx={{ 
                          display: "flex", 
                          alignItems: "center",
                          gap: 1
                        }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: "50%", 
                            backgroundColor: colors.blueAccent[400],
                            mr: 1
                          }}/>
                          Submit for Approval
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ 
                    backgroundColor: alpha(colors.primary[600], 0.3),
                    borderRadius: "8px",
                    p: 2
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          color="primary"
                          sx={{
                            "& .MuiSwitch-switchBase": {
                              "&.Mui-checked": {
                                color: colors.greenAccent[600],
                                "& + .MuiSwitch-track": {
                                  backgroundColor: alpha(colors.greenAccent[600], 0.5),
                                  opacity: 1
                                }
                              }
                            },
                            "& .MuiSwitch-thumb": {
                              boxShadow: "0 2px 4px 0 rgba(0,0,0,0.2)"
                            },
                            "& .MuiSwitch-track": {
                              opacity: 0.3
                            }
                          }}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <PushPinIcon
                            sx={{
                              mr: 1,
                              color: isPinned
                                ? colors.greenAccent[500]
                                : colors.grey[500],
                              transition: "transform 0.2s, color 0.2s",
                              transform: isPinned ? "rotate(-45deg)" : "none"
                            }}
                          />
                          <Typography fontWeight={isPinned ? "medium" : "normal"}>
                            Pin to top
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          color="primary"
                          sx={{
                            "& .MuiSwitch-switchBase": {
                              "&.Mui-checked": {
                                color: colors.blueAccent[600],
                                "& + .MuiSwitch-track": {
                                  backgroundColor: alpha(colors.blueAccent[600], 0.5),
                                  opacity: 1
                                }
                              }
                            },
                            "& .MuiSwitch-thumb": {
                              boxShadow: "0 2px 4px 0 rgba(0,0,0,0.2)"
                            },
                            "& .MuiSwitch-track": {
                              opacity: 0.3
                            }
                          }}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <StarIcon
                            sx={{
                              mr: 1,
                              color: isFeatured
                                ? colors.blueAccent[500]
                                : colors.grey[500],
                              transition: "transform 0.2s, color 0.2s",
                              transform: isFeatured ? "scale(1.2)" : "scale(1)"
                            }}
                          />
                          <Typography fontWeight={isFeatured ? "medium" : "normal"}>
                            Feature this post
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: alpha(colors.primary[500], 0.5),
                    borderRadius: "12px",
                    height: "100%",
                    boxShadow: `0 4px 20px ${alpha(colors.primary[900], 0.2)}`,
                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: `0 8px 30px ${alpha(colors.primary[900], 0.3)}`,
                      transform: "translateY(-4px)"
                    }
                  }}
                >
                  <Typography variant="h6" mb={3} fontWeight="bold" sx={{
                    display: "flex",
                    alignItems: "center",
                    "&:before": {
                      content: '""',
                      width: "24px",
                      height: "3px",
                      mr: 2,
                      borderRadius: "4px",
                      backgroundColor: colors.blueAccent[500]
                    }
                  }}>
                    Tags
                  </Typography>

                  <Box 
                    display="flex" 
                    alignItems="center" 
                    mb={2.5}
                    sx={{
                      backgroundColor: alpha(colors.primary[600], 0.3),
                      borderRadius: "8px",
                      p: 0.5,
                      pr: 0.5,
                      boxShadow: `0 2px 8px ${alpha(colors.primary[900], 0.15)}`
                    }}
                  >
                    <TextField
                      placeholder="Add a tag..."
                      variant="filled"
                      size="small"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      sx={{
                        flexGrow: 1,
                        ".MuiFilledInput-root": {
                          color: colors.grey[100],
                          backgroundColor: "transparent",
                          height: "44px",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          "&:hover, &.Mui-focused": {
                            backgroundColor: "transparent",
                          },
                          "&::before, &::after": {
                            display: "none",
                          },
                        },
                      }}
                      InputProps={{
                        disableUnderline: true,
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddTag}
                      disabled={!tagInput}
                      sx={{
                        backgroundColor: colors.blueAccent[600],
                        height: "36px",
                        minWidth: "36px",
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": { 
                          backgroundColor: colors.blueAccent[700],
                          boxShadow: `0 4px 12px ${alpha(colors.blueAccent[900], 0.3)}`
                        },
                        "&.Mui-disabled": {
                          backgroundColor: alpha(colors.grey[500], 0.2),
                        },
                      }}
                    >
                      Add
                    </Button>
                  </Box>

                  <Box 
                    display="flex" 
                    flexWrap="wrap" 
                    gap={1.5} 
                    sx={{
                      backgroundColor: alpha(colors.primary[600], 0.3),
                      borderRadius: "8px",
                      p: 2,
                      minHeight: "120px"
                    }}
                  >
                    {tags.length === 0 ? (
                      <Box 
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          color: colors.grey[400],
                          textAlign: "center",
                          p: 2
                        }}
                      >
                        <Typography variant="body2">
                          No tags added yet. Tags help users find your content.
                        </Typography>
                      </Box>
                    ) : (
                      tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleRemoveTag(tag)}
                          sx={{
                            backgroundColor: alpha(colors.blueAccent[700], 0.2),
                            color: colors.grey[100],
                            borderRadius: "6px",
                            transition: "all 0.2s",
                            fontWeight: "medium",
                            border: `1px solid ${alpha(colors.blueAccent[500], 0.3)}`,
                            "&:hover": {
                              backgroundColor: alpha(colors.blueAccent[700], 0.3),
                              transform: "translateY(-2px)",
                              boxShadow: `0 4px 8px ${alpha(colors.primary[900], 0.2)}`
                            },
                            "& .MuiChip-deleteIcon": {
                              color: colors.grey[300],
                              "&:hover": {
                                color: colors.redAccent[400],
                              },
                            },
                          }}
                        />
                      ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Enhanced Media Section - Already implemented in your code */}
            <Paper
              sx={{
                p: 0,
                backgroundColor: alpha(colors.primary[500], 0.5),
                borderRadius: "12px",
                mb: 4,
                overflow: "hidden",
                boxShadow: `0 4px 20px ${alpha(colors.primary[900], 0.2)}`,
              }}
            >
              <Box sx={{
                p: 3,
                pb: 2,
                borderBottom: `1px solid ${alpha(colors.grey[500], 0.2)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <Typography variant="h6" fontWeight="bold" sx={{
                  display: "flex",
                  alignItems: "center",
                }}>
                  <ImageIcon sx={{ mr: 1.5, color: colors.grey[300] }} />
                  Media
                </Typography>
              </Box>

              <Box sx={{ px: 3, pb: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        borderRadius: "12px",
                        p: 0,
                        textAlign: "center",
                        backgroundColor: alpha(colors.primary[600], 0.3),
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: `0 4px 16px ${alpha(colors.primary[900], 0.15)}`,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: alpha(colors.primary[600], 0.4),
                          transform: "translateY(-4px)",
                          boxShadow: `0 8px 24px ${alpha(colors.primary[900], 0.25)}`,
                        },
                      }}
                    >
                      {imagePreview ? (
                        <Box sx={{ height: "100%" }}>
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              height: "220px",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={imagePreview}
                              alt="Preview"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `linear-gradient(to bottom, ${alpha(colors.primary[900], 0)} 70%, ${alpha(colors.primary[900], 0.8)})`,
                              }}
                            />
                            <IconButton
                              onClick={() => {
                                setImage(null);
                                setImagePreview(null);
                              }}
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                backgroundColor: alpha(colors.primary[900], 0.6),
                                "&:hover": {
                                  backgroundColor: alpha(colors.primary[900], 0.8),
                                },
                              }}
                            >
                              <DeleteIcon sx={{ color: colors.grey[100], fontSize: 18 }} />
                            </IconButton>
                          </Box>

                          <Box sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1.5, color: colors.grey[300], fontWeight: "medium" }}>
                              Featured image uploaded successfully
                            </Typography>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUploadIcon />}
                              sx={{
                                borderColor: colors.blueAccent[500],
                                color: colors.blueAccent[500],
                                borderRadius: "8px",
                                "&:hover": {
                                  borderColor: colors.blueAccent[400],
                                  backgroundColor: alpha(colors.blueAccent[400], 0.1),
                                },
                              }}
                            >
                              Change Image
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            minHeight: "280px",
                          }}
                        >
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: alpha(colors.primary[400], 0.3),
                              mb: 3,
                              transition: "all 0.3s ease",
                              border: `1px dashed ${alpha(colors.grey[400], 0.3)}`,
                            }}
                          >
                            <CloudUploadIcon sx={{ fontSize: 32, color: colors.grey[400] }} />
                          </Box>
                          <Typography variant="h6" fontWeight="bold" mb={1} color={colors.grey[200]}>
                            Featured Image
                          </Typography>
                          <Typography variant="body2" mb={3} color={colors.grey[400]} sx={{ maxWidth: "80%" }}>
                            Upload a high-quality image for better engagement
                          </Typography>
                          <Button
                            component="label"
                            variant="contained"
                            startIcon={<CloudUploadIcon />}
                            sx={{
                              backgroundColor: colors.blueAccent[600],
                              "&:hover": { 
                                backgroundColor: colors.blueAccent[700],
                                transform: "translateY(-2px)",
                                boxShadow: `0 6px 16px ${alpha(colors.blueAccent[900], 0.3)}`
                              },
                              px: 3,
                              py: 1,
                              borderRadius: "8px",
                              transition: "all 0.2s",
                            }}
                          >
                            Upload Image
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        borderRadius: "12px",
                        p: 0,
                        textAlign: "center",
                        backgroundColor: alpha(colors.primary[600], 0.3),
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: `0 4px 16px ${alpha(colors.primary[900], 0.15)}`,
                        height: "100%",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: alpha(colors.primary[600], 0.4),
                          transform: "translateY(-4px)",
                          boxShadow: `0 8px 24px ${alpha(colors.primary[900], 0.25)}`,
                        },
                      }}
                    >
                      {attachment ? (
                        <Box>
                          <Box sx={{ p: 3, pb: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 3,
                                backgroundColor: alpha(colors.blueAccent[900], 0.3),
                                borderRadius: "8px",
                                border: `1px solid ${alpha(colors.blueAccent[700], 0.3)}`,
                                mb: 2,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
                                <Box sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "8px",
                                  backgroundColor: alpha(colors.blueAccent[700], 0.2),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  mr: 2,
                                }}>
                                  <AttachFileIcon sx={{ fontSize: 20, color: colors.blueAccent[400] }} />
                                </Box>
                                <Box sx={{ textAlign: "left" }}>
                                  <Typography noWrap sx={{ maxWidth: "150px", fontWeight: "medium" }}>
                                    {attachment.name}
                                  </Typography>
                                  <Typography variant="caption" color={colors.grey[400]}>
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                onClick={() => setAttachment(null)}
                                sx={{
                                  color: colors.grey[300],
                                  backgroundColor: alpha(colors.primary[900], 0.3),
                                  "&:hover": {
                                    backgroundColor: alpha(colors.redAccent[900], 0.3),
                                    color: colors.redAccent[400],
                                  },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box sx={{ p: 2, mt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1.5, color: colors.grey[300], fontWeight: "medium" }}>
                              PDF document uploaded successfully
                            </Typography>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUploadIcon />}
                              sx={{
                                borderColor: colors.blueAccent[500],
                                color: colors.blueAccent[500],
                                borderRadius: "8px",
                                "&:hover": {
                                  borderColor: colors.blueAccent[400],
                                  backgroundColor: alpha(colors.blueAccent[400], 0.1),
                                },
                              }}
                              >
                              Change PDF
                              <input
                                type="file"
                                hidden
                                onChange={handleAttachmentChange}
                              />
                            </Button>
                          </Box>
                        </Box>
                      ) : attachmentInfo ? (
                        <Box>
                          <Box sx={{ p: 3, pb: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 3,
                                backgroundColor: alpha(colors.blueAccent[900], 0.3),
                                borderRadius: "8px",
                                border: `1px solid ${alpha(colors.blueAccent[700], 0.3)}`,
                                mb: 2,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
                                <Box sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "8px",
                                  backgroundColor: alpha(colors.blueAccent[700], 0.2),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  mr: 2,
                                }}>
                                  <AttachFileIcon sx={{ fontSize: 20, color: colors.blueAccent[400] }} />
                                </Box>
                                <Box sx={{ textAlign: "left" }}>
                                  <Typography noWrap sx={{ maxWidth: "150px", fontWeight: "medium" }}>
                                    {attachmentInfo.name}
                                  </Typography>
                                  <Typography variant="caption" color={colors.grey[400]}>
                                    Current PDF attachment
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                onClick={() => setAttachmentInfo(null)}
                                sx={{
                                  color: colors.grey[300],
                                  backgroundColor: alpha(colors.primary[900], 0.3),
                                  "&:hover": {
                                    backgroundColor: alpha(colors.redAccent[900], 0.3),
                                    color: colors.redAccent[400],
                                  },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box sx={{ p: 2, mt: 1 }}>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUploadIcon />}
                              sx={{
                                borderColor: colors.blueAccent[500],
                                color: colors.blueAccent[500],
                                borderRadius: "8px",
                                "&:hover": {
                                  borderColor: colors.blueAccent[400],
                                  backgroundColor: alpha(colors.blueAccent[400], 0.1),
                                },
                              }}
                            >
                              Change PDF
                              <input
                                type="file"
                                hidden
                                onChange={handleAttachmentChange}
                              />
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            minHeight: "280px",
                          }}
                        >
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: alpha(colors.primary[400], 0.3),
                              mb: 3,
                              transition: "all 0.3s ease",
                              border: `1px dashed ${alpha(colors.grey[400], 0.3)}`,
                            }}
                          >
                            <AttachFileIcon sx={{ fontSize: 32, color: colors.grey[400] }} />
                          </Box>
                          <Typography variant="h6" fontWeight="bold" mb={1} color={colors.grey[200]}>
                            PDF Attachment
                          </Typography>
                          <Typography variant="body2" mb={3} color={colors.grey[400]} sx={{ maxWidth: "80%" }}>
                            Upload PDF documentation, reports or additional resources
                          </Typography>
                          <Button
                            component="label"
                            variant="contained"
                            startIcon={<AttachFileIcon />}
                            sx={{
                              backgroundColor: colors.blueAccent[600],
                              "&:hover": { 
                                backgroundColor: colors.blueAccent[700],
                                transform: "translateY(-2px)",
                                boxShadow: `0 6px 16px ${alpha(colors.blueAccent[900], 0.3)}`
                              },
                              px: 3,
                              py: 1,
                              borderRadius: "8px",
                              transition: "all 0.2s",
                            }}
                          >
                            Upload PDF
                            <input
                              type="file"
                              hidden
                              onChange={handleAttachmentChange}
                            />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Enhanced Form Buttons */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={isSubmitting}
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderColor: alpha(colors.grey[500], 0.5),
                  color: colors.grey[300],
                  borderWidth: "2px",
                  borderRadius: "10px",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    borderColor: colors.grey[300],
                    backgroundColor: alpha(colors.grey[500], 0.1),
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !title || !content}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  "&:hover": { 
                    backgroundColor: colors.greenAccent[700],
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 16px ${alpha(colors.greenAccent[900], 0.3)}`
                  },
                  fontWeight: "bold",
                  px: 4,
                  py: 1.2,
                  borderRadius: "10px",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to right, ${alpha(colors.greenAccent[600], 0)} 0%, ${alpha(colors.greenAccent[400], 0.3)} 50%, ${alpha(colors.greenAccent[600], 0)} 100%)`,
                    transform: "translateX(-100%)",
                    transition: "transform 0.6s ease",
                  },
                  "&:hover::after": {
                    transform: "translateX(100%)",
                  },
                }}
              >
                {!isSubmitting &&
                  (status === "Published"
                    ? "Publish"
                    : status === "PendingApproval"
                    ? "Submit for Approval"
                    : "Save Draft")}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default SocietyNewsManager;