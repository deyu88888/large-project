import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { useTheme } from "@mui/material/styles";
import { Edit as EditIcon } from "@mui/icons-material";
import { apiClient } from "../../api";
import Cropper from "react-easy-crop";

interface SnackbarData {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface ProfileHeaderProps {
  isSelf: boolean;
  profile: {
    id: number;
    first_name: string;
    following_count?: number;
    followers_count?: number;
    icon?: string;
  };
  isFollowing: boolean;
  onToggleFollow: () => void;
  onAvatarUpdated?: (newUrl: string) => void;
  setSnackbarData: (data: SnackbarData) => void;
}

export default function ProfileHeader({
  isSelf,
  profile,
  isFollowing,
  onToggleFollow,
  onAvatarUpdated,
  setSnackbarData
}: ProfileHeaderProps) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc =
    profile.icon?.startsWith("/api") ? profile.icon : profile.icon ? `${profile.icon}` : undefined;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const originalFile = useRef<File | null>(null);

  const handleAvatarClick = () => {
    if (isSelf && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    originalFile.current = file;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!originalFile.current || !croppedAreaPixels) return;
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
      if (onAvatarUpdated) onAvatarUpdated(response.data.icon);
      window.location.reload();
    } catch (error) {
      console.error("Avatar upload failed", error);
    } finally {
      setCropModalOpen(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: colors.blueAccent[700], color: colors.grey[100] }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ position: "relative", cursor: isSelf ? "pointer" : "default" }}>
            <Avatar
              src={avatarSrc}
              sx={{ width: 64, height: 64 }}
              onClick={handleAvatarClick}
            />
            {isSelf && (
              <IconButton
                size="small"
                sx={{ position: "absolute", bottom: -5, right: -5, backgroundColor: "white" }}
                onClick={handleAvatarClick}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{ color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            {isSelf ? `Welcome back, ${profile.first_name}!` : `${profile.first_name}'s Profile`}
          </Typography>
        </Box>

        {!isSelf && (
          <Button
            variant="contained"
            color={isFollowing ? "secondary" : "primary"}
            onClick={onToggleFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </Box>

      <Box sx={{ mt: -1, display: "flex", gap: 3, ml: 10 }}>
        <Typography variant="subtitle1" sx={{ color: colors.grey[200] }}>
          <span style={{ fontWeight: "bold" }}>Following:</span> {profile.following_count}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: colors.grey[200] }}>
          <span style={{ fontWeight: "bold" }}>Fans:</span> {profile.followers_count}
        </Typography>
      </Box>

      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crop your avatar</DialogTitle>
        <DialogContent>
          {imageSrc && (
            <Box sx={{ position: "relative", height: 400 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCropConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
