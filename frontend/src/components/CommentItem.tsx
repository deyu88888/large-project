import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Pagination,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { ChatBubbleOutline, ThumbDown, ThumbUp } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { apiClient } from "../api";
import { HoverCard } from "./HoverCard";

interface CommentType {
  id: number;
  content: string;
  create_at: string;
  user_data: {
    id: number;
    username: string;
    icon?: string;
  };
  parent_comment: number | null;
  replies: CommentType[];
  likes: number;
  dislikes: number;
  liked_by_user: boolean;
  disliked_by_user: boolean;
}

interface Props {
  comment: CommentType;
  onReply: (parentId: number, content: string) => void;
  parentUsername?: string;
  parentUserId?: number;
}

// flatten all the replies sort by time
function flattenReplies(
  comment: CommentType,
  mainCommentId: number
): Array<{ reply: CommentType; parentUsername?: string; parentUserId?: number }> {
  let result: Array<{ reply: CommentType; parentUsername?: string; parentUserId?: number }> = [];
  comment.replies.forEach((child) => {
    const currentParentUsername = comment.id === mainCommentId ? undefined : comment.user_data.username;
    const currentParentUserId = comment.id === mainCommentId ? undefined : comment.user_data.id;
    result.push({ reply: child, parentUsername: currentParentUsername, parentUserId: currentParentUserId });
    result = result.concat(flattenReplies(child, mainCommentId));
  });
  return result;
}

export function CommentItem({ comment, onReply, parentUsername, parentUserId }: Props) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [likes, setLikes] = useState(comment.likes);
  const [, setDislikes] = useState(comment.dislikes);
  const [liked, setLiked] = useState(comment.liked_by_user);
  const [disliked, setDisliked] = useState(comment.disliked_by_user);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent("");
      setShowReplyBox(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await apiClient.post(`/api/comments/${comment.id}/like`);
      if (response.data.status === "liked") {
        setLiked(true);
        setDisliked(false);
        setLikes((prev) => prev + 1);
        if (disliked) setDislikes((prev) => prev - 1);
      } else {
        setLiked(false);
        setLikes((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDislike = async () => {
    try {
      const response = await apiClient.post(`/api/comments/${comment.id}/dislike`);
      if (response.data.status === "disliked") {
        setDisliked(true);
        setLiked(false);
        setDislikes((prev) => prev + 1);
        if (liked) setLikes((prev) => prev - 1);
      } else {
        setDisliked(false);
        setDislikes((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
    }
  };

  const renderCommentBody = () => (
    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
      <Avatar
        src={comment.user_data.icon}
        alt={comment.user_data.username}
        sx={{ width: 30, height: 30, mr: 1 }}
      />
      <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word" }}>
        <Typography sx={{ fontSize: 14, fontWeight: "bold" }}>
          {parentUsername ? (
            <>
              <HoverCard userId={comment.user_data.id}>
                <Link
                  to={`/profile/${comment.user_data.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {comment.user_data.username}
                </Link>
              </HoverCard>
              {" "}reply @
              {parentUserId ? (
                <HoverCard userId={parentUserId}>
                  <Link
                    to={`/profile/${parentUserId}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {parentUsername}
                  </Link>
                </HoverCard>
              ) : (
                parentUsername
              )}
              :
            </>
          ) : (
            <HoverCard userId={comment.user_data.id}>
              <Link
                to={`/profile/${comment.user_data.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {comment.user_data.username}:
              </Link>
            </HoverCard>
          )}
        </Typography>
                <Box sx={{ mb: 0.5 }}>{comment.content}</Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#999",
            fontSize: "14px",
          }}
        >
          <Typography sx={{ fontSize: "12px", color: "#999" }}>
            {format(new Date(comment.create_at), "yyyy-MM-dd HH:mm")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton size="small" onClick={handleLike} sx={{ color: liked ? "#007bff" : "#999" }}>
              <ThumbUp fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: "12px" }}>{likes}</Typography>
          </Box>
          <IconButton size="small" onClick={handleDislike} sx={{ color: disliked ? "#007bff" : "#999" }}>
            <ThumbDown fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "#999" }} onClick={() => setShowReplyBox(!showReplyBox)}>
            <ChatBubbleOutline fontSize="small" />
          </IconButton>
        </Box>
        {showReplyBox && (
          <Box sx={{ mt: 1 }}>
            <textarea
              rows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid black",
                borderRadius: "4px",
                padding: "8px",
                resize: "vertical",
              }}
            />
            <Button variant="contained" onClick={handleReplySubmit} color="primary" sx={{ mt: 1 }}>
              Submit reply
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {renderCommentBody()}

      {comment.parent_comment === null && comment.replies && comment.replies.length > 0 && (
        <Box sx={{ ml: "20px" }}>
          {(() => {
            const allReplies = flattenReplies(comment, comment.id).sort(
              (a, b) => new Date(a.reply.create_at).getTime() - new Date(b.reply.create_at).getTime()
            );
            let displayedReplies;
            if (!expanded) {
              displayedReplies = allReplies.slice(0, 3);
            } else {
              const itemsPerPage = 10;
              displayedReplies = allReplies.slice((page - 1) * itemsPerPage, page * itemsPerPage);
            }
            return (
              <>
                {displayedReplies.map(({ reply, parentUsername, parentUserId }) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    parentUsername={parentUsername}
                    parentUserId={parentUserId}
                  />
                ))}
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  {!expanded && allReplies.length > 3 && (
                    <Button onClick={() => setExpanded(true)}
                            size="small"
                            sx = {{ color:"black" }}
                    >
                      Show more
                    </Button>
                  )}
                  {expanded && (
                    <>
                      {allReplies.length > 10 && (
                        <Pagination
                          count={Math.ceil(allReplies.length / 10)}
                          page={page}
                          onChange={(e, value) => setPage(value)}
                          size="small"
                        />
                      )}
                      <Button
                        onClick={() => {
                          setExpanded(false);
                          setPage(1);
                        }}
                        size="small"
                        sx={{ ml: 1, color:"black" }}
                      >
                        Show less
                      </Button>
                    </>
                  )}
                </Box>
              </>
            );
          })()}
        </Box>
      )}
    </>
  );
}
