import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// Path: frontend/src/pages/President/SocietyNewsManager.tsx
// TODO: not refactored, issue: invalid json tag, fix this first 
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, TextField, Tabs, Tab, Select, MenuItem, FormControl, Chip, IconButton, CircularProgress, Grid, Divider, Menu, Switch, FormControlLabel, Avatar, Tooltip, Card, CardContent, CardActions } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { tokens } from '../../theme/theme';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, PushPin as PushPinIcon, Star as StarIcon, Image as ImageIcon, AttachFile as AttachFileIcon, MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon, CalendarToday as CalendarIcon, Person as PersonIcon, Comment as CommentIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { apiClient } from '../../api';
import NewsPublicationRequestButton from '../../components/NewsPublicationRequestButton';
// Custom wrapper component to avoid findDOMNode deprecation warning
const QuillWrapper = ({ value, onChange, style, modules, formats, theme }) => {
    const quillRef = useRef(null);
    return (_jsx("div", { className: "quill-container", children: _jsx(ReactQuill, { ref: quillRef, theme: theme, value: value, onChange: onChange, modules: modules, formats: formats, style: style }) }));
};
const SocietyNewsManager = ({ onBack }) => {
    const { societyId } = useParams();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [selectedNews, setSelectedNews] = useState(null);
    const [editorMode, setEditorMode] = useState('view');
    // New post state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('Draft');
    const [isPinned, setIsPinned] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [attachment, setAttachment] = useState(null);
    // Loading and action states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    // Editor configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
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
        }
        catch (error) {
            console.error('Error fetching news:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };
    const handleMenuOpen = (event, id) => {
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
    const handleEditNews = (news) => {
        setSelectedNews(news);
        setTitle(news.title);
        setContent(news.content);
        setStatus(news.status);
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
    const handleDeleteNews = async (id) => {
        if (window.confirm('Are you sure you want to delete this news post?')) {
            try {
                await apiClient.delete(`/api/news/${id}/`);
                setNews(prevNews => prevNews.filter(news => news.id !== id));
                handleMenuClose();
            }
            catch (error) {
                console.error('Error deleting news:', error);
            }
        }
    };
    const handleViewNews = (id) => {
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
    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };
    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImage(file);
            // Create a preview for the image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleAttachmentChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setAttachment(event.target.files[0]);
        }
    };
    const handleSubmit = async (e) => {
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
            }
            else if (editorMode === 'edit' && selectedNews) {
                response = await apiClient.put(`/api/news/${selectedNews.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            if (status === 'PendingApproval' && response?.data?.id) {
                try {
                    await apiClient.post('/api/news/publication-request/', {
                        news_post: response.data.id,
                    });
                    alert('Submitted for admin approval!');
                }
                catch (err) {
                    console.error('Failed to create publication request:', err);
                    alert('News post saved as draft, but failed to request publication.');
                }
            }
            // Refresh news list
            fetchNews();
            // Reset form and return to view mode
            setEditorMode('view');
            setSelectedNews(null);
        }
        catch (error) {
            console.error('Error submitting news:', error);
        }
        finally {
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
            }
            else {
                setEditorMode('view');
                setSelectedNews(null);
            }
        }
        else if (selectedNews) {
            setSelectedNews(null);
        }
        else {
            // Instead of just relying on onBack, use navigate if available
            if (onBack) {
                onBack();
            }
            else {
                // Navigate back using the router
                navigate(-1);
            }
        }
    };
    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Published':
                return colors.greenAccent[500];
            case 'PendingApproval':
                return colors.blueAccent[500];
            case 'Rejected':
                return colors.redAccent[500];
            case 'Draft':
                return colors.grey[500];
            case 'Archived':
                return colors.redAccent[500];
            default:
                return colors.grey[500];
        }
    };
    // Render post item for the list view
    const renderNewsItem = (post) => {
        const isPublished = post.status === 'Published';
        const formattedDate = new Date(isPublished ? post.published_at || post.created_at : post.created_at).toLocaleDateString();
        return (_jsxs(Card, { elevation: 3, sx: {
                mb: 3,
                backgroundColor: colors.primary[400],
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.3)',
                },
                borderLeft: post.is_pinned ? `4px solid ${colors.greenAccent[500]}` : 'none',
                overflow: 'visible'
            }, children: [_jsxs(CardContent, { sx: { p: 3 }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "flex-start", children: [_jsxs(Box, { children: [_jsxs(Typography, { variant: "h5", fontWeight: "bold", sx: { display: 'flex', alignItems: 'center', mb: 1.5 }, children: [post.is_pinned && (_jsx(Tooltip, { title: "Pinned", children: _jsx(PushPinIcon, { sx: { mr: 1, color: colors.greenAccent[500] } }) })), post.title || '(Untitled)'] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 2, children: [_jsx(Chip, { label: post.status, size: "small", sx: {
                                                        backgroundColor: getStatusColor(post.status),
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    } }), post.is_featured && (_jsx(Chip, { icon: _jsx(StarIcon, { sx: { color: '#fff !important' } }), label: "Featured", size: "small", sx: {
                                                        backgroundColor: colors.blueAccent[500],
                                                        color: '#fff'
                                                    } }))] })] }), _jsx(IconButton, { onClick: (e) => handleMenuOpen(e, post.id), sx: {
                                        backgroundColor: alpha(colors.grey[500], 0.1),
                                        '&:hover': {
                                            backgroundColor: alpha(colors.grey[500], 0.2),
                                        }
                                    }, children: _jsx(MoreVertIcon, {}) })] }), _jsx(Box, { sx: {
                                mb: 2,
                                maxHeight: '80px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: alpha(colors.grey[100], 0.8)
                            }, children: _jsx("div", { dangerouslySetInnerHTML: {
                                    __html: post.content.length > 150
                                        ? post.content.substring(0, 150) + '...'
                                        : post.content
                                } }) }), post.tags && post.tags.length > 0 && (_jsxs(Box, { display: "flex", alignItems: "center", sx: { flexWrap: 'wrap', gap: 0.5, mb: 2 }, children: [post.tags.slice(0, 3).map(tag => (_jsx(Chip, { label: tag, size: "small", sx: {
                                        backgroundColor: alpha(colors.grey[500], 0.2),
                                        color: colors.grey[100]
                                    } }, tag))), post.tags.length > 3 && (_jsxs(Typography, { variant: "caption", sx: { ml: 1, color: colors.grey[300] }, children: ["+", post.tags.length - 3, " more"] }))] })), _jsx(Divider, { sx: { mb: 2 } }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(CalendarIcon, { sx: { fontSize: 16, mr: 0.5, color: colors.grey[300] } }), _jsx(Typography, { variant: "caption", color: colors.grey[300], children: formattedDate })] }), _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(PersonIcon, { sx: { fontSize: 16, mr: 0.5, color: colors.grey[300] } }), _jsx(Typography, { variant: "caption", color: colors.grey[300], children: post.author_data?.full_name || 'Unknown' })] })] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(VisibilityIcon, { sx: { fontSize: 16, mr: 0.5, color: colors.grey[300] } }), _jsx(Typography, { variant: "caption", color: colors.grey[300], children: post.view_count })] }), post.comment_count > 0 && (_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(CommentIcon, { sx: { fontSize: 16, mr: 0.5, color: colors.grey[300] } }), _jsx(Typography, { variant: "caption", color: colors.grey[300], children: post.comment_count })] }))] })] })] }), _jsx(CardActions, { sx: { p: 0 }, children: _jsx(Button, { fullWidth: true, onClick: () => handleViewNews(post.id), sx: {
                            py: 1,
                            color: colors.grey[100],
                            '&:hover': {
                                backgroundColor: alpha(colors.blueAccent[700], 0.2),
                            }
                        }, startIcon: _jsx(VisibilityIcon, {}), children: "View Details" }) })] }, post.id));
    };
    return (_jsxs(Box, { sx: { width: '100%', p: { xs: 2, md: 3 } }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, sx: {
                    pb: 2,
                    borderBottom: `1px solid ${alpha(colors.grey[500], 0.3)}`
                }, children: [_jsx(IconButton, { onClick: handleBack, sx: {
                            mr: 1.5,
                            backgroundColor: alpha(colors.grey[500], 0.1),
                            '&:hover': {
                                backgroundColor: alpha(colors.grey[500], 0.2),
                            }
                        }, children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: editorMode === 'view'
                            ? selectedNews
                                ? selectedNews.title || '(Untitled News Post)'
                                : 'Society News Management'
                            : editorMode === 'create'
                                ? 'Create New News Post'
                                : 'Edit News Post' })] }), editorMode === 'view' && !selectedNews && (_jsxs(_Fragment, { children: [_jsxs(Box, { display: "flex", flexDirection: { xs: 'column', sm: 'row' }, justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2, children: [_jsxs(Tabs, { value: tab, onChange: handleTabChange, sx: {
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
                                }, children: [_jsx(Tab, { label: _jsx(Box, { display: "flex", alignItems: "center", gap: 1, children: _jsx("span", { children: "All News" }) }) }), _jsx(Tab, { label: _jsx(Box, { display: "flex", alignItems: "center", gap: 1, children: _jsx("span", { children: "Published" }) }) }), _jsx(Tab, { label: _jsx(Box, { display: "flex", alignItems: "center", gap: 1, children: _jsx("span", { children: "Drafts" }) }) }), _jsx(Tab, { label: _jsx(Box, { display: "flex", alignItems: "center", gap: 1, children: _jsx("span", { children: "Rejected" }) }) })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleCreateNews, sx: {
                                    backgroundColor: colors.greenAccent[600],
                                    '&:hover': { backgroundColor: colors.greenAccent[700] },
                                    fontWeight: 'bold',
                                    px: 3,
                                    py: 1,
                                    borderRadius: '8px'
                                }, children: "Create News" })] }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", p: 4, children: _jsx(CircularProgress, {}) })) : news.length === 0 ? (_jsxs(Paper, { elevation: 3, sx: {
                            p: 6,
                            textAlign: 'center',
                            backgroundColor: colors.primary[400],
                            borderRadius: '10px',
                        }, children: [_jsx(ImageIcon, { sx: { fontSize: 60, color: colors.grey[500], mb: 2 } }), _jsx(Typography, { variant: "h5", gutterBottom: true, children: "No news posts found" }), _jsx(Typography, { color: colors.grey[300], mb: 3, children: "Create your first news post to get started" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleCreateNews, sx: {
                                    backgroundColor: colors.greenAccent[600],
                                    '&:hover': { backgroundColor: colors.greenAccent[700] },
                                    fontWeight: 'bold',
                                    px: 3,
                                    py: 1,
                                }, children: "Create News" })] })) : (_jsx(Box, { sx: {
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                            gap: 3
                        }, children: news
                            .filter(post => {
                            console.log(`Post ID=${post.id}, Title=${post.title}, Status=${post.status}`);
                            if (tab === 0)
                                return true;
                            if (tab === 1)
                                return post.status === 'Published';
                            if (tab === 2)
                                return post.status === 'Draft';
                            if (tab === 3)
                                return post.status === 'Rejected';
                            return true;
                        })
                            .map(renderNewsItem) })), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, sx: {
                            '& .MuiPaper-root': {
                                backgroundColor: colors.primary[400],
                                borderRadius: '8px',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                            }
                        }, children: [_jsxs(MenuItem, { onClick: () => selectedId && handleViewNews(selectedId), children: [_jsx(VisibilityIcon, { fontSize: "small", sx: { mr: 1.5 } }), "View"] }), _jsxs(MenuItem, { onClick: () => {
                                    const post = news.find(n => n.id === selectedId);
                                    if (post)
                                        handleEditNews(post);
                                }, children: [_jsx(EditIcon, { fontSize: "small", sx: { mr: 1.5 } }), "Edit"] }), _jsxs(MenuItem, { onClick: () => selectedId && handleDeleteNews(selectedId), sx: { color: colors.redAccent[500] }, children: [_jsx(DeleteIcon, { fontSize: "small", sx: { mr: 1.5 } }), "Delete"] })] })] })), editorMode === 'view' && selectedNews && (_jsxs(Paper, { sx: {
                    p: 4,
                    backgroundColor: colors.primary[400],
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h4", fontWeight: "bold", children: selectedNews.title || '(Untitled)' }), _jsx(Button, { variant: "contained", startIcon: _jsx(EditIcon, {}), onClick: () => handleEditNews(selectedNews), sx: {
                                    backgroundColor: colors.blueAccent[600],
                                    '&:hover': { backgroundColor: colors.blueAccent[700] },
                                    fontWeight: 'bold',
                                    borderRadius: '8px'
                                }, children: "Edit" })] }), _jsxs(Box, { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 3, children: [_jsx(Chip, { label: selectedNews.status, sx: {
                                    backgroundColor: getStatusColor(selectedNews.status),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                } }), selectedNews.is_pinned && (_jsx(Chip, { icon: _jsx(PushPinIcon, { sx: { color: '#fff !important' } }), label: "Pinned", sx: {
                                    backgroundColor: colors.greenAccent[600],
                                    color: '#fff',
                                    fontWeight: 'bold'
                                } })), selectedNews.is_featured && (_jsx(Chip, { icon: _jsx(StarIcon, { sx: { color: '#fff !important' } }), label: "Featured", sx: {
                                    backgroundColor: colors.blueAccent[600],
                                    color: '#fff',
                                    fontWeight: 'bold'
                                } }))] }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, mb: 3, sx: {
                            backgroundColor: alpha(colors.grey[500], 0.1),
                            borderRadius: '8px',
                            p: 2
                        }, children: [_jsx(Avatar, { sx: { bgcolor: colors.blueAccent[500] }, children: selectedNews.author_data?.full_name?.[0]?.toUpperCase() || 'U' }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", children: selectedNews.author_data?.full_name || 'Unknown' }), _jsx(Typography, { variant: "body2", color: colors.grey[300], children: selectedNews.status === 'Published'
                                            ? `Published on ${new Date(selectedNews.published_at || selectedNews.created_at).toLocaleString()}`
                                            : `Created on ${new Date(selectedNews.created_at).toLocaleString()}` })] })] }), selectedNews.image_url && (_jsx(Box, { mb: 4, sx: { borderRadius: '10px', overflow: 'hidden' }, children: _jsx("img", { src: selectedNews.image_url, alt: selectedNews.title, style: {
                                width: '100%',
                                maxHeight: '500px',
                                objectFit: 'cover',
                                borderRadius: '10px'
                            } }) })), _jsx(Box, { mb: 4, className: "quill-content-viewer", sx: {
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
                        }, children: _jsx("div", { dangerouslySetInnerHTML: { __html: selectedNews.content } }) }), selectedNews.attachment_name && (_jsxs(Box, { mb: 3, sx: {
                            backgroundColor: alpha(colors.grey[500], 0.1),
                            p: 2,
                            borderRadius: '8px'
                        }, children: [_jsx(Typography, { variant: "subtitle2", mb: 1, fontWeight: "bold", children: "Attachment" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(AttachFileIcon, {}), size: "medium", sx: {
                                    color: colors.blueAccent[400],
                                    borderColor: colors.blueAccent[400],
                                    '&:hover': {
                                        backgroundColor: alpha(colors.blueAccent[400], 0.1),
                                        borderColor: colors.blueAccent[300],
                                    }
                                }, children: selectedNews.attachment_name })] })), selectedNews.tags && selectedNews.tags.length > 0 && (_jsxs(Box, { mb: 3, children: [_jsx(Typography, { variant: "subtitle2", mb: 1, fontWeight: "bold", children: "Tags" }), _jsx(Box, { display: "flex", flexWrap: "wrap", gap: 1, children: selectedNews.tags.map(tag => (_jsx(Chip, { label: tag, size: "medium", sx: {
                                        backgroundColor: alpha(colors.grey[500], 0.2),
                                        color: colors.grey[100],
                                        '&:hover': {
                                            backgroundColor: alpha(colors.grey[500], 0.3),
                                        }
                                    } }, tag))) })] })), _jsx(Divider, { sx: { my: 3 } }), _jsxs(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(VisibilityIcon, { sx: { mr: 1, color: colors.grey[300] } }), _jsxs(Typography, { variant: "body2", color: colors.grey[300], children: [selectedNews.view_count, " views"] })] }), selectedNews.comment_count > 0 && (_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(CommentIcon, { sx: { mr: 1, color: colors.grey[300] } }), _jsxs(Typography, { variant: "body2", color: colors.grey[300], children: [selectedNews.comment_count, " comments"] })] }))] }), _jsx(Button, { variant: "contained", color: "error", startIcon: _jsx(DeleteIcon, {}), onClick: () => handleDeleteNews(selectedNews.id), sx: {
                                    fontWeight: 'bold',
                                    '&:hover': { backgroundColor: colors.redAccent[600] },
                                    borderRadius: '8px',
                                }, children: "Delete" })] }), selectedNews.status === 'Rejected' && (_jsxs(Box, { mt: 3, p: 3, bgcolor: alpha(colors.redAccent[500], 0.1), borderRadius: 1, border: `1px solid ${alpha(colors.redAccent[500], 0.3)}`, children: [_jsx(Typography, { variant: "h6", color: colors.redAccent[500], fontWeight: "bold", children: "This post was rejected by the admin" }), selectedNews.admin_notes ? (_jsxs(Box, { mt: 2, p: 2, bgcolor: alpha(colors.primary[800], 0.3), borderRadius: 1, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", color: colors.grey[100], children: "Admin Feedback:" }), _jsx(Typography, { variant: "body1", color: colors.grey[100], mt: 1, children: selectedNews.admin_notes })] })) : (_jsx(Typography, { variant: "body2", color: colors.grey[300], mt: 1, children: "No specific feedback was provided." })), _jsx(Button, { variant: "contained", sx: {
                                    mt: 2,
                                    backgroundColor: colors.greenAccent[600],
                                    '&:hover': { backgroundColor: colors.greenAccent[700] },
                                }, onClick: () => handleEditNews(selectedNews), children: "Revise and Resubmit" })] })), (selectedNews.status === 'Draft' || selectedNews.status === 'Rejected') && (_jsx(Box, { mt: 2, children: _jsx(NewsPublicationRequestButton, { newsId: selectedNews.id, onSuccess: fetchNews }) }))] })), (editorMode === 'create' || editorMode === 'edit') && (_jsx(Paper, { sx: {
                    p: 4,
                    backgroundColor: colors.primary[400],
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Typography, { variant: "h6", mb: 2, fontWeight: "bold", children: "Title" }), _jsx(TextField, { placeholder: "Enter title", value: title, onChange: (e) => setTitle(e.target.value), fullWidth: true, variant: "filled", required: true, InputProps: {
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
                            }, sx: {
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
                            } }), _jsxs(Box, { mb: 4, children: [_jsx(Typography, { variant: "subtitle1", mb: 1, fontWeight: "bold", children: "Content" }), _jsx(QuillWrapper, { theme: "snow", value: content, onChange: setContent, modules: modules, formats: formats, style: {
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
                                    } })] }), _jsxs(Grid, { container: true, spacing: 3, mb: 4, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Paper, { sx: {
                                            p: 3,
                                            backgroundColor: alpha(colors.primary[500], 0.5),
                                            borderRadius: '8px',
                                            height: '100%',
                                        }, children: [_jsx(Typography, { variant: "h6", mb: 2, fontWeight: "bold", children: "Publication Settings" }), _jsxs(Box, { mb: 3, children: [_jsx(Typography, { variant: "body1", mb: 1, fontWeight: "medium", children: "Publication Status" }), _jsx(FormControl, { fullWidth: true, sx: {
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
                                                        }, children: _jsxs(Select, { value: status, onChange: (e) => setStatus(e.target.value), displayEmpty: true, sx: {
                                                                backgroundColor: alpha(colors.primary[600], 0.6),
                                                                borderRadius: '8px'
                                                            }, children: [_jsx(MenuItem, { value: "Draft", children: "Draft" }), _jsx(MenuItem, { value: "PendingApproval", children: "Submit for Approval" })] }) })] }), _jsxs(Box, { children: [_jsx(FormControlLabel, { control: _jsx(Switch, { checked: isPinned, onChange: (e) => setIsPinned(e.target.checked), color: "primary", sx: {
                                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                                    color: colors.greenAccent[600],
                                                                },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: colors.greenAccent[600],
                                                                },
                                                            } }), label: _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(PushPinIcon, { sx: { mr: 1, color: isPinned ? colors.greenAccent[500] : colors.grey[500] } }), _jsx(Typography, { children: "Pin to top" })] }) }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: isFeatured, onChange: (e) => setIsFeatured(e.target.checked), color: "primary", sx: {
                                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                                    color: colors.blueAccent[600],
                                                                },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: colors.blueAccent[600],
                                                                },
                                                            } }), label: _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(StarIcon, { sx: { mr: 1, color: isFeatured ? colors.blueAccent[500] : colors.grey[500] } }), _jsx(Typography, { children: "Feature this post" })] }) })] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Paper, { sx: {
                                            p: 3,
                                            backgroundColor: alpha(colors.primary[500], 0.5),
                                            borderRadius: '8px',
                                            height: '100%',
                                        }, children: [_jsx(Typography, { variant: "h6", mb: 2, fontWeight: "bold", children: "Tags" }), _jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(TextField, { placeholder: "Add a tag", variant: "filled", size: "small", value: tagInput, onChange: (e) => setTagInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag()), sx: {
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
                                                        }, InputProps: {
                                                            disableUnderline: true
                                                        } }), _jsx(Button, { variant: "contained", onClick: handleAddTag, disabled: !tagInput, sx: {
                                                            backgroundColor: colors.blueAccent[600],
                                                            '&:hover': { backgroundColor: colors.blueAccent[700] },
                                                            '&.Mui-disabled': {
                                                                backgroundColor: alpha(colors.grey[500], 0.3),
                                                            }
                                                        }, children: "Add" })] }), _jsx(Box, { display: "flex", flexWrap: "wrap", gap: 1, children: tags.length === 0 ? (_jsx(Typography, { variant: "body2", color: colors.grey[400], children: "No tags added yet. Tags help users find your content." })) : (tags.map(tag => (_jsx(Chip, { label: tag, onDelete: () => handleRemoveTag(tag), sx: {
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
                                                    } }, tag)))) })] }) })] }), _jsxs(Paper, { sx: {
                                p: 3,
                                backgroundColor: alpha(colors.primary[500], 0.5),
                                borderRadius: '8px',
                                mb: 4,
                            }, children: [_jsx(Typography, { variant: "h6", mb: 2, fontWeight: "bold", children: "Media" }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Box, { sx: {
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
                                                }, children: imagePreview ? (_jsxs(Box, { children: [_jsxs(Box, { sx: {
                                                                position: 'relative',
                                                                width: '100%',
                                                                height: '200px',
                                                                mb: 2,
                                                                borderRadius: '8px',
                                                                overflow: 'hidden',
                                                            }, children: [_jsx("img", { src: imagePreview, alt: "Preview", style: {
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                    } }), _jsx(Box, { sx: {
                                                                        position: 'absolute',
                                                                        top: 0,
                                                                        right: 0,
                                                                        m: 1
                                                                    }, children: _jsx(IconButton, { onClick: () => {
                                                                            setImage(null);
                                                                            setImagePreview(null);
                                                                        }, sx: {
                                                                            backgroundColor: alpha(colors.primary[900], 0.7),
                                                                            '&:hover': {
                                                                                backgroundColor: alpha(colors.primary[900], 0.9),
                                                                            }
                                                                        }, children: _jsx(DeleteIcon, { sx: { color: colors.grey[100] } }) }) })] }), _jsxs(Button, { component: "label", variant: "outlined", startIcon: _jsx(CloudUploadIcon, {}), sx: {
                                                                borderColor: colors.blueAccent[500],
                                                                color: colors.blueAccent[500],
                                                                '&:hover': {
                                                                    borderColor: colors.blueAccent[400],
                                                                    backgroundColor: alpha(colors.blueAccent[400], 0.1),
                                                                }
                                                            }, children: ["Change Image", _jsx("input", { type: "file", hidden: true, accept: "image/*", onChange: handleImageChange })] })] })) : (_jsxs(Button, { component: "label", sx: {
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '100%',
                                                        width: '100%',
                                                        cursor: 'pointer',
                                                        py: 4,
                                                        color: colors.grey[300],
                                                    }, children: [_jsx(CloudUploadIcon, { sx: { fontSize: 48, mb: 2, color: colors.grey[400] } }), _jsx(Typography, { variant: "body1", fontWeight: "bold", mb: 1, children: "Upload Featured Image" }), _jsx(Typography, { variant: "body2", color: colors.grey[400], children: "Drag & drop or click to browse" }), _jsx("input", { type: "file", hidden: true, accept: "image/*", onChange: handleImageChange })] })) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Box, { sx: {
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
                                                }, children: attachment ? (_jsxs(Box, { children: [_jsxs(Box, { sx: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mb: 2,
                                                                p: 2,
                                                                backgroundColor: alpha(colors.primary[700], 0.5),
                                                                borderRadius: '8px',
                                                            }, children: [_jsx(AttachFileIcon, { sx: { fontSize: 32, mr: 2, color: colors.grey[300] } }), _jsx(Typography, { noWrap: true, sx: { maxWidth: '80%' }, children: attachment.name }), _jsx(IconButton, { onClick: () => setAttachment(null), sx: {
                                                                        ml: 'auto',
                                                                        color: colors.grey[300],
                                                                        '&:hover': {
                                                                            color: colors.redAccent[400],
                                                                        }
                                                                    }, children: _jsx(DeleteIcon, {}) })] }), _jsxs(Button, { component: "label", variant: "outlined", startIcon: _jsx(CloudUploadIcon, {}), sx: {
                                                                borderColor: colors.blueAccent[500],
                                                                color: colors.blueAccent[500],
                                                                '&:hover': {
                                                                    borderColor: colors.blueAccent[400],
                                                                    backgroundColor: alpha(colors.blueAccent[400], 0.1),
                                                                }
                                                            }, children: ["Change Attachment", _jsx("input", { type: "file", hidden: true, onChange: handleAttachmentChange })] })] })) : (_jsxs(Button, { component: "label", sx: {
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '100%',
                                                        width: '100%',
                                                        cursor: 'pointer',
                                                        py: 4,
                                                        color: colors.grey[300],
                                                    }, children: [_jsx(AttachFileIcon, { sx: { fontSize: 48, mb: 2, color: colors.grey[400] } }), _jsx(Typography, { variant: "body1", fontWeight: "bold", mb: 1, children: "Upload Attachment" }), _jsx(Typography, { variant: "body2", color: colors.grey[400], children: "PDF, DOC, or other files" }), _jsx("input", { type: "file", hidden: true, onChange: handleAttachmentChange })] })) }) })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Button, { variant: "outlined", onClick: handleBack, disabled: isSubmitting, startIcon: _jsx(ArrowBackIcon, {}), sx: {
                                        borderColor: alpha(colors.grey[500], 0.5),
                                        color: colors.grey[300],
                                        '&:hover': {
                                            borderColor: colors.grey[300],
                                            backgroundColor: alpha(colors.grey[500], 0.1),
                                        }
                                    }, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: isSubmitting || !title || !content, startIcon: isSubmitting ? _jsx(CircularProgress, { size: 20 }) : null, sx: {
                                        backgroundColor: colors.greenAccent[600],
                                        '&:hover': { backgroundColor: colors.greenAccent[700] },
                                        fontWeight: 'bold',
                                        px: 4,
                                        py: 1.2,
                                        borderRadius: '8px'
                                    }, children: !isSubmitting && (status === 'Published' ? 'Publish' : status === 'PendingApproval' ? 'Submit for Approval' : 'Save Draft') })] })] }) }))] }));
};
export default SocietyNewsManager;
