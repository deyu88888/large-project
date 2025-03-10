import { useState } from "react";
import {Box, Button, IconButton, Typography} from "@mui/material";
import {format} from "date-fns";
import {ChatBubbleOutline, ThumbDown, ThumbUp} from "@mui/icons-material";
import {apiClient} from "../api";

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

interface Props {
    comment: CommentType;
    onReply: (parentId: number, content: string) => void;
}

export function CommentItem({ comment, onReply }: Props) {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [likes, setLikes] = useState(comment.likes);
    const [, setDislikes] = useState(comment.dislikes);
    const [liked, setLiked] = useState(comment.liked_by_user);
    const [disliked, setDisliked] = useState(comment.disliked_by_user);

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


    return (
        <div style={{ marginBottom: "10px" }}>
            <div style={{
                border: "1px solid #ccc",
                padding: "16px",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
            }}>
                <Typography sx={{
                    fontSize: 18,
                    fontWeight: "bold",
                }}>
                    {comment.user_data.username}:
                </Typography>
                <div>{comment.content}</div>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "#999",
                        fontSize: "14px",
                        marginTop: "5px",
                    }}
                >
                    {/* Time */}
                    <Typography sx={{ fontSize: "12px", color: "#999" }}>
                        {format(new Date(comment.create_at), "yyyy-MM-dd HH:mm")}
                    </Typography>

                    {/* Like button */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            size="small"
                            onClick={handleLike}
                            sx={{ color: liked ? "#007bff" : "#999" }}
                        >
                            <ThumbUp fontSize="small" />
                        </IconButton>
                        <Typography sx={{ fontSize: "12px" }}>{likes}</Typography>
                    </Box>

                    {/* Dislike button */}
                    <IconButton
                        size="small"
                        onClick={handleDislike}
                        sx={{ color: disliked ? "#007bff" : "#999" }}
                    >
                        <ThumbDown fontSize="small" />
                    </IconButton>

                    {/* Reply button */}
                    <IconButton
                        size="small"
                        sx={{ color: "#999" }}
                        onClick={() => setShowReplyBox(!showReplyBox)}
                    >
                        <ChatBubbleOutline fontSize="small" />
                    </IconButton>
                </Box>

                {showReplyBox && (
                    <div style={{marginTop: "5px"}}>
                    <textarea
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        style={{
                            width: "100%",
                            border: "1px solid black",
                            borderRadius: "4px",
                            padding: "8px",
                            marginBottom: "8px",
                            resize: "vertical",
                        }}
                    />
                        <Button
                            variant="contained"
                            onClick={handleReplySubmit}
                            color="primary"
                        >
                          Submit reply
                        </Button>
                    </div>
                )}
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div style={{marginLeft: "20px", marginTop: "5px"}}>
                {comment.replies.map((child) => (
                    <CommentItem key={child.id} comment={child} onReply={onReply} />
                ))}
                </div>
            )}
        </div>
    );
}
