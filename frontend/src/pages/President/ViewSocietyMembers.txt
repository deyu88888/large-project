import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {apiClient, apiPaths} from "../../api";
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
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { tokens } from "../../theme/theme";
// import { Society } from "../../types/president/society";
import { Member } from "../../types/president/member";

interface Society {
  id: number;
  name: string;
  president?: any;
  vice_president?: any;
  event_manager?: any;
  [key: string]: any;
}
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
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, role: string, memberId: number | null}>({
    open: false,
    role: '',
    memberId: null
  });
  const [roleActionLoading, setRoleActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const id = societyId || user?.president_of;
      if (!id) {
        throw new Error("No society id available");
      }

      // Fetch society data to know roles
      const societyResponse = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(societyId));
      setSociety(societyResponse.data);

      // Fetch members
      const membersResponse = await apiClient.get(`/api/society/${id}/members/`);
      setMembers(membersResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [societyId, user]);

  const handleViewProfile = (memberId: number): void => {
    navigate(`/student/profile/${memberId}`);
  };

  const handleGiveAward = (memberId: number): void => {
    navigate(`/president-page/${societyId}/give-award-page/${memberId}`);
  };

  const handleAssignRole = (memberId: number): void => {
    navigate(`/president-page/${societyId}/assign-role/${memberId}`);
  };

  const handleRemoveRole = (role: string, memberId: number): void => {
    setConfirmDialog({
      open: true,
      role,
      memberId
    });
  };

  const handleConfirmRemoveRole = async () => {
    if (!confirmDialog.role || !confirmDialog.memberId) return;
    
    setRoleActionLoading(true);
    try {
      // Send null to remove the role
      const payload: Record<string, null> = {
        [confirmDialog.role]: null
      };
      
      await apiClient.patch(`/api/society/${societyId}/roles/`, payload);
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error("Error removing role:", error);
    } finally {
      setRoleActionLoading(false);
      setConfirmDialog({ open: false, role: '', memberId: null });
    }
  };

  const isPresident = (memberId: number): boolean => {
    return society?.president?.id === memberId;
  };

  const isVicePresident = (memberId: number): boolean => {
    return society?.vice_president?.id === memberId;
  };

  const isEventManager = (memberId: number): boolean => {
    return society?.event_manager?.id === memberId;
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
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography color="textPrimary" fontWeight="medium">
                        {`${member.first_name} ${member.last_name}`}
                      </Typography>
                      
                      {isPresident(member.id) && (
                        <Chip 
                          label="President" 
                          size="small"
                          sx={{ 
                            bgcolor: 'green', // Replace with direct color
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      )}

                      {isVicePresident(member.id) && (
                        <Chip 
                          label="Vice President" 
                          size="small"
                          sx={{ 
                            bgcolor: 'blue', // Replace with direct color
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleRemoveRole('vice_president', member.id)}
                          onDelete={() => handleRemoveRole('vice_president', member.id)}
                        />
                      )}

                      {isEventManager(member.id) && (
                        <Chip 
                          label="Event Manager" 
                          size="small"
                          sx={{ 
                            bgcolor: 'orange', // Replace with direct color
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleRemoveRole('event_manager', member.id)}
                          onDelete={() => handleRemoveRole('event_manager', member.id)}
                        />
                      )}
                    </Box>
                  }
                  secondary={member.username}
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
                    disabled={isPresident(member.id) || isVicePresident(member.id) || isEventManager(member.id)}
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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({...confirmDialog, open: false})}
      >
        <DialogTitle>Remove Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the {confirmDialog.role?.replace('_', ' ')} role from this member?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({...confirmDialog, open: false})}
            disabled={roleActionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRemoveRole}
            color="error"
            disabled={roleActionLoading}
            variant="contained"
          >
            {roleActionLoading ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewSocietyMembers;