import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme, Box, Typography, Button, Paper, CircularProgress } from "@mui/material";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";
import { Society } from "../../types/president/society";
import { Member } from "../../types/president/member";
import { NavigationItem } from "../../types/president/navigation";

const PresidentPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { societyId } = useParams();
  const [society, setSociety] = useState<Society | null>(null);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuthStore();

  const getEffectiveSocietyId = (): string => {
    return String(user?.president_of || user?.vice_president_of || societyId);
  };

  const getSocietyIdForNavigation = (): string | number | null => {
    return societyId || user?.president_of || user?.vice_president_of || (society ? society.id : null);
  };

  const logSocietyId = (id: string): void => {
    console.log(`Using society ID: ${id} for API requests`);
  };

  const validateSocietyId = (id: string): void => {
    if (!id) throw new Error("No society ID available");
  };

  const fetchSocietyData = async (id: string): Promise<void> => {
    const response = await apiClient.get(`/api/society/manage/${id}`);
    setSociety(response.data);
  };

  const fetchPendingMembers = async (id: string): Promise<void> => {
    const response = await apiClient.get(`/api/society/${id}/pending-members/`);
    setPendingMembers(response.data || []);
  };

  const handleFetchError = (error: unknown): void => {
    console.error("Error fetching president data:", error);
  };

  const finishLoading = (): void => {
    setLoading(false);
  };

  const fetchAllData = async (): Promise<void> => {
    try {
      const id = getEffectiveSocietyId();
      logSocietyId(id);
      validateSocietyId(id);
      
      if (id) {
        await fetchSocietyData(id);
        await fetchPendingMembers(id);
      }
    } catch (error) {
      handleFetchError(error);
    } finally {
      finishLoading();
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [societyId, user]);

  const getNavigationItems = (): NavigationItem[] => {
    return [
      { text: "Society Details", path: "manage-society-details", color: colors.greenAccent[500] },
      { text: "Society Events", path: "manage-society-events", color: colors.greenAccent[500] },
      { text: "Manage News", path: "manage-society-news", color: colors.blueAccent[500] },
      { text: "Pending Members", path: "pending-members", color: colors.blueAccent[500] },
      { text: "Report to Admin", path: "report-to-admin", color: colors.redAccent[500] },
      { text: "All Members", path: "view-society-members", color: colors.blueAccent[500] },
    ];
  };

  const getThemeColors = () => {
    return {
      backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
      textColor: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      paperBackgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
    };
  };

  const themeColors = getThemeColors();
  const navigationItems = getNavigationItems();
  const currentSocietyId = getSocietyIdForNavigation();

  const navigateToPath = (path: string): void => {
    if (currentSocietyId) {
      navigate(`/president-page/${currentSocietyId}/${path}`);
    }
  };

  const navigateToPendingMembers = (): void => {
    if (currentSocietyId) {
      navigate(`/pending-members/${currentSocietyId}`);
    }
  };

  const createLoadingIndicator = (): React.ReactElement => {
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
  };

  const createPageTitle = (): React.ReactElement => {
    return (
      <Box textAlign="center" mb={4}>
        <Typography 
          variant="h1" 
          fontWeight="bold"
          sx={{ color: themeColors.textColor }}
        >
          {society ? society.name : "My Society"}
        </Typography>
      </Box>
    );
  };

  const createNavigationButton = (item: NavigationItem): React.ReactElement => {
    return (
      <Button
        key={item.text}
        onClick={() => navigateToPath(item.path)}
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
    );
  };

  const createNavigationButtons = (): React.ReactElement => {
    return (
      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mb={4}>
        {navigationItems.map(createNavigationButton)}
      </Box>
    );
  };

  const createPendingMemberItem = (member: Member): React.ReactElement => {
    return (
      <Box key={member.id} py={1} borderBottom={`1px solid ${colors.grey[600]}`}>
        <Typography fontWeight="bold">
          {member.first_name} {member.last_name}
        </Typography>
        <Typography variant="body2" color={colors.grey[300]}>
          {member.username}
        </Typography>
      </Box>
    );
  };

  const createEmptyPendingMembersMessage = (): React.ReactElement => {
    return <Typography color={colors.grey[300]}>No pending membership requests.</Typography>;
  };

  const createLimitedPendingMembersList = (): React.ReactElement => {
    return (
      <Box>
        {pendingMembers.slice(0, 3).map(createPendingMemberItem)}
      </Box>
    );
  };

  const createViewAllButton = (): React.ReactElement | null => {
    if (pendingMembers.length <= 3) return null;
    
    return (
      <Button
        onClick={navigateToPendingMembers}
        sx={{ mt: 2, color: colors.blueAccent[500], textTransform: "none" }}
      >
        View All Pending Members
      </Button>
    );
  };

  const createPendingMembersContent = (): React.ReactElement => {
    if (pendingMembers.length === 0) {
      return createEmptyPendingMembersMessage();
    }
    
    return (
      <>
        {createLimitedPendingMembersList()}
        {createViewAllButton()}
      </>
    );
  };

  const createPendingMembersCard = (): React.ReactElement => {
    return (
      <Paper
        elevation={4}
        sx={{
          maxWidth: 600,
          mx: "auto",
          p: 4,
          backgroundColor: themeColors.paperBackgroundColor,
          color: themeColors.textColor,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        <Typography variant="h3" fontWeight="bold" mb={2}>
          Pending Members
        </Typography>

        {createPendingMembersContent()}
      </Paper>
    );
  };

  const createMainContent = (): React.ReactElement => {
    return (
      <Box
        minHeight="100vh"
        p={4}
        sx={{
          backgroundColor: themeColors.backgroundColor,
          color: themeColors.textColor,
        }}
      >
        {createPageTitle()}
        {createNavigationButtons()}
        {createPendingMembersCard()}
      </Box>
    );
  };

  if (loading) {
    return createLoadingIndicator();
  }

  return createMainContent();
};

export default PresidentPage;