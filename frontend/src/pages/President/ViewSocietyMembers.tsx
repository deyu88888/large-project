import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api"; 
import { useAuthStore } from "../../stores/auth-store";
import { useTheme } from "@mui/material/styles";
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction 
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { Society } from "../../types/president/society";
import { Member } from "../../types/president/member";

// interface Society {
//   id: number;
//   name: string;
//   [key: string]: any;
// }

// interface Member {
//   id: number;
//   first_name: string;
//   last_name: string;
//   username: string;
// }

const ViewSocietyMembers: React.FC = () => {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [society, setSociety] = useState<Society | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMembers = async (): Promise<void> => {
      try {
        const id = societyId || user?.president_of;
        if (!id) {
          throw new Error("No society id available");
        }

        const membersResponse = await apiClient.get(`/api/society/${id}/members/`);
        setMembers(membersResponse.data || []);
      } catch (error) {
        console.error("Error fetching society members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [societyId, user]);

  const handleViewProfile = (memberId: number): void => {
    navigate(`/profile/${memberId}`);
  };

  const handleGiveAward = (memberId: number): void => {
    navigate(`../give-award-page/${memberId}`);
  };

  const handleAssignRole = (memberId: number): void => {
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
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 4 
        }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[100],
            fontWeight: 'bold' 
          }}
        >
          {society ? society.name : "Society"} Members
        </Typography>
      </Box>

      <Paper 
        elevation={3}
        sx={{ 
          maxWidth: 800, 
          mx: 'auto', 
          p: 3,
          backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : theme.palette.background.paper
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
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleViewProfile(member.id)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => handleGiveAward(member.id)}
                  >
                    Give Award
                  </Button>
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