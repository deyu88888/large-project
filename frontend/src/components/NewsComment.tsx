/******************************************************************************
 * src/components/NewsComment.tsx
 *
 * A modern React component for fetching and displaying comments under a news post,
 * with YouTube-like nested replies, likes, dislikes, and post-new-comment UI.
 ******************************************************************************/

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  IconButton,
  Skeleton,
  Paper,
  Divider,
  Tooltip,
  Collapse,
  Badge,
  useTheme,
  alpha,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Sort as SortIcon,
  NewReleases as NewReleasesIcon,
  ThumbUpAlt as ThumbUpAltIcon
} from "@mui/icons-material";
// No external animation or time libraries

import {
  getNewsComments,
  createNewsComment,
  deleteNewsComment,
  toggleLikeOnNewsComment,
  toggleDislikeOnNewsComment,
  NewsCommentData,
  CommentPayload,
} from "../api";

// -----------------------------------------------------------------------------
// Child Component: Renders a single comment and its replies
// -----------------------------------------------------------------------------
interface CommentItemProps {
  comment: NewsCommentData;
  onReply: (parentId: number, text: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onLike: (commentId: number) => Promise<void>;
  onDislike: (commentId: number) => Promise<void>;
  depth?: number;
}

/**
 * Displays a single comment, with user data, date, content, plus
 * the ability to reply, like, dislike, or delete (if authorized).
 * Recursively renders child replies with depth control.
 */
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onLike,
  onDislike,
  depth = 0,
}) => {
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
  const generatePastelColor = (name: string) => {
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
    if (!replyText.trim()) return;
    try {
      setIsSubmitting(true);
      await onReply(comment.id, replyText.trim());
      setReplyText("");
      setReplyMode(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
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

  return (
    <Box
      sx={{
        opacity: 1,
        mb: 2.5,
        position: 'relative',
        ...depthStyles
      }}
    >
      {/* Main Comment Container - YouTube style with no Paper container */}
      <Box>
        {/* Comment Header with Avatar and Username */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar 
            sx={{ 
              bgcolor: avatarColor,
              width: 40, 
              height: 40,
              fontSize: '1rem',
            }}
          >
            {avatarChar}
          </Avatar>
          
          <Box flex={1} sx={{ width: '100%' }}>
            {/* Username and Date */}
            <Box 
              display="flex" 
              alignItems="baseline" 
              sx={{ 
                mb: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Typography 
                variant="subtitle2" 
                fontWeight="bold" 
                sx={{ mr: 1 }}
              >
                {username}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
              >
                {formatTimeAgo(new Date(comment.created_at))}
              </Typography>
            </Box>

            {/* Comment Content */}
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                color: theme.palette.text.primary,
              }}
            >
              {comment.content}
            </Typography>

            {/* Actions */}
            <Stack 
              direction="row" 
              spacing={0.5} 
              alignItems="center" 
              sx={{ 
                mb: hasReplies ? 1.5 : 0.5,
              }}
            >
              <Tooltip title={comment.liked_by_user ? "Unlike" : "Like"}>
                <IconButton
                  onClick={handleLike}
                  size="small"
                  disableRipple
                  sx={{ 
                    p: 0.5,
                    borderRadius: '2px',
                  }}
                >
                  <Badge 
                    badgeContent={comment.likes_count > 0 ? comment.likes_count : null} 
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}
                  >
                    <ThumbUpIcon 
                      fontSize="small" 
                      sx={{ 
                        color: comment.liked_by_user ? '#1976d2' : alpha(theme.palette.text.primary, 0.6)
                      }}
                    />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={comment.disliked_by_user ? "Remove dislike" : "Dislike"}>
                <IconButton
                  onClick={handleDislike}
                  size="small"
                  disableRipple
                  sx={{ 
                    p: 0.5,
                    borderRadius: '2px',
                  }}
                >
                  <Badge 
                    badgeContent={comment.dislikes_count > 0 ? comment.dislikes_count : null}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}
                  >
                    <ThumbDownIcon 
                      fontSize="small" 
                      sx={{ 
                        color: comment.disliked_by_user ? '#d32f2f' : alpha(theme.palette.text.primary, 0.6)
                      }}
                    />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Reply">
                <IconButton
                  onClick={() => setReplyMode(!replyMode)}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    borderRadius: '2px',
                    color: replyMode ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.6),
                  }}
                >
                  <ReplyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete comment">
                <IconButton
                  onClick={handleDelete}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    borderRadius: '2px',
                    color: alpha(theme.palette.error.main, 0.8)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {hasReplies && (
                <Button 
                  size="small" 
                  onClick={toggleReplies}
                  variant="text"
                  sx={{ 
                    ml: 0.5,
                    color: theme.palette.text.primary,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    minWidth: 0,
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.text.primary, 0.04),
                    }
                  }}
                >
                  {showReplies ? "Hide replies" : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </Button>
              )}
            </Stack>

            {/* Reply Box - YouTube style */}
            <Collapse in={replyMode}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 1, mb: 1.5 }}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    opacity: 0.8,
                    fontSize: '0.75rem',
                  }}
                >
                  {avatarChar}
                </Avatar>
                <TextField
                  placeholder="Add a reply..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  multiline
                  maxRows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  InputProps={{
                    sx: { 
                      borderRadius: '4px', 
                      backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha(theme.palette.grey[100], 0.8),
                      '&.Mui-focused': {
                        boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    },
                    endAdornment: (
                      <IconButton 
                        edge="end" 
                        color={replyText.trim() ? "primary" : "default"}
                        disabled={!replyText.trim() || isSubmitting}
                        onClick={handleReplySubmit}
                        size="small"
                        sx={{
                          color: replyText.trim() ? theme.palette.text.primary : alpha(theme.palette.text.primary, 0.38),
                          mr: 0.5,
                          p: 0.5,
                          borderRadius: '50%',
                          '&.Mui-disabled': {
                            color: alpha(theme.palette.text.primary, 0.26)
                          }
                        }}
                      >
                        <SendIcon 
                          fontSize="small" 
                          sx={{ color: replyText.trim() ? theme.palette.primary.main : 'inherit' }}
                        />
                      </IconButton>
                    ),
                  }}
                />
              </Stack>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button 
                  size="small"
                  onClick={() => setReplyMode(false)}
                  sx={{
                    textTransform: 'none',
                    mr: 1,
                    color: theme.palette.text.secondary,
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  size="small"
                  disableElevation
                  disabled={!replyText.trim() || isSubmitting}
                  onClick={handleReplySubmit}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '18px',
                    px: 2,
                    fontWeight: 'bold',
                    '&.Mui-disabled': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.3),
                      color: alpha(theme.palette.background.paper, 0.5),
                    }
                  }}
                >
                  {isSubmitting ? "Replying..." : "Reply"}
                </Button>
              </Box>
            </Collapse>
          </Box>
        </Stack>

        {/* Child Replies */}
        {hasReplies && (
          <Collapse in={showReplies}>
            <Box sx={{ mt: 1 }}>
              {comment.replies.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  onReply={onReply}
                  onDelete={onDelete}
                  onLike={onLike}
                  onDislike={onDislike}
                  depth={depth + 1}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    </Box>
  );
};

// -----------------------------------------------------------------------------
// Main Component: NewsComment
// -----------------------------------------------------------------------------
interface NewsCommentProps {
  newsId: number;
}

/**
 * The parent component: loads top-level comments, renders them recursively
 * using CommentItem. Also includes a text box for posting a new top-level comment.
 */
// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
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

const NewsComment: React.FC<NewsCommentProps> = ({ newsId }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [comments, setComments] = useState<NewsCommentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [sortOption, setSortOption] = useState<string>("Top comments");
  
  // Handle sort menu open/close
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleSortChange = (option: string) => {
    setSortOption(option);
    handleSortClose();
    
    // Actually sort the comments
    if (option === "Top comments") {
      setComments(prev => [...prev].sort((a, b) => b.likes_count - a.likes_count));
    } else if (option === "Newest first") {
      setComments(prev => [...prev].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
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
        } else if (sortOption === "Newest first") {
          data.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        
        setComments(data);
        
        // Count total comments including replies
        const countAll = (items: NewsCommentData[]): number => {
          return items.reduce((acc, item) => {
            let count = 1; // Count this comment
            if (item.replies && item.replies.length > 0) {
              count += countAll(item.replies);
            }
            return acc + count;
          }, 0);
        };
        
        setCommentCount(countAll(data));
      } catch (error) {
        console.error("Error fetching comments:", error);
        setError("Failed to load comments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [newsId, sortOption]);

  /**
   * Insert a newly created reply into the comment tree
   */
  const insertReply = useCallback(
    (
      commentTree: NewsCommentData[],
      parentId: number,
      reply: NewsCommentData
    ): NewsCommentData[] => {
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
    },
    []
  );

  /**
   * Remove a comment from the tree after deletion
   */
  const removeComment = useCallback(
    (
      commentTree: NewsCommentData[],
      commentId: number
    ): NewsCommentData[] => {
      return commentTree
        .filter((c) => c.id !== commentId)
        .map((c) => {
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: removeComment(c.replies, commentId) };
          }
          return c;
        });
    },
    []
  );

  /**
   * Update a single comment (like/dislike results) in the tree
   */
  const updateComment = useCallback(
    (
      commentTree: NewsCommentData[],
      updated: NewsCommentData
    ): NewsCommentData[] => {
      return commentTree.map((c) => {
        if (c.id === updated.id) {
          return updated;
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateComment(c.replies, updated) };
        }
        return c;
      });
    },
    []
  );

  /**
   * Post a new top-level comment
   */
  const handlePostComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload: CommentPayload = {
        content: commentText.trim(),
        parent_comment: null,
      };
      
      const newComment = await createNewsComment(newsId, payload);
      
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      setCommentCount(prev => prev + 1);
    } catch (error) {
      console.error("Error creating comment:", error);
      setError("Failed to post your comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Post a reply to an existing comment
   */
  const handlePostReply = async (parentId: number, text: string) => {
    if (!text) return;
    
    try {
      const payload: CommentPayload = {
        content: text,
        parent_comment: parentId,
      };
      
      const newReply = await createNewsComment(newsId, payload);
      setComments((prev) => insertReply(prev, parentId, newReply));
      setCommentCount(prev => prev + 1);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error creating reply:", error);
      return Promise.reject(error);
    }
  };

  /**
   * Delete a comment
   */
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteNewsComment(commentId);
      setComments((prev) => removeComment(prev, commentId));
      setCommentCount(prev => prev - 1); // This is approximate as we're not counting deleted replies
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting comment:", error);
      return Promise.reject(error);
    }
  };

  /**
   * Toggle Like (Updates UI instantly)
   */
  const handleLikeComment = async (commentId: number) => {
    // Optimistic UI update
    setComments((prev) =>
      updateLikeInCommentTree(prev, commentId)
    );

    try {
      const updated = await toggleLikeOnNewsComment(commentId);
      setComments((prev) => updateComment(prev, updated)); // Ensure API response updates the UI
      return Promise.resolve();
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update if API fails
      setComments((prev) =>
        revertLikeInCommentTree(prev, commentId)
      );
      return Promise.reject(error);
    }
  };

  // Helper function to update like state in comment tree
  const updateLikeInCommentTree = (comments: NewsCommentData[], commentId: number): NewsCommentData[] => {
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
  const revertLikeInCommentTree = (comments: NewsCommentData[], commentId: number): NewsCommentData[] => {
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
  const handleDislikeComment = async (commentId: number) => {
    // Optimistic UI update
    setComments((prev) =>
      updateDislikeInCommentTree(prev, commentId)
    );

    try {
      const updated = await toggleDislikeOnNewsComment(commentId);
      setComments((prev) => updateComment(prev, updated)); // Ensure API response updates the UI
      return Promise.resolve();
    } catch (error) {
      console.error("Error toggling dislike:", error);
      // Revert optimistic update if API fails
      setComments((prev) =>
        revertDislikeInCommentTree(prev, commentId)
      );
      return Promise.reject(error);
    }
  };

  // Helper function to update dislike state in comment tree
  const updateDislikeInCommentTree = (comments: NewsCommentData[], commentId: number): NewsCommentData[] => {
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
  const revertDislikeInCommentTree = (comments: NewsCommentData[], commentId: number): NewsCommentData[] => {
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
    return Array(3).fill(0).map((_, i) => (
      <Box key={i} sx={{ display: 'flex', mb: 3, opacity: 0.7 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1.5 }} />
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Skeleton width={120} height={20} sx={{ mr: 1 }} />
            <Skeleton width={80} height={16} />
          </Box>
          <Skeleton height={40} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex' }}>
            <Skeleton width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton width={24} height={24} />
          </Box>
        </Box>
      </Box>
    ));
  };

  return (
    <Box
      sx={{ 
        position: 'relative',
      }}
    >
      {/* Comments Header with count and sort button */}
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: 3
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
        </Typography>
        
        {!loading && comments.length > 0 && (
          <>
            <Button 
              variant="text" 
              size="small"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontWeight: 'bold'
              }}
            >
              {sortOption}
            </Button>
            
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              elevation={2}
              PaperProps={{
                sx: {
                  minWidth: 180,
                  boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
                  mt: 0.5
                }
              }}
            >
              <MenuItem 
                onClick={() => handleSortChange("Top comments")}
                selected={sortOption === "Top comments"}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ThumbUpAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Top comments" />
              </MenuItem>
              <MenuItem 
                onClick={() => handleSortChange("Newest first")}
                selected={sortOption === "Newest first"}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <NewReleasesIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Newest first" />
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {error && (
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main,
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            borderRadius: 1
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* New Top-Level Comment Input - YouTube style */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start' }}>
        <Avatar sx={{ mr: 1.5, width: 40, height: 40 }}>
          {/* User avatar */}
        </Avatar>
                  <Box sx={{ width: '100%' }}>
          <TextField
            placeholder="Add a comment..."
            variant="outlined"
            multiline
            fullWidth
            minRows={1}
            maxRows={6}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            InputProps={{
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
            }}
            sx={{ mb: commentText ? 1 : 0 }}
          />
          
          {/* Comment submission buttons (visible only when text is entered) */}
          <Collapse in={!!commentText.trim()}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button 
                size="small"
                onClick={() => setCommentText('')}
                sx={{
                  textTransform: 'none',
                  mr: 1,
                  color: theme.palette.text.secondary,
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                size="small"
                disableElevation
                disabled={!commentText.trim() || isSubmitting}
                onClick={handlePostComment}
                sx={{
                  textTransform: 'none',
                  borderRadius: '18px',
                  px: 2,
                  fontWeight: 'bold',
                  '&.Mui-disabled': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    color: alpha(theme.palette.background.paper, 0.5),
                  }
                }}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* Comments List */}
      <Box sx={{ mt: 3 }}>
        {loading ? (
          renderSkeletons()
        ) : comments.length === 0 ? (
          <Box 
            sx={{ 
              py: 4,
              textAlign: 'center',
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No comments yet. Be the first to share your thoughts!
            </Typography>
          </Box>
        ) : (
          <Box>
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={handlePostReply}
                onDelete={handleDeleteComment}
                onLike={handleLikeComment}
                onDislike={handleDislikeComment}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NewsComment;