import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api"; // adjust import as needed
import { useAuthStore } from "../../stores/auth-store";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, ListItemSecondaryAction } from "@mui/material";

const ViewSocietyMembers = () => {
  const { society_id } = useParams<{ society_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  
  const [society, setSociety] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Determine society id either from the URL or the logged in user
        const id = society_id || user?.president_of;
        if (!id) {
          throw new Error("No society id available");
        }
        // Fetch society details (if needed)
        // const societyResponse = await apiClient.get(`/api/manage-society-details/${id}/`);
        // setSociety(societyResponse.data);

        // Fetch all members of the society using an assumed endpoint
        const membersResponse = await apiClient.get(`/api/society/${id}/members/`);
        setMembers(membersResponse.data || []);
      } catch (error) {
        console.error("Error fetching society members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [society_id, user]);

  // Handlers for button actions
  const handleViewProfile = (memberId: number) => {
    navigate(`/profile/${memberId}`);
  };

  const handleGiveAward = (memberId: number) => {
    navigate(`../give-award-page/${memberId}`);
  };

  const handleAssignRole = (memberId: number) => {
    navigate(`../assign-society-role/${memberId}`);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        backgroundColor: theme.palette.background.default,
        py: 4,
        px: 2 
      }}
    >
      {/* Header with Society Name */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 4 
        }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 'bold' 
          }}
        >
          {society ? society.name : "Society"} Members
        </Typography>
      </Box>

      {/* Members List */}
      <Paper 
        elevation={3}
        sx={{ 
          maxWidth: 800, 
          mx: 'auto', 
          p: 3,
          backgroundColor: theme.palette.mode === 'dark' ? '#141b2d' : theme.palette.background.paper
        }}
      >
        {members.length === 0 ? (
          <Typography 
            color="textSecondary" 
            sx={{ textAlign: 'center' }}
          >
            No members found.
          </Typography>
        ) : (
          <List>
            {members.map((member) => (
              <ListItem 
                key={member.id}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <ListItemText
                  primary={`${member.first_name} ${member.last_name}`}
                  secondary={member.username}
                  primaryTypographyProps={{ 
                    color: 'textPrimary',
                    fontWeight: 'medium' 
                  }}
                  secondaryTypographyProps={{ 
                    color: 'textSecondary' 
                  }}
                />
                <ListItemSecondaryAction 
                  sx={{ 
                    display: 'flex', 
                    gap: 1 
                  }}
                >
                  {/* View Profile Button */}
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleViewProfile(member.id)}
                  >
                    View Profile
                  </Button>
                  {/* Give Award Button */}
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => handleGiveAward(member.id)}
                  >
                    Give Award
                  </Button>
                  {/* Assign Role Button */}
                  <Button
                    variant="contained"
                    color="info"
                    size="small"
                    onClick={() => handleAssignRole(member.id)}
                  >
                    Assign Role
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
        
        {/* Back button */}
        <Box 
          sx={{ 
            mt: 2, 
            display: 'flex', 
            justifyContent: 'center' 
          }}
        >
          <Button
            variant="contained"
            color="neutral"
            onClick={() => navigate(-1)}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ViewSocietyMembers;