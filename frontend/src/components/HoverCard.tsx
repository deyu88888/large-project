// HoverCard.tsx
import React, { useState, useRef } from "react";
import {
  Popover,
  Box,
  Button,
  Typography,
  Avatar,
  Snackbar,
  Alert,
} from "@mui/material";
import { apiClient } from "../api";
import { useAuthStore } from "../stores/auth-store";

interface SocietyInfo {
  id: number;
  name: string;
}

interface UserInfo {
  id: number;
  username: string;
  icon?: string;
  following_count?: number;
  followers_count?: number;
  is_following?: boolean;
  president_of?: SocietyInfo | null;
}

interface HoverCardProps {
  userId: number;
  children: React.ReactNode;
}

export function HoverCard({ userId, children }: HoverCardProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const { user } = useAuthStore();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
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
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const handleToggleFollow = async () => {
    if (!userInfo) return;

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
      } else if (res.data.message === "Unfollowed successfully.") {
        setUserInfo({
          ...userInfo,
          is_following: false,
          followers_count: (userInfo.followers_count || 0) - 1,
        });
      }
    } catch (err) {
      console.error("Error following/unfollowing:", err);
    }
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: "inline-block" }}
    >
      {children}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableRestoreFocus
      >
        <Box onMouseEnter={() => setOpen(true)} onMouseLeave={handleMouseLeave}>
          {!userInfo ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2">Loading...</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2, width: 250 }}>
              <Box
                sx={{
                  backgroundColor: "#f5f5f5",
                  height: 50,
                  borderRadius: 1,
                  mb: 2,
                }}
              />
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar
                  src={userInfo.icon}
                  alt={userInfo.username}
                  sx={{ width: 48, height: 48, mr: 1, mt: -4 }}
                />
                <Box>
                  <Typography variant="subtitle1">{userInfo.username}</Typography>
                  {userInfo.president_of && (
                    <Typography variant="caption" color="text.secondary">
                      President of {userInfo.president_of.name}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-around", mb: 1 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2">Following</Typography>
                  <Typography variant="subtitle2">
                    {userInfo.following_count ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2">Followers</Typography>
                  <Typography variant="subtitle2">
                    {userInfo.followers_count ?? 0}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                fullWidth
                color={userInfo.is_following ? "secondary" : "primary"}
                onClick={handleToggleFollow}
              >
                {userInfo.is_following ? "Unfollow" : "Follow"}
              </Button>
            </Box>
          )}
        </Box>
      </Popover>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </span>
  );
}
