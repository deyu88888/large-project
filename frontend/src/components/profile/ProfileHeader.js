import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Box, Typography, Avatar, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { tokens } from "../../theme/theme";
import { useTheme } from "@mui/material/styles";
import { Edit as EditIcon } from "@mui/icons-material";
import { apiClient } from "../../api";
import Cropper from "react-easy-crop";
export default function ProfileHeader({ isSelf, profile, isFollowing, onToggleFollow, onAvatarUpdated, setSnackbarData }) {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const fileInputRef = useRef(null);
    const avatarSrc = profile.icon?.startsWith("/api") ? profile.icon : profile.icon ? `${profile.icon}` : undefined;
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const originalFile = useRef(null);
    const handleAvatarClick = () => {
        if (isSelf && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        originalFile.current = file;
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };
    const onCropComplete = (_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };
    const handleCropConfirm = async () => {
        if (!originalFile.current || !croppedAreaPixels)
            return;
        const formData = new FormData();
        formData.append("image", originalFile.current);
        formData.append("crop_x", `${croppedAreaPixels.x}`);
        formData.append("crop_y", `${croppedAreaPixels.y}`);
        formData.append("crop_width", `${croppedAreaPixels.width}`);
        formData.append("crop_height", `${croppedAreaPixels.height}`);
        try {
            const response = await apiClient.post("/api/users/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (onAvatarUpdated)
                onAvatarUpdated(response.data.icon);
            setSnackbarData({
                open: true,
                message: "Avatar upload successfully!",
                severity: "success",
            });
        }
        catch (error) {
            console.error("Avatar upload failed", error);
        }
        finally {
            setCropModalOpen(false);
        }
    };
    return (_jsxs(Box, { sx: { p: 3, backgroundColor: colors.blueAccent[700], color: colors.grey[100] }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 2 }, children: [_jsxs(Box, { sx: { position: "relative", cursor: isSelf ? "pointer" : "default" }, children: [_jsx(Avatar, { src: avatarSrc, sx: { width: 64, height: 64 }, onClick: handleAvatarClick }), isSelf && (_jsx(IconButton, { size: "small", sx: { position: "absolute", bottom: -5, right: -5, backgroundColor: "white" }, onClick: handleAvatarClick, children: _jsx(EditIcon, { fontSize: "small" }) })), _jsx("input", { type: "file", ref: fileInputRef, style: { display: "none" }, accept: "image/*", onChange: handleFileChange })] }), _jsx(Typography, { variant: "h4", sx: { color: theme.palette.getContrastText(theme.palette.primary.main) }, children: isSelf ? `Welcome back, ${profile.first_name}!` : `${profile.first_name}'s Profile` })] }), !isSelf && (_jsx(Button, { variant: "contained", color: isFollowing ? "secondary" : "primary", onClick: onToggleFollow, children: isFollowing ? "Unfollow" : "Follow" }))] }), _jsxs(Box, { sx: { mt: -1, display: "flex", gap: 3, ml: 10 }, children: [_jsxs(Typography, { variant: "subtitle1", sx: { color: colors.grey[200] }, children: [_jsx("span", { style: { fontWeight: "bold" }, children: "Following:" }), " ", profile.following_count] }), _jsxs(Typography, { variant: "subtitle1", sx: { color: colors.grey[200] }, children: [_jsx("span", { style: { fontWeight: "bold" }, children: "Fans:" }), " ", profile.followers_count] })] }), _jsxs(Dialog, { open: cropModalOpen, onClose: () => setCropModalOpen(false), fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: "Crop your avatar" }), _jsx(DialogContent, { children: imageSrc && (_jsx(Box, { sx: { position: "relative", height: 400 }, children: _jsx(Cropper, { image: imageSrc, crop: crop, zoom: zoom, aspect: 1, onCropChange: setCrop, onZoomChange: setZoom, onCropComplete: onCropComplete }) })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setCropModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: handleCropConfirm, children: "Confirm" })] })] })] }));
}
