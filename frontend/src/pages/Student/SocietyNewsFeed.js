import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme, Box, Typography, Paper, Button, CircularProgress, Chip, Avatar, Divider, Card, CardContent, CardActions, IconButton } from '@mui/material';
import { tokens } from '../../theme/theme';
import { apiClient, } from "../../api";
import NewsComment from "../../components/NewsComment";
import { Comment as CommentIcon, StarOutline as StarOutlineIcon, PushPin as PushPinIcon, Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
// Utility functions
const formatDateTime = (dateString) => {
    if (!dateString)
        return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};
// Component for society avatar with fallback
const SocietyAvatar = ({ society, size = 40 }) => {
    return (_jsx(Avatar, { src: society.icon || undefined, sx: { width: size, height: size, mr: 2 }, alt: society.name, children: society.name.charAt(0) }));
};
// Component for post tags
const PostTags = ({ tags, isFeatured, maxVisible = 3 }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Box, { display: "flex", flexWrap: "wrap", mb: 1, children: [isFeatured && (_jsx(Chip, { icon: _jsx(StarOutlineIcon, {}), label: "Featured", size: "small", sx: { backgroundColor: colors.blueAccent[700], mr: 1, mb: 1 } })), tags.slice(0, maxVisible).map(tag => (_jsx(Chip, { label: tag, size: "small", sx: {
                    mr: 1,
                    mb: 1,
                    backgroundColor: colors.grey[700],
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: colors.grey[600],
                    }
                } }, tag))), tags.length > maxVisible && (_jsxs(Typography, { variant: "caption", sx: { color: colors.grey[300] }, children: ["+", tags.length - maxVisible, " more"] }))] }));
};
// Component for post stats (views and comments)
const PostStats = ({ viewCount, commentCount, size = "medium" }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const fontSize = size === "small" ? 16 : 18;
    const marginRight = size === "small" ? 0.5 : 1;
    const marginBetween = size === "small" ? 2 : 3;
    const textVariant = size === "small" ? "caption" : "body2";
    return (_jsxs(Box, { display: "flex", alignItems: "center", children: [_jsxs(Box, { display: "flex", alignItems: "center", mr: marginBetween, children: [_jsx(VisibilityIcon, { sx: { fontSize, mr: marginRight, color: colors.grey[300] } }), _jsxs(Typography, { variant: textVariant, color: colors.grey[300], children: [viewCount, " ", size === "medium" && "views"] })] }), _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(CommentIcon, { sx: { fontSize, mr: marginRight, color: colors.grey[300] } }), _jsxs(Typography, { variant: textVariant, color: colors.grey[300], children: [commentCount, " ", size === "medium" && "comments"] })] })] }));
};
// Component for bookmark button
const BookmarkButton = ({ postId, bookmarked, onToggleBookmark, size = "medium" }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isBookmarked = bookmarked.includes(postId);
    return (_jsx(IconButton, { size: size, onClick: (e) => {
            e.stopPropagation();
            onToggleBookmark(postId);
        }, sx: {
            color: isBookmarked ? colors.greenAccent[500] : colors.grey[300],
            transition: 'all 0.2s ease',
            '&:hover': {
                color: isBookmarked ? colors.greenAccent[400] : colors.grey[200],
                transform: 'scale(1.1)',
            },
        }, children: isBookmarked ? _jsx(BookmarkIcon, {}) : _jsx(BookmarkBorderIcon, {}) }));
};
// Main component
const SocietyNewsFeed = ({ societyId }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    // State
    const [loading, setLoading] = useState(true);
    const [newsPosts, setNewsPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [bookmarked, setBookmarked] = useState([]);
    // Track hidden post IDs
    const [hiddenPosts, setHiddenPosts] = useState(() => {
        const saved = localStorage.getItem('hiddenNewsPosts');
        return saved ? JSON.parse(saved) : [];
    });
    // Fetch news data
    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = societyId
                ? `/api/society/${societyId}/news/`
                : '/api/my-news-feed/';
            const response = await apiClient.get(endpoint);
            setNewsPosts(response.data);
        }
        catch (error) {
            console.error('Error fetching news:', error);
        }
        finally {
            setLoading(false);
        }
    }, [societyId]);
    // Load data on mount and when societyId changes
    useEffect(() => {
        fetchNews();
        // Load bookmarks from localStorage
        const savedBookmarks = localStorage.getItem('newsBookmarks');
        if (savedBookmarks) {
            setBookmarked(JSON.parse(savedBookmarks));
        }
    }, [societyId, fetchNews]);
    // Handlers
    const handlePostClick = useCallback((post) => {
        setSelectedPost(post);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    const handleBackToFeed = useCallback(() => {
        setSelectedPost(null);
    }, []);
    // Hide post handler
    const handleHidePost = useCallback((postId) => {
        setHiddenPosts(prev => {
            const updated = [...prev, postId];
            localStorage.setItem('hiddenNewsPosts', JSON.stringify(updated));
            return updated;
        });
    }, []);
    const toggleBookmark = useCallback((postId) => {
        setBookmarked(prev => {
            const updatedBookmarks = prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId];
            // Save to localStorage
            localStorage.setItem('newsBookmarks', JSON.stringify(updatedBookmarks));
            return updatedBookmarks;
        });
    }, []);
    // Memoized sorted posts
    const sortedPosts = useMemo(() => {
        return [...newsPosts].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned)
                return -1;
            if (!a.is_pinned && b.is_pinned)
                return 1;
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });
    }, [newsPosts]);
    // Filter out hidden posts
    const visiblePosts = useMemo(() => {
        return sortedPosts.filter(post => !hiddenPosts.includes(post.id));
    }, [sortedPosts, hiddenPosts]);
    // Detailed post view component
    const DetailedPostView = useCallback(() => {
        if (!selectedPost)
            return null;
        return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.3 }, children: _jsxs(Box, { children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, children: [_jsx(IconButton, { onClick: handleBackToFeed, sx: {
                                    mr: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                        backgroundColor: colors.primary[300],
                                    }
                                }, children: _jsx(ArrowBackIcon, {}) }), _jsx(Typography, { variant: "h5", children: "News Post" })] }), _jsxs(Paper, { elevation: 3, sx: {
                            backgroundColor: colors.primary[400],
                            overflow: 'hidden',
                            borderRadius: '8px',
                            boxShadow: `0 6px 20px rgba(0, 0, 0, 0.15)`,
                        }, children: [selectedPost.image_url && (_jsx(Box, { sx: {
                                    height: '300px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: colors.primary[600],
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '40px',
                                        background: `linear-gradient(to top, ${colors.primary[400]}, transparent)`,
                                    }
                                }, children: _jsx("img", { src: selectedPost.image_url, alt: selectedPost.title, style: {
                                        width: '100%',
                                        objectFit: 'cover',
                                        maxHeight: '100%',
                                        transition: 'transform 0.3s ease-in-out',
                                    } }) })), _jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(SocietyAvatar, { society: selectedPost.society_data }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: selectedPost.society_data.name }), _jsxs(Typography, { variant: "caption", color: colors.grey[300], children: ["Posted by ", selectedPost.author_data.full_name, " on", " ", formatDateTime(selectedPost.published_at)] })] })] }), _jsxs(Typography, { variant: "h4", fontWeight: "bold", mb: 2, children: [selectedPost.is_pinned && (_jsx(PushPinIcon, { sx: {
                                                    mr: 1,
                                                    verticalAlign: 'middle',
                                                    color: colors.greenAccent[500],
                                                } })), selectedPost.title] }), _jsx(Box, { mb: 3, children: _jsx(PostTags, { tags: selectedPost.tags, isFeatured: selectedPost.is_featured, maxVisible: 10 }) }), _jsx(Box, { mb: 3, sx: {
                                            fontSize: '1rem',
                                            lineHeight: 1.6,
                                            '& img': {
                                                maxWidth: '100%',
                                                borderRadius: '4px',
                                                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
                                            },
                                            '& a': {
                                                color: colors.blueAccent[300],
                                                textDecoration: 'none',
                                                borderBottom: `1px solid ${colors.blueAccent[500]}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    color: colors.blueAccent[200],
                                                    borderBottomColor: colors.blueAccent[300],
                                                }
                                            },
                                            '& p': {
                                                marginBottom: '1em',
                                            },
                                            '& blockquote': {
                                                borderLeft: `4px solid ${colors.blueAccent[500]}`,
                                                padding: '0.5em 1em',
                                                backgroundColor: colors.primary[500],
                                                borderRadius: '0 4px 4px 0',
                                            }
                                        }, dangerouslySetInnerHTML: { __html: selectedPost.content } }), selectedPost.attachment_name && (_jsxs(Button, { variant: "outlined", sx: {
                                            mt: 2,
                                            mb: 3,
                                            borderColor: colors.blueAccent[400],
                                            color: colors.blueAccent[300],
                                            '&:hover': {
                                                borderColor: colors.blueAccent[300],
                                                backgroundColor: colors.primary[500],
                                            }
                                        }, startIcon: _jsx(BookmarkIcon, {}), children: ["Download ", selectedPost.attachment_name] })), _jsx(Divider, { sx: { mb: 3 } }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(PostStats, { viewCount: selectedPost.view_count, commentCount: selectedPost.comment_count }), _jsxs(Box, { display: "flex", alignItems: "center", children: [_jsx(BookmarkButton, { postId: selectedPost.id, bookmarked: bookmarked, onToggleBookmark: toggleBookmark }), _jsx(motion.div, { whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 }, children: _jsx(IconButton, { onClick: () => {
                                                                handleHidePost(selectedPost.id);
                                                                handleBackToFeed();
                                                            }, sx: {
                                                                ml: 1,
                                                                color: colors.grey[300],
                                                                '&:hover': {
                                                                    color: colors.grey[100],
                                                                    backgroundColor: colors.primary[300],
                                                                }
                                                            }, children: _jsx(VisibilityOffIcon, {}) }) })] })] })] }), _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Divider, { sx: { mb: 3 } }), _jsx(Typography, { variant: "h5", sx: { mb: 2 }, children: "Discussion" }), _jsx(Box, { mt: 2, children: _jsx(NewsComment, { newsId: selectedPost.id }) })] })] })] }) }));
    }, [selectedPost, handleBackToFeed, colors, bookmarked, toggleBookmark, handleHidePost]);
    // News Feed List Card Component
    const NewsCard = useCallback(({ post }) => {
        return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, whileHover: { y: -4 }, transition: { duration: 0.2 }, children: _jsxs(Card, { sx: {
                    mb: 3,
                    backgroundColor: colors.primary[400],
                    borderLeft: post.is_pinned ? `4px solid ${colors.greenAccent[500]}` : 'none',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: post.is_pinned
                        ? `0 6px 15px rgba(0, 0, 0, 0.15), 0 0 0 1px ${colors.greenAccent[800]}`
                        : `0 4px 12px rgba(0, 0, 0, 0.1)`,
                    '&:hover': {
                        boxShadow: post.is_pinned
                            ? `0 10px 25px rgba(0, 0, 0, 0.2), 0 0 0 2px ${colors.greenAccent[700]}`
                            : `0 8px 20px rgba(0, 0, 0, 0.15)`,
                    },
                }, children: [_jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 2, children: [_jsx(SocietyAvatar, { society: post.society_data, size: 32 }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", children: post.society_data.name }), _jsx(Typography, { variant: "caption", color: colors.grey[300], children: formatDateTime(post.published_at) })] })] }), _jsxs(Box, { sx: {
                                    cursor: 'pointer',
                                    '&:hover h5': { color: colors.blueAccent[300] },
                                }, onClick: () => handlePostClick(post), children: [_jsxs(Typography, { variant: "h5", fontWeight: "bold", mb: 1, children: [post.is_pinned && (_jsx(PushPinIcon, { sx: {
                                                    mr: 1,
                                                    verticalAlign: 'middle',
                                                    color: colors.greenAccent[500],
                                                    fontSize: '0.9em',
                                                } })), post.title] }), post.image_url && (_jsx(Box, { sx: {
                                            height: '200px',
                                            overflow: 'hidden',
                                            borderRadius: 1,
                                            mb: 2,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: colors.primary[600],
                                            position: 'relative',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '30px',
                                                background: `linear-gradient(to top, ${colors.primary[400]}, transparent)`,
                                            }
                                        }, children: _jsx("img", { src: post.image_url, alt: post.title, style: {
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease',
                                            } }) })), _jsx(Box, { sx: {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            mb: 2,
                                            color: colors.grey[200],
                                            lineHeight: 1.6,
                                        }, dangerouslySetInnerHTML: {
                                            __html: post.content.replace(/<img[^>]*>/g, '[Image]'),
                                        } })] }), _jsx(PostTags, { tags: post.tags, isFeatured: post.is_featured })] }), _jsx(CardActions, { sx: { justifyContent: 'flex-end', px: 2, pb: 2 }, children: _jsx(Box, { display: "flex", alignItems: "center", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                    e.stopPropagation();
                                    handleHidePost(post.id);
                                }, "aria-label": "Hide post", sx: {
                                    color: colors.grey[300],
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        color: colors.grey[100],
                                        backgroundColor: colors.primary[300],
                                        transform: 'scale(1.1)',
                                    }
                                }, children: _jsx(VisibilityOffIcon, { fontSize: "small" }) }) }) })] }) }));
    }, [colors, handlePostClick, handleHidePost]);
    const NewsFeed = useCallback(() => {
        if (loading) {
            return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: "200px", children: _jsx(CircularProgress, { sx: { color: colors.blueAccent[400] } }) }));
        }
        if (visiblePosts.length === 0) {
            return (_jsxs(Box, { textAlign: "center", p: 4, sx: {
                    backgroundColor: colors.primary[400],
                    borderRadius: '8px',
                    padding: '40px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }, children: [_jsx(Typography, { variant: "h6", color: colors.grey[300], children: newsPosts.length === 0
                            ? (societyId
                                ? "This society hasn't posted any news yet."
                                : "No news posts from your societies yet.")
                            : "All posts are currently hidden. Refresh the page to reset." }), newsPosts.length > 0 && hiddenPosts.length > 0 && (_jsx(Button, { variant: "outlined", onClick: () => {
                            setHiddenPosts([]);
                            localStorage.removeItem('hiddenNewsPosts');
                        }, sx: {
                            mt: 2,
                            borderColor: colors.blueAccent[400],
                            color: colors.blueAccent[300],
                            '&:hover': {
                                borderColor: colors.blueAccent[300],
                                backgroundColor: colors.primary[500],
                            }
                        }, children: "Show All Posts" }))] }));
        }
        return (_jsx(AnimatePresence, { children: _jsx(Box, { children: visiblePosts.map((post) => (_jsx(NewsCard, { post: post }, post.id))) }) }));
    }, [loading, newsPosts, visiblePosts, hiddenPosts, societyId, colors, NewsCard]);
    return (_jsx(Box, { sx: { width: '100%', maxWidth: '1200px', margin: '0 auto' }, children: _jsx(AnimatePresence, { mode: "wait", children: selectedPost ? _jsx(DetailedPostView, {}) : _jsx(NewsFeed, {}) }) }));
};
export default SocietyNewsFeed;
