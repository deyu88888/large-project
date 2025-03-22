import { useEffect, useRef, useState } from "react";
import { CommentItem } from "./CommentItem";
import { apiClient } from "../api";
import { Button, Typography } from "@mui/material";

// Define comment type interface
interface CommentType {
  id: number;
  content: string;
  create_at: string;
  user_data: {
    id: number;
    username: string;
  };
  parent_comment: number | null;
  replies: CommentType[];
  likes: number;
  dislikes: number;
  liked_by_user: boolean;
  disliked_by_user: boolean;
}

// Main comment section component
export function CommentSection({ eventId }: { eventId: number }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    apiClient
      .get(`/api/comments/?event_id=${eventId}`)
      .then((res) => {
        console.log("Fetched comments:", res.data);
        setComments(res.data);
      })
      .catch((err) => console.error("Error fetching comments:", err))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Handle submitting a new comment
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    apiClient
      .post(`/api/comments/?event_id=${eventId}`, {
        event: eventId,
        content: newComment,
      })
      .then((res) => {
        setComments((prev) => [...prev, res.data]);
        setNewComment("");

        // Reset textarea height after submission
        if (textAreaRef.current) {
          textAreaRef.current.style.height = "auto";
        }
      })
      .catch((err) => console.error("Error creating comment:", err));
  };

  // Handle submitting a reply to a comment
  const handleReply = (parentId: number, content: string) => {
    apiClient
      .post(`/api/comments/?event_id=${eventId}`, {
        event: eventId,
        content,
        parent_comment: parentId,
      })
      .then((res) => {
        const newReply = res.data as CommentType;
        const updatedComments = addReplyToTree(comments, parentId, newReply);
        setComments(updatedComments);
      })
      .catch((err) => console.error("Error replying to comment:", err));
  };

  // Recursively add a reply to the correct position in the comment tree
  function addReplyToTree(
    list: CommentType[],
    parentId: number,
    newReply: CommentType
  ): CommentType[] {
    return list.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...c.replies, newReply] };
      } else if (c.replies && c.replies.length > 0) {
        return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
      } else {
        return c;
      }
    });
  }

  // Display loading state
  if (loading) {
    return <p>Loading comments...</p>;
  }

  return (
    <div>
      {/* Comments Section Header */}
      <Typography
        variant="h2"
        align="center"
        marginTop="20px"
        marginBottom="20px"
      >
        Comments
      </Typography>

      {/* New Comment Input */}
      <div style={{ marginBottom: "20px" }}>
        <textarea
          ref={textAreaRef}
          rows={1}
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
            // Auto-resize textarea height
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          style={{
            width: "100%",
            border: "2px solid black",
            borderRadius: "4px",
            padding: "8px",
            marginBottom: "8px",
            resize: "none",
            overflow: "hidden",
          }}
        />
        <Button
          onClick={handleSubmitComment}
          variant="contained"
          color="secondary"
          sx={{
            display: "block",
            margin: "auto",
          }}
        >
          Post the Comment
        </Button>
      </div>

      {comments.length === 0 ? (
        <p>There is no comment now</p>
      ) : (
        comments.map((comment, index) => (
          <div key={comment.id}>
            <CommentItem comment={comment} onReply={handleReply} />
            {index !== comments.length - 1 && (
              <hr style={{ margin: "10px 0" }} />
            )}
          </div>
        ))
      )}
    </div>
  );
}

