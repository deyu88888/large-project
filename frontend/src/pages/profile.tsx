import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Paper, Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../api";
import { useAuthStore } from "../stores/auth-store";
import { tokens } from "../theme/theme";
import { User } from "../types/user/user";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStaticInfo from "../components/profile/ProfileStaticInfo";
import ProfileUserInfo from "../components/profile/ProfileUserInfo";
import ProfileForm from "../components/profile/ProfileForm";
import PasswordForm from "../components/profile/PasswordForm";
import AwardList from "../components/profile/AwardList";
import SnackbarGlobal from "../components/profile/SnackbarGlobal";
import {AwardAssignment} from "../types/student/award";

export default function ProfilePage() {
  const { student_id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [awards, setAwards] = useState<AwardAssignment[]>([]);
  const [snackbarData, setSnackbarData] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const isSelf = !!user && (!student_id || String(user.id) === student_id);

  async function fetchAwards(student_id: number = -1) {
    try {
      const res = student_id === -1
        ? await apiClient.get("/api/awards/students/")
        : await apiClient.get("/api/awards/students/" + student_id);
      setAwards(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleSnackbarClose = () => {
    setSnackbarData(prev => ({ ...prev, open: false }));
  };

  const handleToggleFollow = async (id: number) => {
    try {
      const res = await apiClient.post(`/api/users/${id}/follow`);
      if (res.data.message === "Followed successfully.") {
        setIsFollowing(true);
      } else if (res.data.message === "Unfollowed successfully.") {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Follow toggle error", error);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      await apiClient.post("/api/verification/request-otp", { email });
      setOtpSent(true);
      setOtpMessage("OTP sent to your email.");
    } catch (error) {
      setOtpMessage("Failed to send OTP.");
      console.error("OTP send error:", error);
    }
  };

  useEffect(() => {
    if (isSelf) {
      setProfile(user);
      fetchAwards(user.id)
    } else {
      apiClient
        .get(`${apiPaths.USER.BASE}/${student_id}`)
        .then((res) => {
          setProfile(res.data);
          setIsFollowing(res.data.is_following || false);
          fetchAwards(res.data.id)
        })
        .catch(() => setProfile(null));
    }
  }, [student_id, user, isSelf]);

  if (isSelf && !user) return <p>Loading user info...</p>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, color: colors.grey[100], borderColor: colors.grey[400] }}
      >
        Back
      </Button>

      <Paper
        elevation={2}
        sx={{
          mb: 4,
          overflow: "hidden",
          backgroundColor: colors.primary[400],
          borderRadius: 1,
        }}
      >
        {profile && (
          <Box sx={{ p: 4 }}>
            <ProfileHeader
              profile={profile}
              isSelf={isSelf}
              isFollowing={isFollowing}
              onToggleFollow={() => handleToggleFollow(profile.id)}
              onAvatarUpdated={(newUrl) =>
                setProfile((prev) => (prev ? { ...prev, icon: newUrl } : prev))
              }
              setSnackbarData={setSnackbarData}
            />

            <ProfileStaticInfo profile={profile} colors={colors} />

            <ProfileUserInfo
              major={profile.major}
              isPresident={profile.is_president}
              isVicePresident={profile.is_vice_president}
              isEventManager={profile.is_event_manager}
              presidentOf={profile.president_of}
              vicePresidentOfSociety={profile.vice_president_of_society}
              eventManagerOfSociety={profile.event_manager_of_society}
            />

            {isSelf && (
              <>
                <ProfileForm
                  user={user}
                  isDark={isDark}
                  colors={colors}
                  sendOTP={sendOTP}
                  emailVerified={emailVerified}
                  setEmailVerified={setEmailVerified}
                  otpSent={otpSent}
                  setOtpSent={setOtpSent}
                  otpMessage={otpMessage}
                  setOtpMessage={setOtpMessage}
                  setSnackbarData={setSnackbarData}
                />

                <PasswordForm
                  isDark={isDark}
                  colors={colors}
                  setSnackbarData={setSnackbarData}
                />
              </>
            )}

            <AwardList
              userId={profile.id}
              isSelf={!!isSelf}
              awards={awards.map((a) => ({
                id: a.id,
                award: {
                  title: a.award.title,
                  description: a.award.description,
                  rank: a.award.rank as "Gold" | "Silver" | "Bronze",
                },
              }))}
              colors={colors}
            />
          </Box>
        )}

        <SnackbarGlobal
          open={snackbarData.open}
          message={snackbarData.message}
          severity={snackbarData.severity}
          onClose={handleSnackbarClose}
        />
      </Paper>
    </Container>
  );
}
