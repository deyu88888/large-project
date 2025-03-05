import React, { useState } from "react";
import { apiClient } from "../api";
import {
  CircularProgress,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  IconButton,
} from "@mui/material";
import { format } from "date-fns";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";

interface CommentSectionProps {
  eventId?: string;
  comments: any[];
  setComments: React.Dispatch<React.SetStateAction<any[]>>;
  loading?: boolean;
}

function CommentMeta({
  formattedDate,
  likeCount,
  dislikeCount,
  onReply,
}: {
  formattedDate: string;
  likeCount: number;
  dislikeCount: number;
  onReply: () => void;
}) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ color: "text.secondary" }}>
      <Typography variant="caption">{formattedDate}</Typography>
      <Box display="flex" alignItems="center">
        <IconButton size="small" color="inherit" sx={{ p: 0.2 }}>
          <ThumbUpIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="caption" sx={{ ml: 0.5 }}>
          {likeCount}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center">
        <IconButton size="small" color="inherit" sx={{ p: 0.2 }}>
          <ThumbDownIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="caption" sx={{ ml: 0.5 }}>
          {dislikeCount}
        </Typography>
      </Box>
      <Button variant="text" size="small" onClick={onReply}>
        reply
      </Button>
    </Stack>
  );
}

interface CommentItemProps {
  comment: any;
  eventId?: string;
  setComments: React.Dispatch<React.SetStateAction<any[]>>;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, eventId, setComments, level = 0 }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  // reply the comment
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !eventId) return;
    try {
      const response = await apiClient.post(`/api/event/${eventId}/comments`, {
        content: replyContent,
        parent_comment: comment.id,
      });
      const newReply = response.data;
      setComments((prevComments) => {
        const insertReply = (commentsList: any[]): any[] => {
          return commentsList.map((c) => {
            if (c.id === comment.id) {
              const updatedReplies = c.replies ? [newReply, ...c.replies] : [newReply];
              return { ...c, replies: updatedReplies };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: insertReply(c.replies) };
            }
            return c;
          });
        };
        return insertReply(prevComments);
      });
      setReplyContent("");
      setShowReplyBox(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  const formattedDate = format(new Date(comment.create_at), "yyyy-MM-dd HH:mm:ss");

  return (
    <Box sx={{ ml: level * 2, mt: 1, borderLeft: level > 0 ? "1px solid #ddd" : "none", pl: level > 0 ? 1 : 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
        {comment.user_data?.username || "Anonymous"}:
      </Typography>
      <Typography variant="body2">{comment.content}</Typography>
      <CommentMeta
        formattedDate={formattedDate}
        likeCount={comment.likeCount ?? 0}
        dislikeCount={comment.dislikeCount ?? 0}
        onReply={() => setShowReplyBox(!showReplyBox)}
      />
      {showReplyBox && (
        <Box sx={{ mt: 1 }}>
          <TextField
            label="Your reply"
            variant="outlined"
            fullWidth
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            size="small"
          />
          <Button variant="contained" onClick={handleSubmitReply} sx={{ mt: 1 }} disabled={!replyContent.trim()}>
            Submit Reply
          </Button>
        </Box>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <Box>
          {comment.replies.map((child: any) => (
            <CommentItem key={child.id} comment={child} eventId={eventId} setComments={setComments} level={level + 1} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  eventId,
  comments,
  setComments,
  loading = false,
}) => {
  const [newComment, setNewComment] = useState("");

  // Post the comment
  const handlePostComment = async () => {
    if (!newComment.trim() || !eventId) return;
    try {
      const response = await apiClient.post(`/api/event/${eventId}/comments`, { content: newComment });
      setComments([response.data, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <Typography variant="h5">Comments</Typography>
      <TextField
        label="Add a comment"
        variant="outlined"
        fullWidth
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        style={{ margin: "10px 0" }}
      />
      <Button variant="contained" color="primary" onClick={handlePostComment} disabled={!newComment.trim()}>
        Post
      </Button>
      {loading && <CircularProgress style={{ display: "block", margin: "20px auto" }} />}
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} eventId={eventId} setComments={setComments} />
      ))}
    </div>
  );
};

export default CommentSection;
