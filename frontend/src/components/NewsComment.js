import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/******************************************************************************
 * src/components/NewsComment.tsx
 *
 * A modern React component for fetching and displaying comments under a news post,
 * with YouTube-like nested replies, likes, dislikes, and post-new-comment UI.
 ******************************************************************************/
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, TextField, Button, Avatar, IconButton, Skeleton, Tooltip, Collapse, Badge, useTheme, alpha, Stack, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { ThumbUp as ThumbUpIcon, ThumbDown as ThumbDownIcon, Delete as DeleteIcon, Reply as ReplyIcon, Send as SendIcon, Sort as SortIcon, NewReleases as NewReleasesIcon, ThumbUpAlt as ThumbUpAltIcon } from "@mui/icons-material";
// No external animation or time libraries
import { getNewsComments, createNewsComment, deleteNewsComment, toggleLikeOnNewsComment, toggleDislikeOnNewsComment, } from "../api";
/**
 * Displays a single comment, with user data, date, content, plus
 * the ability to reply, like, dislike, or delete (if authorized).
 * Recursively renders child replies with depth control.
 */
const CommentItem = ({ comment, onReply, onDelete, onLike, onDislike, depth = 0, }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const userData = comment.user_data;
    const username = userData?.username || "Anonymous";
    const avatarChar = username.charAt(0).toUpperCase();
    // Local state for toggling reply mode + storing reply text
    const [replyMode, setReplyMode] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    // Calculate if we should render child replies or collapse them at deep nesting levels
    const hasReplies = comment.replies && comment.replies.length > 0;
    const maxDepth = 5; // Limit the visual nesting to prevent extreme indentation
    const actualDepth = Math.min(depth, maxDepth);
    // Generate pastel color for avatar based on username
    const generatePastelColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Generate pastel colors using HSL
        const h = hash % 360;
        return `hsl(${h}, 70%, 80%)`;
    };
    const avatarColor = generatePastelColor(username);
    const handleReplySubmit = async () => {
        if (!replyText.trim())
            return;
        try {
            setIsSubmitting(true);
            await onReply(comment.id, replyText.trim());
            setReplyText("");
            setReplyMode(false);
        }
        catch (error) {
            console.error("Error posting reply:", error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleLike = () => {
        onLike(comment.id);
    };
    const handleDislike = () => {
        onDislike(comment.id);
    };
    const handleDelete = () => {
        onDelete(comment.id);
    };
    const toggleReplies = () => {
        setShowReplies(prev => !prev);
    };
    // Border and indentation styles based on nesting depth
    const depthStyles = {
        marginLeft: actualDepth > 0 ? '20px' : 0,
        paddingLeft: actualDepth > 0 ? '16px' : 0,
        borderLeft: actualDepth > 0 ? `2px solid ${alpha(theme.palette.divider, 0.6)}` : 'none',
    };
    return (_jsx(Box, { sx: {
            opacity: 1,
            mb: 2.5,
            position: 'relative',
            ...depthStyles
        }, children: _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "flex-start", children: [_jsx(Avatar, { sx: {
                                bgcolor: avatarColor,
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                            }, children: avatarChar }), _jsxs(Box, { flex: 1, sx: { width: '100%' }, children: [_jsxs(Box, { display: "flex", alignItems: "baseline", sx: {
                                        mb: 0.5,
                                        flexWrap: 'wrap',
                                    }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: "bold", sx: { mr: 1 }, children: username }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: formatTimeAgo(new Date(comment.created_at)) })] }), _jsx(Typography, { variant: "body2", sx: {
                                        mb: 1,
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-line',
                                        color: theme.palette.text.primary,
                                    }, children: comment.content }), _jsxs(Stack, { direction: "row", spacing: 0.5, alignItems: "center", sx: {
                                        mb: hasReplies ? 1.5 : 0.5,
                                    }, children: [_jsx(Tooltip, { title: comment.liked_by_user ? "Unlike" : "Like", children: _jsx(IconButton, { onClick: handleLike, size: "small", disableRipple: true, sx: {
                                                    p: 0.5,
                                                    borderRadius: '2px',
                                                }, children: _jsx(Badge, { badgeContent: comment.likes_count > 0 ? comment.likes_count : null, color: "primary", sx: { '& .MuiBadge-badge': { fontSize: '0.65rem' } }, children: _jsx(ThumbUpIcon, { fontSize: "small", sx: {
                                                            color: comment.liked_by_user ? '#1976d2' : alpha(theme.palette.text.primary, 0.6)
                                                        } }) }) }) }), _jsx(Tooltip, { title: comment.disliked_by_user ? "Remove dislike" : "Dislike", children: _jsx(IconButton, { onClick: handleDislike, size: "small", disableRipple: true, sx: {
                                                    p: 0.5,
                                                    borderRadius: '2px',
                                                }, children: _jsx(Badge, { badgeContent: comment.dislikes_count > 0 ? comment.dislikes_count : null, color: "error", sx: { '& .MuiBadge-badge': { fontSize: '0.65rem' } }, children: _jsx(ThumbDownIcon, { fontSize: "small", sx: {
                                                            color: comment.disliked_by_user ? '#d32f2f' : alpha(theme.palette.text.primary, 0.6)
                                                        } }) }) }) }), _jsx(Tooltip, { title: "Reply", children: _jsx(IconButton, { onClick: () => setReplyMode(!replyMode), size: "small", sx: {
                                                    p: 0.5,
                                                    borderRadius: '2px',
                                                    color: replyMode ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.6),
                                                }, children: _jsx(ReplyIcon, { fontSize: "small" }) }) }), _jsx(Tooltip, { title: "Delete comment", children: _jsx(IconButton, { onClick: handleDelete, size: "small", sx: {
                                                    p: 0.5,
                                                    borderRadius: '2px',
                                                    color: alpha(theme.palette.error.main, 0.8)
                                                }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) }), hasReplies && (_jsx(Button, { size: "small", onClick: toggleReplies, variant: "text", sx: {
                                                ml: 0.5,
                                                color: theme.palette.text.primary,
                                                textTransform: 'none',
                                                fontWeight: 'bold',
                                                minWidth: 0,
                                                p: 0.5,
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.text.primary, 0.04),
                                                }
                                            }, children: showReplies ? "Hide replies" : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}` }))] }), _jsxs(Collapse, { in: replyMode, children: [_jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "flex-start", sx: { mt: 1, mb: 1.5 }, children: [_jsx(Avatar, { sx: {
                                                        width: 24,
                                                        height: 24,
                                                        opacity: 0.8,
                                                        fontSize: '0.75rem',
                                                    }, children: avatarChar }), _jsx(TextField, { placeholder: "Add a reply...", variant: "outlined", size: "small", fullWidth: true, multiline: true, maxRows: 4, value: replyText, onChange: (e) => setReplyText(e.target.value), InputProps: {
                                                        sx: {
                                                            borderRadius: '4px',
                                                            backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha(theme.palette.grey[100], 0.8),
                                                            '&.Mui-focused': {
                                                                boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                                            }
                                                        },
                                                        endAdornment: (_jsx(IconButton, { edge: "end", color: replyText.trim() ? "primary" : "default", disabled: !replyText.trim() || isSubmitting, onClick: handleReplySubmit, size: "small", sx: {
                                                                color: replyText.trim() ? theme.palette.text.primary : alpha(theme.palette.text.primary, 0.38),
                                                                mr: 0.5,
                                                                p: 0.5,
                                                                borderRadius: '50%',
                                                                '&.Mui-disabled': {
                                                                    color: alpha(theme.palette.text.primary, 0.26)
                                                                }
                                                            }, children: _jsx(SendIcon, { fontSize: "small", sx: { color: replyText.trim() ? theme.palette.primary.main : 'inherit' } }) })),
                                                    } })] }), _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', mb: 1 }, children: [_jsx(Button, { size: "small", onClick: () => setReplyMode(false), sx: {
                                                        textTransform: 'none',
                                                        mr: 1,
                                                        color: theme.palette.text.secondary,
                                                    }, children: "Cancel" }), _jsx(Button, { variant: "contained", size: "small", disableElevation: true, disabled: !replyText.trim() || isSubmitting, onClick: handleReplySubmit, sx: {
                                                        textTransform: 'none',
                                                        borderRadius: '18px',
                                                        px: 2,
                                                        fontWeight: 'bold',
                                                        '&.Mui-disabled': {
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.3),
                                                            color: alpha(theme.palette.background.paper, 0.5),
                                                        }
                                                    }, children: isSubmitting ? "Replying..." : "Reply" })] })] })] })] }), hasReplies && (_jsx(Collapse, { in: showReplies, children: _jsx(Box, { sx: { mt: 1 }, children: comment.replies.map((child) => (_jsx(CommentItem, { comment: child, onReply: onReply, onDelete: onDelete, onLike: onLike, onDislike: onDislike, depth: depth + 1 }, child.id))) }) }))] }) }));
};
/**
 * The parent component: loads top-level comments, renders them recursively
 * using CommentItem. Also includes a text box for posting a new top-level comment.
 */
// Helper function to format time ago
const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};
const NewsComment = ({ newsId }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [commentCount, setCommentCount] = useState(0);
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const [sortOption, setSortOption] = useState("Top comments");
    // Handle sort menu open/close
    const handleSortClick = (event) => {
        setSortAnchorEl(event.currentTarget);
    };
    const handleSortClose = () => {
        setSortAnchorEl(null);
    };
    const handleSortChange = (option) => {
        setSortOption(option);
        handleSortClose();
        // Actually sort the comments
        if (option === "Top comments") {
            setComments(prev => [...prev].sort((a, b) => b.likes_count - a.likes_count));
        }
        else if (option === "Newest first") {
            setComments(prev => [...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
    };
    // Fetch existing comments
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getNewsComments(newsId);
                // Apply the current sort option to the fetched data
                if (sortOption === "Top comments") {
                    data.sort((a, b) => b.likes_count - a.likes_count);
                }
                else if (sortOption === "Newest first") {
                    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
                setComments(data);
                // Count total comments including replies
                const countAll = (items) => {
                    return items.reduce((acc, item) => {
                        let count = 1; // Count this comment
                        if (item.replies && item.replies.length > 0) {
                            count += countAll(item.replies);
                        }
                        return acc + count;
                    }, 0);
                };
                setCommentCount(countAll(data));
            }
            catch (error) {
                console.error("Error fetching comments:", error);
                setError("Failed to load comments. Please try again later.");
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [newsId, sortOption]);
    /**
     * Insert a newly created reply into the comment tree
     */
    const insertReply = useCallback((commentTree, parentId, reply) => {
        return commentTree.map((c) => {
            if (c.id === parentId) {
                // Insert into c.replies
                return {
                    ...c,
                    replies: c.replies ? [...c.replies, reply] : [reply],
                };
            }
            // Recursively check child replies
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: insertReply(c.replies, parentId, reply) };
            }
            return c;
        });
    }, []);
    /**
     * Remove a comment from the tree after deletion
     */
    const removeComment = useCallback((commentTree, commentId) => {
        return commentTree
            .filter((c) => c.id !== commentId)
            .map((c) => {
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: removeComment(c.replies, commentId) };
            }
            return c;
        });
    }, []);
    /**
     * Update a single comment (like/dislike results) in the tree
     */
    const updateComment = useCallback((commentTree, updated) => {
        return commentTree.map((c) => {
            if (c.id === updated.id) {
                return updated;
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateComment(c.replies, updated) };
            }
            return c;
        });
    }, []);
    /**
     * Post a new top-level comment
     */
    const handlePostComment = async () => {
        if (!commentText.trim() || isSubmitting)
            return;
        try {
            setIsSubmitting(true);
            setError(null);
            const payload = {
                content: commentText.trim(),
                parent_comment: null,
            };
            const newComment = await createNewsComment(newsId, payload);
            setComments((prev) => [...prev, newComment]);
            setCommentText("");
            setCommentCount(prev => prev + 1);
        }
        catch (error) {
            console.error("Error creating comment:", error);
            setError("Failed to post your comment. Please try again.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    /**
     * Post a reply to an existing comment
     */
    const handlePostReply = async (parentId, text) => {
        if (!text)
            return;
        try {
            const payload = {
                content: text,
                parent_comment: parentId,
            };
            const newReply = await createNewsComment(newsId, payload);
            setComments((prev) => insertReply(prev, parentId, newReply));
            setCommentCount(prev => prev + 1);
            return Promise.resolve();
        }
        catch (error) {
            console.error("Error creating reply:", error);
            return Promise.reject(error);
        }
    };
    /**
     * Delete a comment
     */
    const handleDeleteComment = async (commentId) => {
        try {
            await deleteNewsComment(commentId);
            setComments((prev) => removeComment(prev, commentId));
            setCommentCount(prev => prev - 1); // This is approximate as we're not counting deleted replies
            return Promise.resolve();
        }
        catch (error) {
            console.error("Error deleting comment:", error);
            return Promise.reject(error);
        }
    };
    /**
     * Toggle Like (Updates UI instantly)
     */
    const handleLikeComment = async (commentId) => {
        // Optimistic UI update
        setComments((prev) => updateLikeInCommentTree(prev, commentId));
        try {
            const updated = await toggleLikeOnNewsComment(commentId);
            setComments((prev) => updateComment(prev, updated)); // Ensure API response updates the UI
            return Promise.resolve();
        }
        catch (error) {
            console.error("Error toggling like:", error);
            // Revert optimistic update if API fails
            setComments((prev) => revertLikeInCommentTree(prev, commentId));
            return Promise.reject(error);
        }
    };
    // Helper function to update like state in comment tree
    const updateLikeInCommentTree = (comments, commentId) => {
        return comments.map((c) => {
            if (c.id === commentId) {
                const isCurrentlyLiked = c.liked_by_user;
                const isCurrentlyDisliked = c.disliked_by_user;
                return {
                    ...c,
                    liked_by_user: !isCurrentlyLiked, // Toggle like state
                    likes_count: isCurrentlyLiked ? c.likes_count - 1 : c.likes_count + 1, // Adjust like count
                    disliked_by_user: isCurrentlyDisliked ? false : c.disliked_by_user, // Ensure dislike is removed
                    dislikes_count: isCurrentlyDisliked ? c.dislikes_count - 1 : c.dislikes_count,
                };
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateLikeInCommentTree(c.replies, commentId) };
            }
            return c;
        });
    };
    // Helper function to revert like state in comment tree (used if API fails)
    const revertLikeInCommentTree = (comments, commentId) => {
        return comments.map((c) => {
            if (c.id === commentId) {
                const isCurrentlyLiked = c.liked_by_user;
                const isCurrentlyDisliked = c.disliked_by_user;
                return {
                    ...c,
                    liked_by_user: !isCurrentlyLiked, // Revert toggle
                    likes_count: isCurrentlyLiked ? c.likes_count - 1 : c.likes_count + 1, // Revert count
                    disliked_by_user: isCurrentlyDisliked, // Keep dislike state
                    dislikes_count: c.dislikes_count, // Keep dislike count
                };
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: revertLikeInCommentTree(c.replies, commentId) };
            }
            return c;
        });
    };
    /**
     * Toggle Dislike (Updates UI instantly)
     */
    const handleDislikeComment = async (commentId) => {
        // Optimistic UI update
        setComments((prev) => updateDislikeInCommentTree(prev, commentId));
        try {
            const updated = await toggleDislikeOnNewsComment(commentId);
            setComments((prev) => updateComment(prev, updated)); // Ensure API response updates the UI
            return Promise.resolve();
        }
        catch (error) {
            console.error("Error toggling dislike:", error);
            // Revert optimistic update if API fails
            setComments((prev) => revertDislikeInCommentTree(prev, commentId));
            return Promise.reject(error);
        }
    };
    // Helper function to update dislike state in comment tree
    const updateDislikeInCommentTree = (comments, commentId) => {
        return comments.map((c) => {
            if (c.id === commentId) {
                const isCurrentlyLiked = c.liked_by_user;
                const isCurrentlyDisliked = c.disliked_by_user;
                return {
                    ...c,
                    disliked_by_user: !isCurrentlyDisliked, // Toggle dislike state
                    dislikes_count: isCurrentlyDisliked ? c.dislikes_count - 1 : c.dislikes_count + 1, // Adjust dislike count
                    liked_by_user: isCurrentlyLiked ? false : c.liked_by_user, // Ensure like is removed
                    likes_count: isCurrentlyLiked ? c.likes_count - 1 : c.likes_count,
                };
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateDislikeInCommentTree(c.replies, commentId) };
            }
            return c;
        });
    };
    // Helper function to revert dislike state in comment tree (used if API fails)
    const revertDislikeInCommentTree = (comments, commentId) => {
        return comments.map((c) => {
            if (c.id === commentId) {
                const isCurrentlyLiked = c.liked_by_user;
                const isCurrentlyDisliked = c.disliked_by_user;
                return {
                    ...c,
                    disliked_by_user: !isCurrentlyDisliked, // Revert toggle
                    dislikes_count: isCurrentlyDisliked ? c.dislikes_count - 1 : c.dislikes_count + 1, // Revert count
                    liked_by_user: isCurrentlyLiked, // Keep like state
                    likes_count: c.likes_count, // Keep like count
                };
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: revertDislikeInCommentTree(c.replies, commentId) };
            }
            return c;
        });
    };
    // Render loading skeletons
    const renderSkeletons = () => {
        return Array(3).fill(0).map((_, i) => (_jsxs(Box, { sx: { display: 'flex', mb: 3, opacity: 0.7 }, children: [_jsx(Skeleton, { variant: "circular", width: 40, height: 40, sx: { mr: 1.5 } }), _jsxs(Box, { sx: { width: '100%' }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 0.5 }, children: [_jsx(Skeleton, { width: 120, height: 20, sx: { mr: 1 } }), _jsx(Skeleton, { width: 80, height: 16 })] }), _jsx(Skeleton, { height: 40, sx: { mb: 1 } }), _jsxs(Box, { sx: { display: 'flex' }, children: [_jsx(Skeleton, { width: 24, height: 24, sx: { mr: 1 } }), _jsx(Skeleton, { width: 24, height: 24, sx: { mr: 1 } }), _jsx(Skeleton, { width: 24, height: 24 })] })] })] }, i)));
    };
    return (_jsxs(Box, { sx: {
            position: 'relative',
        }, children: [_jsxs(Box, { sx: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    mb: 3
                }, children: [_jsxs(Typography, { variant: "h6", fontWeight: "bold", children: [commentCount, " ", commentCount === 1 ? 'Comment' : 'Comments'] }), !loading && comments.length > 0 && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "text", size: "small", startIcon: _jsx(SortIcon, {}), onClick: handleSortClick, sx: {
                                    textTransform: 'none',
                                    color: theme.palette.text.secondary,
                                    fontWeight: 'bold'
                                }, children: sortOption }), _jsxs(Menu, { anchorEl: sortAnchorEl, open: Boolean(sortAnchorEl), onClose: handleSortClose, anchorOrigin: {
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }, transformOrigin: {
                                    vertical: 'top',
                                    horizontal: 'right',
                                }, elevation: 2, PaperProps: {
                                    sx: {
                                        minWidth: 180,
                                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
                                        mt: 0.5
                                    }
                                }, children: [_jsxs(MenuItem, { onClick: () => handleSortChange("Top comments"), selected: sortOption === "Top comments", sx: { py: 1.5 }, children: [_jsx(ListItemIcon, { sx: { minWidth: 36 }, children: _jsx(ThumbUpAltIcon, { fontSize: "small" }) }), _jsx(ListItemText, { primary: "Top comments" })] }), _jsxs(MenuItem, { onClick: () => handleSortChange("Newest first"), selected: sortOption === "Newest first", sx: { py: 1.5 }, children: [_jsx(ListItemIcon, { sx: { minWidth: 36 }, children: _jsx(NewReleasesIcon, { fontSize: "small" }) }), _jsx(ListItemText, { primary: "Newest first" })] })] })] }))] }), error && (_jsx(Box, { sx: {
                    p: 2,
                    mb: 3,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    borderRadius: 1
                }, children: _jsx(Typography, { variant: "body2", children: error }) })), _jsxs(Box, { sx: { mb: 4, display: 'flex', alignItems: 'flex-start' }, children: [_jsx(Avatar, { sx: { mr: 1.5, width: 40, height: 40 } }), _jsxs(Box, { sx: { width: '100%' }, children: [_jsx(TextField, { placeholder: "Add a comment...", variant: "outlined", multiline: true, fullWidth: true, minRows: 1, maxRows: 6, value: commentText, onChange: (e) => setCommentText(e.target.value), InputProps: {
                                    sx: {
                                        padding: '12px 0',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderWidth: 0,
                                            borderBottomWidth: '1px',
                                            borderRadius: 0,
                                            borderColor: alpha(theme.palette.divider, 0.7),
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.divider,
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: '0 0 2px 0',
                                        },
                                    }
                                }, sx: { mb: commentText ? 1 : 0 } }), _jsx(Collapse, { in: !!commentText.trim(), children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'flex-end', mt: 1 }, children: [_jsx(Button, { size: "small", onClick: () => setCommentText(''), sx: {
                                                textTransform: 'none',
                                                mr: 1,
                                                color: theme.palette.text.secondary,
                                            }, children: "Cancel" }), _jsx(Button, { variant: "contained", size: "small", disableElevation: true, disabled: !commentText.trim() || isSubmitting, onClick: handlePostComment, sx: {
                                                textTransform: 'none',
                                                borderRadius: '18px',
                                                px: 2,
                                                fontWeight: 'bold',
                                                '&.Mui-disabled': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                                                    color: alpha(theme.palette.background.paper, 0.5),
                                                }
                                            }, children: isSubmitting ? "Posting..." : "Comment" })] }) })] })] }), _jsx(Box, { sx: { mt: 3 }, children: loading ? (renderSkeletons()) : comments.length === 0 ? (_jsx(Box, { sx: {
                        py: 4,
                        textAlign: 'center',
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    }, children: _jsx(Typography, { variant: "body1", color: "text.secondary", children: "No comments yet. Be the first to share your thoughts!" }) })) : (_jsx(Box, { children: comments.map((c) => (_jsx(CommentItem, { comment: c, onReply: handlePostReply, onDelete: handleDeleteComment, onLike: handleLikeComment, onDislike: handleDislikeComment }, c.id))) })) })] }));
};
export default NewsComment;
