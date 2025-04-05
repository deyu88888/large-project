import { useEffect, useRef, useState } from "react";
import { CommentItem } from "./CommentItem";
import { apiClient } from "../api";
import { Box, Button, Pagination, TextField, Typography } from "@mui/material";
import { TextToggle } from "./TextToggle";
import { CommentType } from "../types/event/comment.ts";

// Main comment section component
export function CommentSection({ eventId }: { eventId: number }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sortOption, setSortOption] = useState<"time" | "popularity">("time");

  const [page, setPage] = useState(1);
  const [commentsPerPage, setCommentsPerPage] = useState(10);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    apiClient
      .get(`/api/comments/?event_id=${eventId}`)
      .then((res) => {
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

  const sortedComments = [...comments];
  if (sortOption === "popularity") {
    sortedComments.sort(
      (a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes)
    );
  }

  const totalComments = sortedComments.length;
  const totalPages = Math.ceil(totalComments / commentsPerPage);
  const displayedComments = sortedComments.slice(
    (page - 1) * commentsPerPage,
    page * commentsPerPage
  );

  // Display loading state
  if (loading) {
    return <p>Loading comments...</p>;
  }

  return (
    <div>
      <Typography
        variant="h4"
        align="center"
        marginTop="20px"
        marginBottom="20px"
      >
        Comments
      </Typography>

      <div style={{ marginBottom: "20px" }}>
        <TextField
          inputRef={textAreaRef}
          rows={1}
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
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

      <TextToggle
        sortOption={sortOption}
        setSortOption={setSortOption}
        commentsPerPage={commentsPerPage}
        setCommentsPerPage={setCommentsPerPage}
        setPage={setPage}
      />

      {displayedComments.length === 0 ? (
        <p>There is no comment now</p>
      ) : (
        displayedComments.map((comment, index) => (
          <div key={comment.id}>
            <CommentItem comment={comment} onReply={handleReply} />
            {index !== displayedComments.length - 1 && (
              <hr style={{ margin: "10px 0" }} />
            )}
          </div>
        ))
      )}

      {/* paginator */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </div>
  );
}

