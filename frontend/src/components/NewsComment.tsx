/******************************************************************************
 * src/components/NewsComment.tsx
 *
 * A React component for fetching and displaying comments under a news post,
 * with "YouTube-like" nested replies, likes, dislikes, and post-new-comment UI.
 ******************************************************************************/

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
} from "@mui/icons-material";

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
  onReply: (parentId: number, text: string) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  onDislike: (commentId: number) => void;
}

/**
 * Displays a single comment, with user data, date, content, plus
 * the ability to reply, like, dislike, or delete (if authorized).
 * Recursively renders child replies.
 */
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onLike,
  onDislike,
}) => {
  const userData = comment.user_data;
  const username = userData?.username || "???";
  const avatarChar = username.charAt(0).toUpperCase();

  // Local state for toggling reply mode + storing reply text
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplyMode(false);
  };

  const likeColor = comment.liked_by_user ? "primary" : "default";
  const dislikeColor = comment.disliked_by_user ? "primary" : "default";

  return (
    <Box
      key={comment.id}
      mb={2}
      sx={{ borderLeft: "1px solid #ccc", pl: 1 }}
    >
      {/* Comment Header */}
      <Box display="flex" alignItems="center" mb={1}>
        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
          {avatarChar}
        </Avatar>
        <Box>
          <Typography variant="subtitle2">{username}</Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date(comment.created_at).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Comment Content */}
      <Typography variant="body1" sx={{ ml: 6, mb: 1 }}>
        {comment.content}
      </Typography>

      {/* Actions */}
      <Box display="flex" alignItems="center" ml={6} mb={1}>
        <IconButton
          onClick={() => onLike(comment.id)}
          color={comment.liked_by_user ? "primary" : "default"}
          size="small"
          sx={{ mr: 1 }}
        >
          <ThumbUpIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="caption" sx={{ mr: 2 }}>
          {comment.likes_count}
        </Typography>

        <IconButton
          onClick={() => onDislike(comment.id)}
          color={comment.disliked_by_user ? "primary" : "default"}
          size="small"
          sx={{ mr: 1 }}
        >
          <ThumbDownIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="caption" sx={{ mr: 2 }}>
          {comment.dislikes_count}
        </Typography>

        <IconButton
          onClick={() => setReplyMode(!replyMode)}
          size="small"
          sx={{ mr: 2 }}
        >
          <ReplyIcon fontSize="inherit" />
        </IconButton>

        {/* The app logic can conditionally show or hide a Delete button
         * based on user/author/officer constraints. For demonstration,
         * we always show it:
         */}
        <IconButton
          onClick={() => onDelete(comment.id)}
          color="error"
          size="small"
        >
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </Box>

      {/* Reply Box */}
      {replyMode && (
        <Box ml={8} mb={1}>
          <TextField
            label="Write a reply..."
            variant="outlined"
            size="small"
            fullWidth
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button variant="contained" onClick={handleReplySubmit}>
            Post Reply
          </Button>
        </Box>
      )}

      {/* Child Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box ml={2}>
          {comment.replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              onDislike={onDislike}
            />
          ))}
        </Box>
      )}
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
const NewsComment: React.FC<NewsCommentProps> = ({ newsId }) => {
  const [comments, setComments] = useState<NewsCommentData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>("");

  // Fetch existing comments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getNewsComments(newsId);
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [newsId]);

  /**
   * Insert a newly created reply into the comment tree
   */
  const insertReply = (
    commentTree: NewsCommentData,
    parentId: number,
    reply: NewsCommentData
  ): NewsCommentData=> {
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
  };

  /**
   * Remove a comment from the tree after deletion
   */
  const removeComment = (
    commentTree: NewsCommentData,
    commentId: number
  ): NewsCommentData=> {
    return commentTree
      .filter((c) => c.id !== commentId)
      .map((c) => {
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: removeComment(c.replies, commentId) };
        }
        return c;
      });
  };

  /**
   * Update a single comment (like/dislike results) in the tree
   */
  const updateComment = (
    commentTree: NewsCommentData,
    updated: NewsCommentData
  ): NewsCommentData=> {
    return commentTree.map((c) => {
      if (c.id === updated.id) {
        return updated;
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: updateComment(c.replies, updated) };
      }
      return c;
    });
  };

  /**
   * Post a new top-level comment
   */
  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      const payload: CommentPayload = {
        content: commentText.trim(),
        parent_comment: null,
      };
      const newComment = await createNewsComment(newsId, payload);
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
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
    } catch (error) {
      console.error("Error creating reply:", error);
    }
  };

  /**
   * Delete a comment
   */
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteNewsComment(commentId);
      setComments((prev) => removeComment(prev, commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  /**
   * Toggle Like (Updates UI instantly)
   */
  const handleLikeComment = async (commentId: number) => {
    setComments((prev) =>
      prev.map((c) => {
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
        if (c.replies) {
          return { ...c, replies: handleLikeCommentOnReplies(c.replies, commentId) };
        }
        return c;
      })
    );

    try {
      const updated = await toggleLikeOnNewsComment(commentId);
      setComments((prev) => updateComment(prev, updated)); // Ensure API response updates the UI
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleLikeCommentOnReplies = (
    replies: NewsCommentData,
    commentId: number
  ): NewsCommentData=> {
    return replies.map((reply) => {
      if (reply.id === commentId) {
        const isCurrentlyLiked = reply.liked_by_user;
        const isCurrentlyDisliked = reply.disliked_by_user;
        return {
          ...reply,
          liked_by_user: !isCurrentlyLiked,
          likes_count: isCurrentlyLiked ? reply.likes_count - 1 : reply.likes_count + 1,
          disliked_by_user: isCurrentlyDisliked ? false : reply.disliked_by_user,
          dislikes_count: isCurrentlyDisliked ? reply.dislikes_count - 1 : reply.dislikes_count,
        };
      }
      if (reply.replies) {
        return { ...reply, replies: handleLikeCommentOnReplies(reply.replies, commentId) };
      }
      return reply;
    });
  };

  /**
   * Toggle Dislike (Updates UI instantly)
   */
  const handleDislikeComment = async (commentId: number) => {
    setComments((prev) =>
      prev.map((c) => {
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
        if (c.replies) {
          return { ...c, replies: handleDislikeCommentOnReplies(c.replies, commentId) };
        }
        return c;
      })
    );

    try {
      const updated = await toggleDislikeOnNewsComment(commentId);
      setComments((prev) => updateComment(prev, updated)); // Ensure API response updates the UI
    } catch (error) {
      console.error("Error toggling dislike:", error);
    }
  };

  const handleDislikeCommentOnReplies = (
    replies: NewsCommentData,
    commentId: number
  ): NewsCommentData=> {
    return replies.map((reply) => {
      if (reply.id === commentId) {
        const isCurrentlyLiked = reply.liked_by_user;
        const isCurrentlyDisliked = reply.disliked_by_user;
        return {
          ...reply,
          disliked_by_user: !isCurrentlyDisliked,
          dislikes_count: isCurrentlyDisliked ? reply.dislikes_count - 1 : reply.dislikes_count + 1,
          liked_by_user: isCurrentlyLiked ? false : reply.liked_by_user,
          likes_count: isCurrentlyLiked ? reply.likes_count - 1 : reply.likes_count,
        };
      }
      if (reply.replies) {
        return { ...reply, replies: handleDislikeCommentOnReplies(reply.replies, commentId) };
      }
      return reply;
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comments
      </Typography>

      {loading ? (
        <Typography>Loading comments...</Typography>
      ) : comments.length === 0 ? (
        <Typography>No comments yet.</Typography>
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

      {/* New Top-Level Comment Input */}
      <Box display="flex" flexDirection="column" mt={3}>
        <TextField
          label="Write a comment..."
          multiline
          minRows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handlePostComment}>
          Post Comment
        </Button>
      </Box>
    </Box>
  );
};

export default NewsComment;