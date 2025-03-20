/******************************************************************************
 * src/components/NewsComment.tsx
 * 
 * A React component for fetching and displaying comments under a news post,
 * plus a text input to submit new comments.
 ******************************************************************************/

import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Avatar } from "@mui/material";
import {
  getNewsComments,
  createNewsComment,
  // Make sure your interfaces match the new structure from your serializer
  // The 'user_data' is returned instead of a plain 'user'
  NewsCommentData,
  CommentPayload,
} from "../api";

/**
 * The props we expect: just the ID of the news post
 */
interface NewsCommentProps {
  newsId: number;
}

/**
 * Fixed version: ensures 'comment.user_data' is used instead of 'comment.user'
 */
const NewsComment: React.FC<NewsCommentProps> = ({ newsId }) => {
  const [comments, setComments] = useState<NewsCommentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get an array of comments from your DRF endpoint
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
   * Post a new comment
   */
  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      const payload: CommentPayload = {
        content: commentText,
        parent_comment: null, // or set a parent_comment ID for replies
      };
      const newComment = await createNewsComment(newsId, payload);
      setComments(prev => [...prev, newComment]);
      setCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  /**
   * Render each comment item
   */
  const renderCommentItem = (comment: NewsCommentData) => {
    // Adjust to avoid crash if comment.user_data is missing
    const userData = comment.user_data;
    const username = userData?.username || "???";
    const avatarChar = username.charAt(0).toUpperCase();

    return (
      <Box key={comment.id} display="flex" mb={2}>
        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
          {avatarChar}
        </Avatar>
        <Box>
          <Typography variant="subtitle2">
            {username}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date(comment.created_at).toLocaleString()}
          </Typography>
          <Typography variant="body1" sx={{ mt: 0.5 }}>
            {comment.content}
          </Typography>
        </Box>
      </Box>
    );
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
          {comments.map(renderCommentItem)}
        </Box>
      )}

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