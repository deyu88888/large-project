// Path: frontend/src/pages/President/SocietyNewsManager.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Button, TextField, 
  Tabs, Tab, Select, MenuItem, FormControl, 
  InputLabel, Chip, IconButton, CircularProgress, 
  Grid, Divider, Menu, Switch, FormControlLabel,
  Avatar, Tooltip, Card, CardMedia, CardContent, CardActions
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { tokens } from '../../theme/theme';
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
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { apiClient } from '../../api';

// Custom wrapper component to avoid findDOMNode deprecation warning
const QuillWrapper = ({ value, onChange, style, modules, formats, theme }) => {
  const quillRef = useRef(null);
  
  return (
    <div className="quill-container">
      <ReactQuill
        ref={quillRef}
        theme={theme}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={style}
      />
    </div>
  );
};

interface NewsPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: 'Draft' | 'Published' | 'Archived';
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  view_count: number;
  image_url: string | null;
  attachment_name: string | null;
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
  const [editorMode, setEditorMode] = useState<'view' | 'create' | 'edit'>('view');
  
  // New post state
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  
  // Loading and action states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Editor configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link'
  ];

  useEffect(() => {
    if (societyId) {
      fetchNews();
    }
  }, [societyId]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/society/${societyId}/news/`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleCreateNews = () => {
    // Reset form
    setTitle('');
    setContent('');
    setStatus('Draft');
    setIsPinned(false);
    setIsFeatured(false);
    setTags([]);
    setTagInput('');
    setImage(null);
    setImagePreview(null);
    setAttachment(null);
    
    // Switch to create mode
    setEditorMode('create');
  };

  const handleEditNews = (news: NewsPost) => {
    setSelectedNews(news);
    setTitle(news.title);
    setContent(news.content);
    setStatus(news.status as 'Draft' | 'Published');
    setIsPinned(news.is_pinned);
    setIsFeatured(news.is_featured);
    setTags(news.tags || []);
    setTagInput('');
    setImage(null);
    setImagePreview(news.image_url);
    setAttachment(null);
    
    setEditorMode('edit');
    handleMenuClose();
  };

  const handleDeleteNews = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this news post?')) {
      try {
        await apiClient.delete(`/api/news/${id}/`);
        setNews(prevNews => prevNews.filter(news => news.id !== id));
        handleMenuClose();
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const handleViewNews = (id: number) => {
    const post = news.find(n => n.id === id);
    if (post) {
      setSelectedNews(post);
      setEditorMode('view');
    }
    handleMenuClose();
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      
      // Create a preview for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachment(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('status', status);
      formData.append('is_pinned', isPinned.toString());
      formData.append('is_featured', isFeatured.toString());
      formData.append('tags', JSON.stringify(tags));
      
      if (image) {
        formData.append('image', image);
      }
      
      if (attachment) {
        formData.append('attachment', attachment);
      }
      
      let response;
      
      if (editorMode === 'create') {
        response = await apiClient.post(`/api/society/${societyId}/news/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else if (editorMode === 'edit' && selectedNews) {
        response = await apiClient.put(`/api/news/${selectedNews.id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Refresh news list
      fetchNews();
      
      // Reset form and return to view mode
      setEditorMode('view');
      setSelectedNews(null);
      
    } catch (error) {
      console.error('Error submitting news:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (editorMode !== 'view') {
      if (title || content || isPinned || isFeatured || tags.length > 0 || image || attachment) {
        if (window.confirm('Discard changes?')) {
          setEditorMode('view');
          setSelectedNews(null);
        }
      } else {
        setEditorMode('view');
        setSelectedNews(null);
      }
    } else if (selectedNews) {
      setSelectedNews(null);
    } else {
      // Instead of just relying on onBack, use navigate if available
      if (onBack) {
        onBack();
      } else {
        // Navigate back using the router
        navigate(-1);
      }
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return colors.greenAccent[500];
      case 'Draft':
        return colors.grey[500];
      case 'Archived':
        return colors.redAccent[500];
      default:
        return colors.grey[500];
    }
  };

  // Render post item for the list view
  const renderNewsItem = (post: NewsPost) => {
    const isPublished = post.status === 'Published';
    const formattedDate = new Date(isPublished ? post.published_at || post.created_at : post.created_at).toLocaleDateString();
    
    return (
      <Card 
        key={post.id}
        elevation={3}
        sx={{
          mb: 3,
          backgroundColor: colors.primary[400],
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 24px -10px rgba(0,0,0,0.3)',
          },
          borderLeft: post.is_pinned ? `4px solid ${colors.greenAccent[500]}` : 'none',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                {post.is_pinned && (
                  <Tooltip title="Pinned">
                    <PushPinIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
                  </Tooltip>
                )}
                {post.title || '(Untitled)'}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={2}>
                <Chip 
                  label={post.status} 
                  size="small" 
                  sx={{ 
                    backgroundColor: getStatusColor(post.status),
                    color: '#fff',
                    fontWeight: 'bold'
                  }} 
                />
                
                {post.is_featured && (
                  <Chip 
                    icon={<StarIcon sx={{ color: '#fff !important' }} />} 
                    label="Featured" 
                    size="small" 
                    sx={{ 
                      backgroundColor: colors.blueAccent[500],
                      color: '#fff'
                    }} 
                  />
                )}
              </Box>
            </Box>
            
            <IconButton 
              onClick={(e) => handleMenuOpen(e, post.id)}
              sx={{
                backgroundColor: alpha(colors.grey[500], 0.1),
                '&:hover': {
                  backgroundColor: alpha(colors.grey[500], 0.2),
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Box 
            sx={{ 
              mb: 2, 
              maxHeight: '80px', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: alpha(colors.grey[100], 0.8)
            }}
          >
            <div 
              dangerouslySetInnerHTML={{ 
                __html: post.content.length > 150 
                  ? post.content.substring(0, 150) + '...' 
                  : post.content 
              }} 
            />
          </Box>
          
          {post.tags && post.tags.length > 0 && (
            <Box display="flex" alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {post.tags.slice(0, 3).map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  sx={{ 
                    backgroundColor: alpha(colors.grey[500], 0.2),
                    color: colors.grey[100]
                  }} 
                />
              ))}
              {post.tags.length > 3 && (
                <Typography variant="caption" sx={{ ml: 1, color: colors.grey[300] }}>
                  +{post.tags.length - 3} more
                </Typography>
              )}
            </Box>
          )}
          
          <Divider sx={{ mb: 2 }} />
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center">
                <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }} />
                <Typography variant="caption" color={colors.grey[300]}>
                  {formattedDate}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }} />
                <Typography variant="caption" color={colors.grey[300]}>
                  {post.author_data?.full_name || 'Unknown'}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center">
                <VisibilityIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }} />
                <Typography variant="caption" color={colors.grey[300]}>
                  {post.view_count}
                </Typography>
              </Box>
              
              {post.comment_count > 0 && (
                <Box display="flex" alignItems="center">
                  <CommentIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }} />
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
              '&:hover': {
                backgroundColor: alpha(colors.blueAccent[700], 0.2),
              }
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
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Box 
        display="flex" 
        alignItems="center" 
        mb={3}
        sx={{
          pb: 2,
          borderBottom: `1px solid ${alpha(colors.grey[500], 0.3)}`
        }}
      >
        <IconButton 
          onClick={handleBack} 
          sx={{ 
            mr: 1.5,
            backgroundColor: alpha(colors.grey[500], 0.1),
            '&:hover': {
              backgroundColor: alpha(colors.grey[500], 0.2),
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {editorMode === 'view' 
            ? selectedNews 
              ? selectedNews.title || '(Untitled News Post)' 
              : 'Society News Management' 
            : editorMode === 'create' 
              ? 'Create New News Post' 
              : 'Edit News Post'}
        </Typography>
      </Box>
      
      {editorMode === 'view' && !selectedNews && (
        <>
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            mb={3} 
            gap={2}
          >
            <Tabs 
              value={tab} 
              onChange={handleTabChange}
              sx={{
                '.MuiTabs-indicator': {
                  backgroundColor: colors.blueAccent[500],
                },
                '.MuiTab-root': {
                  color: colors.grey[300],
                  '&.Mui-selected': {
                    color: colors.blueAccent[500],
                    fontWeight: 'bold',
                  },
                  '&:hover': {
                    color: colors.blueAccent[400],
                  }
                }
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
            </Tabs>
            
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNews}
              sx={{
                backgroundColor: colors.greenAccent[600],
                '&:hover': { backgroundColor: colors.greenAccent[700] },
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: '8px'
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
                textAlign: 'center',
                backgroundColor: colors.primary[400],
                borderRadius: '10px',
              }}
            >
              <ImageIcon sx={{ fontSize: 60, color: colors.grey[500], mb: 2 }} />
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
                  '&:hover': { backgroundColor: colors.greenAccent[700] },
                  fontWeight: 'bold',
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
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 3
              }}
            >
              {news
                .filter(post => {
                  if (tab === 0) return true;
                  if (tab === 1) return post.status === 'Published';
                  if (tab === 2) return post.status === 'Draft';
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
              '& .MuiPaper-root': {
                backgroundColor: colors.primary[400],
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            <MenuItem onClick={() => selectedId && handleViewNews(selectedId)}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} />
              View
            </MenuItem>
            <MenuItem onClick={() => {
              const post = news.find(n => n.id === selectedId);
              if (post) handleEditNews(post);
            }}>
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
      
      {editorMode === 'view' && selectedNews && (
        <Paper 
          sx={{ 
            p: 4, 
            backgroundColor: colors.primary[400],
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="bold">{selectedNews.title || '(Untitled)'}</Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => handleEditNews(selectedNews)}
              sx={{
                backgroundColor: colors.blueAccent[600],
                '&:hover': { backgroundColor: colors.blueAccent[700] },
                fontWeight: 'bold',
                borderRadius: '8px'
              }}
            >
              Edit
            </Button>
          </Box>
          
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={3}>
            <Chip 
              label={selectedNews.status} 
              sx={{ 
                backgroundColor: getStatusColor(selectedNews.status),
                color: '#fff',
                fontWeight: 'bold'
              }} 
            />
            
            {selectedNews.is_pinned && (
              <Chip 
                icon={<PushPinIcon sx={{ color: '#fff !important' }} />} 
                label="Pinned" 
                sx={{ 
                  backgroundColor: colors.greenAccent[600],
                  color: '#fff',
                  fontWeight: 'bold'
                }} 
              />
            )}
            
            {selectedNews.is_featured && (
              <Chip 
                icon={<StarIcon sx={{ color: '#fff !important' }} />} 
                label="Featured" 
                sx={{ 
                  backgroundColor: colors.blueAccent[600],
                  color: '#fff',
                  fontWeight: 'bold'
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
              borderRadius: '8px',
              p: 2
            }}
          >
            <Avatar sx={{ bgcolor: colors.blueAccent[500] }}>
              {selectedNews.author_data?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">
                {selectedNews.author_data?.full_name || 'Unknown'}
              </Typography>
              <Typography variant="body2" color={colors.grey[300]}>
                {selectedNews.status === 'Published' 
                  ? `Published on ${new Date(selectedNews.published_at || selectedNews.created_at).toLocaleString()}` 
                  : `Created on ${new Date(selectedNews.created_at).toLocaleString()}`}
              </Typography>
            </Box>
          </Box>
          
          {selectedNews.image_url && (
            <Box mb={4} sx={{ borderRadius: '10px', overflow: 'hidden' }}>
              <img 
                src={selectedNews.image_url} 
                alt={selectedNews.title} 
                style={{ 
                  width: '100%', 
                  maxHeight: '500px', 
                  objectFit: 'cover',
                  borderRadius: '10px'
                }} 
              />
            </Box>
          )}
          
          <Box 
            mb={4} 
            className="quill-content-viewer"
            sx={{
              '& p': { 
                lineHeight: 1.7,
                color: colors.grey[100]
              },
              '& h1, & h2, & h3': {
                color: colors.grey[100],
                my: 2
              },
              '& ul, & ol': {
                pl: 3
              },
              '& li': {
                mb: 1
              },
              '& blockquote': {
                borderLeft: `4px solid ${colors.blueAccent[500]}`,
                pl: 2,
                py: 1,
                ml: 0,
                my: 2,
                backgroundColor: alpha(colors.grey[500], 0.1),
                borderRadius: '4px'
              }
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
          </Box>
          
          {selectedNews.attachment_name && (
            <Box 
              mb={3}
              sx={{ 
                backgroundColor: alpha(colors.grey[500], 0.1),
                p: 2, 
                borderRadius: '8px'
              }}
            >
              <Typography variant="subtitle2" mb={1} fontWeight="bold">Attachment</Typography>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                size="medium"
                sx={{
                  color: colors.blueAccent[400],
                  borderColor: colors.blueAccent[400],
                  '&:hover': {
                    backgroundColor: alpha(colors.blueAccent[400], 0.1),
                    borderColor: colors.blueAccent[300],
                  }
                }}
              >
                {selectedNews.attachment_name}
              </Button>
            </Box>
          )}
          
          {selectedNews.tags && selectedNews.tags.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" mb={1} fontWeight="bold">Tags</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedNews.tags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    size="medium"
                    sx={{
                      backgroundColor: alpha(colors.grey[500], 0.2),
                      color: colors.grey[100],
                      '&:hover': {
                        backgroundColor: alpha(colors.grey[500], 0.3),
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
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
                fontWeight: 'bold',
                '&:hover': { backgroundColor: colors.redAccent[600] },
                borderRadius: '8px',
              }}
            >
              Delete
            </Button>
          </Box>
        </Paper>
      )}
      
      {(editorMode === 'create' || editorMode === 'edit') && (
        <Paper 
          sx={{ 
            p: 4, 
            backgroundColor: colors.primary[400],
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <form onSubmit={handleSubmit}>
          <Typography variant="h6" mb={2} fontWeight="bold">Title</Typography>
            <TextField
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              variant="filled"
              required
              InputProps={{
                style: { 
                  color: colors.grey[100],
                  backgroundColor: alpha(colors.primary[600], 0.6),
                  padding: '12px 12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center'
                },
                disableUnderline: true
              }}
              sx={{
                mb: 3,
                "& .MuiFilledInput-root": {
                  backgroundColor: alpha(colors.primary[600], 0.6),
                  borderRadius: '8px',
                  "&:hover": {
                    backgroundColor: alpha(colors.primary[600], 0.8),
                  },
                  "&.Mui-focused": {
                    backgroundColor: alpha(colors.primary[600], 0.8),
                  }
                }
              }}
            />
            
            <Box mb={4}>
              <Typography variant="subtitle1" mb={1} fontWeight="bold">Content</Typography>
              <QuillWrapper
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                style={{ 
                  backgroundColor: alpha(colors.primary[600], 0.6),
                  borderRadius: '8px',
                  border: `1px solid ${alpha(colors.grey[500], 0.3)}`,
                  marginBottom: '20px',
                  '.ql-toolbar': {
                    borderColor: alpha(colors.grey[500], 0.3),
                    backgroundColor: alpha(colors.primary[400], 0.7),
                  },
                  '.ql-container': {
                    borderColor: alpha(colors.grey[500], 0.3),
                  },
                }}
              />
            </Box>
            
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    backgroundColor: alpha(colors.primary[500], 0.5),
                    borderRadius: '8px',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" mb={2} fontWeight="bold">Publication Settings</Typography>
                  
                  <Box mb={3}>
                    <Typography variant="body1" mb={1} fontWeight="medium">Publication Status</Typography>
                    <FormControl 
                    fullWidth 
                    sx={{ 
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        color: colors.grey[100],
                        "& fieldset": {
                          borderColor: alpha(colors.grey[500], 0.3),
                        },
                        "&:hover fieldset": {
                          borderColor: colors.grey[500],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: colors.blueAccent[400],
                        }
                      }
                    }}
                  >
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
                      displayEmpty
                      sx={{
                        backgroundColor: alpha(colors.primary[600], 0.6),
                        borderRadius: '8px'
                      }}
                    >
                      <MenuItem value="Draft">Draft</MenuItem>
                      <MenuItem value="Published">Published</MenuItem>
                    </Select>
                  </FormControl>
                  </Box>
                  
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          color="primary"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.greenAccent[600],
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.greenAccent[600],
                            },
                          }}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <PushPinIcon sx={{ mr: 1, color: isPinned ? colors.greenAccent[500] : colors.grey[500] }} />
                          <Typography>Pin to top</Typography>
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
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.blueAccent[600],
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.blueAccent[600],
                            },
                          }}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <StarIcon sx={{ mr: 1, color: isFeatured ? colors.blueAccent[500] : colors.grey[500] }} />
                          <Typography>Feature this post</Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    backgroundColor: alpha(colors.primary[500], 0.5),
                    borderRadius: '8px',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" mb={2} fontWeight="bold">Tags</Typography>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                  <TextField
                      placeholder="Add a tag"
                      variant="filled"
                      size="small"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      sx={{ 
                        flexGrow: 1,
                        mr: 1,
                        ".MuiFilledInput-root": {
                          color: colors.grey[100],
                          backgroundColor: alpha(colors.primary[600], 0.6),
                          borderRadius: '8px',
                          padding: '12px 12px',
                          fontSize: '16px',
                          fontWeight: '500',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          "&:hover": {
                            backgroundColor: alpha(colors.primary[600], 0.8),
                          },
                          "&.Mui-focused": {
                            backgroundColor: alpha(colors.primary[600], 0.8),
                          },
                          "&::before, &::after": {
                            display: "none"
                          }
                        }
                      }}
                      InputProps={{
                        disableUnderline: true
                      }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleAddTag}
                      disabled={!tagInput}
                      sx={{
                        backgroundColor: colors.blueAccent[600],
                        '&:hover': { backgroundColor: colors.blueAccent[700] },
                        '&.Mui-disabled': {
                          backgroundColor: alpha(colors.grey[500], 0.3),
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {tags.length === 0 ? (
                      <Typography variant="body2" color={colors.grey[400]}>
                        No tags added yet. Tags help users find your content.
                      </Typography>
                    ) : (
                      tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleRemoveTag(tag)}
                          sx={{
                            backgroundColor: alpha(colors.grey[500], 0.2),
                            color: colors.grey[100],
                            '&:hover': {
                              backgroundColor: alpha(colors.grey[500], 0.3),
                            },
                            '& .MuiChip-deleteIcon': {
                              color: colors.grey[300],
                              '&:hover': {
                                color: colors.redAccent[400],
                              }
                            }
                          }}
                        />
                      ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            <Paper 
              sx={{ 
                p: 3, 
                backgroundColor: alpha(colors.primary[500], 0.5),
                borderRadius: '8px',
                mb: 4,
              }}
            >
              <Typography variant="h6" mb={2} fontWeight="bold">Media</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box 
                    sx={{ 
                      border: `2px dashed ${alpha(colors.grey[500], 0.3)}`,
                      borderRadius: '8px',
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: alpha(colors.primary[600], 0.3),
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: alpha(colors.primary[600], 0.5),
                        borderColor: alpha(colors.grey[500], 0.5),
                      }
                    }}
                  >
                    {imagePreview ? (
                      <Box>
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: '200px',
                            mb: 2,
                            borderRadius: '8px',
                            overflow: 'hidden',
                          }}
                        >
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                            }} 
                          />
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              right: 0, 
                              m: 1 
                            }}
                          >
                            <IconButton 
                              onClick={() => {
                                setImage(null);
                                setImagePreview(null);
                              }}
                              sx={{ 
                                backgroundColor: alpha(colors.primary[900], 0.7),
                                '&:hover': {
                                  backgroundColor: alpha(colors.primary[900], 0.9),
                                }
                              }}
                            >
                              <DeleteIcon sx={{ color: colors.grey[100] }} />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            borderColor: colors.blueAccent[500],
                            color: colors.blueAccent[500],
                            '&:hover': {
                              borderColor: colors.blueAccent[400],
                              backgroundColor: alpha(colors.blueAccent[400], 0.1),
                            }
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
                    ) : (
                      <Button
                        component="label"
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          width: '100%',
                          cursor: 'pointer',
                          py: 4,
                          color: colors.grey[300],
                        }}
                      >
                        <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: colors.grey[400] }} />
                        <Typography variant="body1" fontWeight="bold" mb={1}>
                          Upload Featured Image
                        </Typography>
                        <Typography variant="body2" color={colors.grey[400]}>
                          Drag & drop or click to browse
                        </Typography>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box 
                    sx={{ 
                      border: `2px dashed ${alpha(colors.grey[500], 0.3)}`,
                      borderRadius: '8px',
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: alpha(colors.primary[600], 0.3),
                      transition: 'all 0.2s ease-in-out',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      '&:hover': {
                        backgroundColor: alpha(colors.primary[600], 0.5),
                        borderColor: alpha(colors.grey[500], 0.5),
                      }
                    }}
                  >
                    {attachment ? (
                      <Box>
                        <Box 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            p: 2,
                            backgroundColor: alpha(colors.primary[700], 0.5),
                            borderRadius: '8px',
                          }}
                        >
                          <AttachFileIcon sx={{ fontSize: 32, mr: 2, color: colors.grey[300] }} />
                          <Typography noWrap sx={{ maxWidth: '80%' }}>
                            {attachment.name}
                          </Typography>
                          <IconButton 
                            onClick={() => setAttachment(null)}
                            sx={{ 
                              ml: 'auto',
                              color: colors.grey[300],
                              '&:hover': {
                                color: colors.redAccent[400],
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            borderColor: colors.blueAccent[500],
                            color: colors.blueAccent[500],
                            '&:hover': {
                              borderColor: colors.blueAccent[400],
                              backgroundColor: alpha(colors.blueAccent[400], 0.1),
                            }
                          }}
                        >
                          Change Attachment
                          <input
                            type="file"
                            hidden
                            onChange={handleAttachmentChange}
                          />
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        component="label"
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          width: '100%',
                          cursor: 'pointer',
                          py: 4,
                          color: colors.grey[300],
                        }}
                      >
                        <AttachFileIcon sx={{ fontSize: 48, mb: 2, color: colors.grey[400] }} />
                        <Typography variant="body1" fontWeight="bold" mb={1}>
                          Upload Attachment
                        </Typography>
                        <Typography variant="body2" color={colors.grey[400]}>
                          PDF, DOC, or other files
                        </Typography>
                        <input
                          type="file"
                          hidden
                          onChange={handleAttachmentChange}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button 
                variant="outlined" 
                onClick={handleBack}
                disabled={isSubmitting}
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderColor: alpha(colors.grey[500], 0.5),
                  color: colors.grey[300],
                  '&:hover': {
                    borderColor: colors.grey[300],
                    backgroundColor: alpha(colors.grey[500], 0.1),
                  }
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
                  '&:hover': { backgroundColor: colors.greenAccent[700] },
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.2,
                  borderRadius: '8px'
                }}
              >
                {!isSubmitting && (status === 'Published' ? 'Publish' : 'Save Draft')}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default SocietyNewsManager;