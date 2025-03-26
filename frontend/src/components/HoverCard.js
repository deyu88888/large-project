import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// HoverCard.tsx
import { useState, useRef } from "react";
import { Popover, Box, Button, Typography, Avatar, Snackbar, Alert, } from "@mui/material";
import { apiClient } from "../api";
import { useAuthStore } from "../stores/auth-store";
export function HoverCard({ userId, children }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [open, setOpen] = useState(false);
    const timerRef = useRef(null);
    const { user } = useAuthStore();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState("");
    const handleMouseEnter = (event) => {
        if (!open) {
            setAnchorEl(event.currentTarget);
            timerRef.current = window.setTimeout(() => {
                fetchUserInfo();
                setOpen(true);
            }, 300);
        }
    };
    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setOpen(false);
        setAnchorEl(null);
    };
    const fetchUserInfo = async () => {
        try {
            const res = await apiClient.get(`/api/users/${userId}`);
            setUserInfo(res.data);
        }
        catch (err) {
            console.error("Error fetching user info:", err);
        }
    };
    const handleToggleFollow = async () => {
        if (!userInfo)
            return;
        if (userInfo.id === user?.id) {
            setSnackbarMsg("You cannot follow yourself.");
            setSnackbarOpen(true);
            return;
        }
        try {
            const res = await apiClient.post(`/api/users/${userInfo.id}/follow`);
            if (res.data.message === "Followed successfully.") {
                setUserInfo({
                    ...userInfo,
                    is_following: true,
                    followers_count: (userInfo.followers_count || 0) + 1,
                });
            }
            else if (res.data.message === "Unfollowed successfully.") {
                setUserInfo({
                    ...userInfo,
                    is_following: false,
                    followers_count: (userInfo.followers_count || 0) - 1,
                });
            }
        }
        catch (err) {
            console.error("Error following/unfollowing:", err);
        }
    };
    return (_jsxs("span", { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, style: { display: "inline-block" }, children: [children, _jsx(Popover, { open: open, anchorEl: anchorEl, onClose: () => setOpen(false), anchorOrigin: { vertical: "bottom", horizontal: "left" }, transformOrigin: { vertical: "top", horizontal: "left" }, disableRestoreFocus: true, children: _jsx(Box, { onMouseEnter: () => setOpen(true), onMouseLeave: handleMouseLeave, children: !userInfo ? (_jsx(Box, { sx: { p: 2 }, children: _jsx(Typography, { variant: "body2", children: "Loading..." }) })) : (_jsxs(Box, { sx: { p: 2, width: 250 }, children: [_jsx(Box, { sx: {
                                    backgroundColor: "#f5f5f5",
                                    height: 50,
                                    borderRadius: 1,
                                    mb: 2,
                                } }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", mb: 1 }, children: [_jsx(Avatar, { src: userInfo.icon, alt: userInfo.username, sx: { width: 48, height: 48, mr: 1, mt: -4 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", children: userInfo.username }), userInfo.president_of && (_jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["President of ", userInfo.president_of.name] }))] })] }), _jsxs(Box, { sx: { display: "flex", justifyContent: "space-around", mb: 1 }, children: [_jsxs(Box, { sx: { textAlign: "center" }, children: [_jsx(Typography, { variant: "body2", children: "Following" }), _jsx(Typography, { variant: "subtitle2", children: userInfo.following_count ?? 0 })] }), _jsxs(Box, { sx: { textAlign: "center" }, children: [_jsx(Typography, { variant: "body2", children: "Followers" }), _jsx(Typography, { variant: "subtitle2", children: userInfo.followers_count ?? 0 })] })] }), _jsx(Button, { variant: "contained", fullWidth: true, color: userInfo.is_following ? "secondary" : "primary", onClick: handleToggleFollow, children: userInfo.is_following ? "Unfollow" : "Follow" })] })) }) }), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 4000, onClose: () => setSnackbarOpen(false), anchorOrigin: { vertical: "top", horizontal: "center" }, children: _jsx(Alert, { onClose: () => setSnackbarOpen(false), severity: "error", variant: "filled", sx: { width: "100%" }, children: snackbarMsg }) })] }));
}
