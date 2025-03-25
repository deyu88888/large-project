import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme, Box, Typography, Button, Paper, CircularProgress } from "@mui/material";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";
import { Society } from "../../types/president/society";
import { Member } from "../../types/president/member";
import { SocietyIdParams } from "../../types/president/role";
import { NavigationItem } from "../../types/president/navigation";

interface RouteParams extends Record<string, string | undefined> {
  societyId: string;
}

// Component to display loading state
const LoadingIndicator: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
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

// Component for the page header
const SocietyHeader: React.FC<{ societyName: string; textColor: string }> = ({ 
  societyName, 
  textColor 
}) => (
  <Box textAlign="center" mb={4}>
    <Typography 
      variant="h1" 
      fontWeight="bold"
      sx={{ color: textColor }}
    >
      {societyName}
    </Typography>
  </Box>
);

// Component for navigation buttons
const NavigationButtons: React.FC<{ 
  navigationItems: NavigationItem[]; 
  societyId: string | number | null;
  theme: import("@mui/material/styles").Theme;
  colors: ReturnType<typeof tokens>;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ navigationItems, societyId, theme, colors, navigate }) => (
  <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mb={4}>
    {navigationItems.map((item) => (
      <Button
        key={item.text}
        onClick={() => societyId && navigate(`/${item.path}/${societyId}`)}
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
);

// Component to display pending members
const PendingMembersSection: React.FC<{
  pendingMembers: Member[];
  colors: ReturnType<typeof tokens>;
  textColor: string;
  paperBackgroundColor: string;
  societyId: string | number | null;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ pendingMembers, colors, textColor, paperBackgroundColor, societyId, navigate }) => (
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
        onClick={() => societyId && navigate(`/pending-members/${societyId}`)}
        sx={{ mt: 2, color: colors.blueAccent[500], textTransform: "none" }}
      >
        View All Pending Members
      </Button>
    )}
  </Paper>
);

// Main component
const PresidentPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { societyId } = useParams<RouteParams>();
  // const { society_id } = useParams<SocietyIdParams>();  // not used
  const [society, setSociety] = useState<Society | null>(null);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuthStore();

  // Fetch society data from API
  const fetchSocietyData = async (id: string | number): Promise<Society> => {
    const response = await apiClient.get(`/api/society/manage/${id}`);
    return response.data;
  };

  // Fetch pending members from API
  const fetchPendingMembers = async (id: string | number): Promise<Member[]> => {
    const response = await apiClient.get(`/api/society/${id}/pending-members/`);
    return response.data || [];
  };

  // Determine the current society ID to use
  const determineSocietyId = (): string | number | null => {
    return societyId || user?.president_of || user?.vice_president_of || (society ? society.id : null);
  };

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        // Determine which society ID to use
        const id = user?.president_of || user?.vice_president_of || societyId;
        console.log(`Using society ID: ${id} for API requests`);
        
        if (!id) throw new Error("No society ID available");

        // Fetch society and pending members data in parallel
        const [societyData, pendingMembersData] = await Promise.all([
          fetchSocietyData(id),
          fetchPendingMembers(id)
        ]);

        setSociety(societyData);
        setPendingMembers(pendingMembersData);
      } catch (error) {
        console.error("Error fetching president data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [societyId, user]);

  // Define navigation items
  const navigationItems: NavigationItem[] = [
    { text: "Society Details", path: "manage-society-details", color: colors.greenAccent[500] },
    { text: "Society Events", path: "manage-society-events", color: colors.greenAccent[500] },
    { text: "Manage News", path: "manage-society-news", color: colors.blueAccent[500] },
    { text: "Pending Members", path: "pending-members", color: colors.blueAccent[500] },
    { text: "Report to Admin", path: "report-to-admin", color: colors.redAccent[500] },
    { text: "All Members", path: "view-society-members", color: colors.blueAccent[500] },
  ];

  // Theme and style variables
  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";

  if (loading) {
    return <LoadingIndicator />;
  }

  const currentSocietyId = determineSocietyId();
  const societyName = society ? society.name : "My Society";

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor,
        color: textColor,
      }}
    >
      <SocietyHeader societyName={societyName} textColor={textColor} />
      
      <NavigationButtons 
        navigationItems={navigationItems}
        societyId={currentSocietyId}
        theme={theme}
        colors={colors}
        navigate={navigate}
      />

      <PendingMembersSection
        pendingMembers={pendingMembers}
        colors={colors}
        textColor={textColor}
        paperBackgroundColor={paperBackgroundColor}
        societyId={currentSocietyId}
        navigate={navigate}
      />
    </Box>
  );
};

export default PresidentPage;