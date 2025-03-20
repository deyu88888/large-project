// Path: frontend/src/pages/President/SocietyNewsManager.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Button, TextField, 
  Tabs, Tab, Select, MenuItem, FormControl, 
  InputLabel, Chip, IconButton, CircularProgress, 
  Grid, Divider, Menu, Switch, FormControlLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  ArrowBack as ArrowBackIcon
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
  // Changed parameter name to match the route parameter
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
    if (societyId) { // Changed parameter name
      fetchNews();
    }
  }, [societyId]); // Changed parameter name

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Changed parameter name
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
      setImage(event.target.files[0]);
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
        // Changed parameter name
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
      if (window.confirm('Discard changes?')) {
        setEditorMode('view');
        setSelectedNews(null);
      }
    } else if (selectedNews) {
      setSelectedNews(null);
    } else if (onBack) {
      onBack();
    }
  };

  // Render post item for the list view
  const renderNewsItem = (post: NewsPost) => {
    const isPublished = post.status === 'Published';
    const formattedDate = new Date(isPublished ? post.published_at || post.created_at : post.created_at).toLocaleDateString();
    
    return (
      <Paper 
        key={post.id}
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: colors.primary[400],
          position: 'relative',
          borderLeft: post.is_pinned ? `4px solid ${colors.greenAccent[500]}` : 'none',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {post.is_pinned && <PushPinIcon sx={{ mr: 1, verticalAlign: 'middle', color: colors.greenAccent[500] }} />}
              {post.title || '(Untitled)'}
            </Typography>
            
            <Box display="flex" alignItems="center" mt={1} mb={1}>
              <Chip 
                label={post.status} 
                size="small" 
                sx={{ 
                  backgroundColor: post.status === 'Published' 
                    ? colors.greenAccent[700] 
                    : colors.grey[700],
                  mr: 1 
                }} 
              />
              
              {post.is_featured && (
                <Chip 
                  icon={<StarIcon />} 
                  label="Featured" 
                  size="small" 
                  sx={{ backgroundColor: colors.blueAccent[700], mr: 1 }} 
                />
              )}
              
              {post.tags && post.tags.length > 0 && (
                <Box display="flex" alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  {post.tags.slice(0, 3).map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      sx={{ mr: 1, mb: 0.5 }} 
                    />
                  ))}
                  {post.tags.length > 3 && (
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      +{post.tags.length - 3} more
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            <Typography variant="body2" color={colors.grey[300]}>
              {post.status === 'Published' ? 'Published' : 'Created'} on {formattedDate} by {post.author_data?.full_name || 'Unknown'}
            </Typography>
            
            <Box mt={1} display="flex" alignItems="center">
              <VisibilityIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[400] }} />
              <Typography variant="caption" color={colors.grey[400]}>
                {post.view_count} views
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <IconButton onClick={(e) => handleMenuOpen(e, post.id)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Tabs value={tab} onChange={handleTabChange}>
              <Tab label="All News" />
              <Tab label="Published" />
              <Tab label="Drafts" />
            </Tabs>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNews}
              sx={{
                backgroundColor: colors.greenAccent[600],
                '&:hover': { backgroundColor: colors.greenAccent[700] }
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
            <Typography align="center" sx={{ py: 4 }}>
              No news posts found. Create your first news post!
            </Typography>
          ) : (
            <Box>
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
          >
            <MenuItem onClick={() => selectedId && handleViewNews(selectedId)}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
              View
            </MenuItem>
            <MenuItem onClick={() => {
              const post = news.find(n => n.id === selectedId);
              if (post) handleEditNews(post);
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => selectedId && handleDeleteNews(selectedId)}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </>
      )}
      
      {editorMode === 'view' && selectedNews && (
        <Paper sx={{ p: 3, backgroundColor: colors.primary[400] }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">{selectedNews.title || '(Untitled)'}</Typography>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => handleEditNews(selectedNews)}
            >
              Edit
            </Button>
          </Box>
          
          <Box display="flex" alignItems="center" mb={2}>
            <Chip 
              label={selectedNews.status} 
              sx={{ 
                backgroundColor: selectedNews.status === 'Published' 
                  ? colors.greenAccent[700] 
                  : colors.grey[700],
                mr: 1 
              }} 
            />
            
            {selectedNews.is_pinned && (
              <Chip 
                icon={<PushPinIcon />} 
                label="Pinned" 
                sx={{ backgroundColor: colors.greenAccent[700], mr: 1 }} 
              />
            )}
            
            {selectedNews.is_featured && (
              <Chip 
                icon={<StarIcon />} 
                label="Featured" 
                sx={{ backgroundColor: colors.blueAccent[700], mr: 1 }} 
              />
            )}
          </Box>
          
          <Typography variant="body2" color={colors.grey[300]} mb={2}>
            {selectedNews.status === 'Published' 
              ? `Published on ${new Date(selectedNews.published_at || selectedNews.created_at).toLocaleString()}` 
              : `Created on ${new Date(selectedNews.created_at).toLocaleString()}`} 
            by {selectedNews.author_data?.full_name || 'Unknown'}
          </Typography>
          
          {selectedNews.image_url && (
            <Box mb={3}>
              <img 
                src={selectedNews.image_url} 
                alt={selectedNews.title} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px', 
                  objectFit: 'contain',
                  borderRadius: '4px'
                }} 
              />
            </Box>
          )}
          
          <Box mb={3} className="quill-content-viewer">
            <div dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
          </Box>
          
          {selectedNews.attachment_name && (
            <Box mb={2}>
              <Typography variant="subtitle2">Attachment:</Typography>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                size="small"
              >
                {selectedNews.attachment_name}
              </Button>
            </Box>
          )}
          
          {selectedNews.tags && selectedNews.tags.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" mb={1}>Tags:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedNews.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" alignItems="center">
            <VisibilityIcon sx={{ mr: 1, color: colors.grey[300] }} />
            <Typography variant="body2" color={colors.grey[300]}>
              {selectedNews.view_count} views
            </Typography>
          </Box>
        </Paper>
      )}
      
      {(editorMode === 'create' || editorMode === 'edit') && (
        <Paper sx={{ p: 3, backgroundColor: colors.primary[400] }}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              required
            />
            
            <Box my={3}>
              <Typography variant="subtitle1" mb={1}>Content</Typography>
              <QuillWrapper
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                style={{ 
                  backgroundColor: colors.primary[500],
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
                    label="Status"
                  >
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Published">Published</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box mt={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Pin to top"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Feature this post"
                  />
                </Box>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <Typography variant="subtitle1" mb={1}>Add Tags</Typography>
              <Box display="flex" alignItems="center">
                <TextField
                  label="Tag"
                  variant="outlined"
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddTag}
                  disabled={!tagInput}
                >
                  Add
                </Button>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                {tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
            </Box>
            
            <Box mt={3}>
              <Typography variant="subtitle1" mb={1}>Media</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<ImageIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {image ? image.name : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFileIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {attachment ? attachment.name : 'Upload Attachment'}
                    <input
                      type="file"
                      hidden
                      onChange={handleAttachmentChange}
                    />
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
              <Button 
                variant="outlined" 
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={isSubmitting || !title || !content}
                sx={{
                  backgroundColor: colors.greenAccent[600],
                  '&:hover': { backgroundColor: colors.greenAccent[700] }
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  status === 'Published' ? 'Publish' : 'Save Draft'
                )}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default SocietyNewsManager;