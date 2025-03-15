import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme, Box, Typography, Button, Paper, CircularProgress } from "@mui/material";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";

interface Society {
  id: number;
  name: string;
  [key: string]: any;
}

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

interface RouteParams {
  society_id: string;
}

interface NavigationItem {
  text: string;
  path: string;
  color: string;
}

const PresidentPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { society_id } = useParams<RouteParams>();
  const [society, setSociety] = useState<Society | null>(null);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const id = society_id || user?.president_of || user?.vice_president_of;
        if (!id) throw new Error("No society ID available");

        const societyResponse = await apiClient.get(`/api/manage-society-details/${id}/`);
        setSociety(societyResponse.data);

        const pendingResponse = await apiClient.get(`/api/society/${id}/pending-members/`);
        setPendingMembers(pendingResponse.data || []);
      } catch (error) {
        console.error("Error fetching president data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [society_id, user]);

  const navigationItems: NavigationItem[] = [
    { text: "Society Details", path: "manage-society-details", color: colors.greenAccent[500] },
    { text: "Society Events", path: "manage-society-events", color: colors.greenAccent[500] },
    { text: "Pending Members", path: "pending-members", color: colors.blueAccent[500] },
    { text: "Report to Admin", path: "report-to-admin", color: colors.redAccent[500] },
    { text: "All Members", path: "view-society-members", color: colors.blueAccent[500] },
  ];

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ backgroundColor: colors.primary[400] }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor,
        color: textColor,
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography 
          variant="h1" 
          fontWeight="bold"
          sx={{ color: textColor }}
        >
          {society ? society.name : "My Society"}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mb={4}>
        {navigationItems.map((item) => (
          <Button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              backgroundColor: item.color,
              color: theme.palette.mode === "dark" ? colors.primary[900] : "#fff",
              fontSize: "1rem",
              fontWeight: "bold",
              padding: "12px 20px",
              borderRadius: "8px",
              "&:hover": { backgroundColor: item.color, opacity: 0.8 },
              transition: "0.3s",
            }}
          >
            {item.text}
          </Button>
        ))}
      </Box>

      <Paper
        elevation={4}
        sx={{
          maxWidth: 600,
          mx: "auto",
          p: 4,
          backgroundColor: paperBackgroundColor,
          color: textColor,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        <Typography variant="h3" fontWeight="bold" mb={2}>
          Pending Members
        </Typography>

        {pendingMembers.length === 0 ? (
          <Typography color={colors.grey[300]}>No pending membership requests.</Typography>
        ) : (
          <Box>
            {pendingMembers.slice(0, 3).map((member) => (
              <Box key={member.id} py={1} borderBottom={`1px solid ${colors.grey[600]}`}>
                <Typography fontWeight="bold">
                  {member.first_name} {member.last_name}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  {member.username}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {pendingMembers.length > 3 && (
          <Button
            onClick={() => navigate("pending-members")}
            sx={{ mt: 2, color: colors.blueAccent[500], textTransform: "none" }}
          >
            View All Pending Members
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default PresidentPage;