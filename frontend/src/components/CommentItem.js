import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Avatar, Box, Button, IconButton, Pagination, Typography, } from "@mui/material";
import { format } from "date-fns";
import { ChatBubbleOutline, ThumbDown, ThumbUp, } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { apiClient } from "../api";
import { HoverCard } from "./HoverCard";
// Flatten nested replies into a list, tracking parent info
function flattenReplies(comment, mainCommentId) {
    let result = [];
    comment.replies.forEach((child) => {
        const currentParentUsername = comment.id === mainCommentId ? undefined : comment.user_data.username;
        const currentParentUserId = comment.id === mainCommentId ? undefined : comment.user_data.id;
        result.push({
            reply: child,
            parentUsername: currentParentUsername,
            parentUserId: currentParentUserId,
        });
        result = result.concat(flattenReplies(child, mainCommentId));
    });
    return result;
}
export function CommentItem({ comment, onReply, parentUsername, parentUserId, }) {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [likes, setLikes] = useState(comment.likes);
    const [, setDislikes] = useState(comment.dislikes);
    const [liked, setLiked] = useState(comment.liked_by_user);
    const [disliked, setDisliked] = useState(comment.disliked_by_user);
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState(false);
    const replyTextAreaRef = useRef(null);
    // Submit reply logic
    const handleReplySubmit = () => {
        if (replyContent.trim()) {
            onReply(comment.id, replyContent);
            setReplyContent("");
            setShowReplyBox(false);
            // Reset textarea height
            if (replyTextAreaRef.current) {
                replyTextAreaRef.current.style.height = "auto";
            }
        }
    };
    // Handle like action
    const handleLike = async () => {
        try {
            const response = await apiClient.post(`/api/comments/${comment.id}/like/`);
            if (response.data.status === "liked") {
                setLiked(true);
                setDisliked(false);
                setLikes((prev) => prev + 1);
                if (disliked)
                    setDislikes((prev) => prev - 1);
            }
            else {
                setLiked(false);
                setLikes((prev) => prev - 1);
            }
        }
        catch (error) {
            console.error("Error liking comment:", error);
        }
    };
    // Handle dislike action
    const handleDislike = async () => {
        try {
            const response = await apiClient.post(`/api/comments/${comment.id}/dislike/`);
            if (response.data.status === "disliked") {
                setDisliked(true);
                setLiked(false);
                setDislikes((prev) => prev + 1);
                if (liked)
                    setLikes((prev) => prev - 1);
            }
            else {
                setDisliked(false);
                setDislikes((prev) => prev - 1);
            }
        }
        catch (error) {
            console.error("Error disliking comment:", error);
        }
    };
    // Render the comment content + reply box
    const renderCommentBody = () => (_jsxs(Box, { sx: { display: "flex", alignItems: "flex-start", mb: 1 }, children: [_jsx(HoverCard, { userId: comment.user_data.id, children: _jsx(Link, { to: `/student/profile/${comment.user_data.id}`, style: { textDecoration: "none" }, children: _jsx(Avatar, { src: comment.user_data.icon, alt: comment.user_data.username, sx: { width: 30, height: 30, mr: 1 } }) }) }), _jsxs(Box, { sx: { whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word" }, children: [_jsx(Typography, { sx: { fontSize: 14, fontWeight: "bold" }, children: parentUsername ? (_jsxs(_Fragment, { children: [_jsx(HoverCard, { userId: comment.user_data.id, children: _jsx(Link, { to: `/student/profile/${comment.user_data.id}`, style: { textDecoration: "none" }, children: comment.user_data.username }) }), " ", "reply @", parentUserId ? (_jsx(HoverCard, { userId: parentUserId, children: _jsx(Link, { to: `/student/profile/${parentUserId}`, style: { textDecoration: "none", color: "inherit" }, children: parentUsername }) })) : (parentUsername), ":"] })) : (_jsx(HoverCard, { userId: comment.user_data.id, children: _jsxs(Link, { to: `/student/profile/${comment.user_data.id}`, style: { textDecoration: "none", color: "inherit" }, children: [comment.user_data.username, ":"] }) })) }), _jsx(Box, { sx: { mb: 0.5 }, children: comment.content }), _jsxs(Box, { sx: {
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            color: "#999",
                            fontSize: "14px",
                        }, children: [_jsx(Typography, { sx: { fontSize: "12px", color: "#999" }, children: format(new Date(comment.create_at), "yyyy-MM-dd HH:mm") }), _jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [_jsx(IconButton, { size: "small", onClick: handleLike, sx: { color: liked ? "#007bff" : "#999" }, children: _jsx(ThumbUp, { fontSize: "small" }) }), _jsx(Typography, { sx: { fontSize: "12px" }, children: likes })] }), _jsx(IconButton, { size: "small", onClick: handleDislike, sx: { color: disliked ? "#007bff" : "#999" }, children: _jsx(ThumbDown, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", sx: { color: "#999" }, onClick: () => setShowReplyBox(!showReplyBox), children: _jsx(ChatBubbleOutline, { fontSize: "small" }) })] }), showReplyBox && (_jsxs(Box, { sx: { mt: 1 }, children: [_jsx("textarea", { ref: replyTextAreaRef, rows: 1, value: replyContent, onChange: (e) => {
                                    setReplyContent(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = e.target.scrollHeight + "px";
                                }, style: {
                                    width: "100%",
                                    border: "1px solid black",
                                    borderRadius: "4px",
                                    padding: "8px",
                                    resize: "none",
                                    overflow: "hidden",
                                } }), _jsx(Button, { variant: "contained", onClick: handleReplySubmit, color: "primary", sx: { mt: 1 }, children: "Submit reply" })] }))] })] }));
    // Final render
    return (_jsxs(_Fragment, { children: [renderCommentBody(), comment.parent_comment === null &&
                comment.replies &&
                comment.replies.length > 0 && (_jsx(Box, { sx: { ml: "20px" }, children: (() => {
                    const allReplies = flattenReplies(comment, comment.id).sort((a, b) => new Date(a.reply.create_at).getTime() -
                        new Date(b.reply.create_at).getTime());
                    let displayedReplies;
                    if (!expanded) {
                        displayedReplies = allReplies.slice(0, 3);
                    }
                    else {
                        const itemsPerPage = 10;
                        displayedReplies = allReplies.slice((page - 1) * itemsPerPage, page * itemsPerPage);
                    }
                    return (_jsxs(_Fragment, { children: [displayedReplies.map(({ reply, parentUsername, parentUserId }) => (_jsx(CommentItem, { comment: reply, onReply: onReply, parentUsername: parentUsername, parentUserId: parentUserId }, reply.id))), _jsxs(Box, { sx: { display: "flex", alignItems: "center", mt: 1 }, children: [!expanded && allReplies.length > 3 && (_jsx(Button, { onClick: () => setExpanded(true), size: "small", sx: { color: "black" }, children: "Show more" })), expanded && (_jsxs(_Fragment, { children: [allReplies.length > 10 && (_jsx(Pagination, { count: Math.ceil(allReplies.length / 10), page: page, onChange: (_, value) => setPage(value), size: "small" })), _jsx(Button, { onClick: () => {
                                                    setExpanded(false);
                                                    setPage(1);
                                                }, size: "small", sx: { ml: 1, color: "black" }, children: "Show less" })] }))] })] }));
                })() }))] }));
}
