import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient, apiPaths } from "../../api";
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
  DialogActions,
} from "@mui/material";
import { tokens } from "../../theme/theme";
import { Member } from "../../types/president/member";

interface Society {
  id: number;
  name: string;
  president?: { id: number };
  vice_president?: { id: number };
  event_manager?: { id: number };
  [key: string]: any;
}

const ViewSocietyMembers: React.FC = () => {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [society, setSociety] = useState<Society | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; role: string; memberId: number | null }>({
    open: false,
    role: "",
    memberId: null,
  });
  const [roleActionLoading, setRoleActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [societyId, user]);

  const fetchData = async () => {
    try {
      const id = societyId || user?.president_of;
      if (!id) throw new Error("No society id available");

      const societyResponse = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(Number(societyId)));
      const membersResponse = await apiClient.get(`/api/society/${id}/members/`);

      setSociety(societyResponse.data);
      setMembers(membersResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (memberId: number): void | Promise<void> => navigate(`/student/profile/${memberId}`);
  const handleGiveAward = (memberId: number): void => void navigate(`/president-page/${societyId}/give-award-page/${memberId}`);
  const handleAssignRole = (memberId: number): void => {
    navigate(`/president-page/${societyId}/assign-role/${memberId}`) as void;
  };

  const handleRemoveRole = (role: string, memberId: number): void => {
    setConfirmDialog({ open: true, role, memberId });
  };

  const handleConfirmRemoveRole = async (): Promise<void> => {
    if (!confirmDialog.role || !confirmDialog.memberId) return;
    setRoleActionLoading(true);

    try {
      const payload: Record<string, null> = { [confirmDialog.role]: null };
      await apiClient.patch(`/api/society/${societyId}/roles/`, payload);
      await fetchData();
    } catch (error) {
      console.error("Error removing role:", error);
    } finally {
      setRoleActionLoading(false);
      setConfirmDialog({ open: false, role: '', memberId: null });
    }
  };

  const isPresident = (memberId: number): boolean => society?.president?.id === memberId;
  const isVicePresident = (memberId: number): boolean => society?.vice_president?.id === memberId;
  const isEventManager = (memberId: number): boolean => society?.event_manager?.id === memberId;

  const renderRoleChip = (label: string, color: string, onClick: () => void) => (
    <Chip
      label={label}
      size="small"
      sx={{ bgcolor: color, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
      onClick={onClick}
      onDelete={onClick}
    />
  );

  const renderMemberList = () => (
    <List>
      {members.map((member) => (
        <ListItem
          key={member.id}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography color="textPrimary" fontWeight="medium">
                  {`${member.first_name} ${member.last_name}`}
                </Typography>
                {isPresident(member.id) && <Chip label="President" size="small" sx={{ bgcolor: 'green', color: 'white', fontWeight: 'bold' }} />}
                {isVicePresident(member.id) && renderRoleChip("Vice President", "blue", () => handleRemoveRole('vice_president', member.id))}
                {isEventManager(member.id) && renderRoleChip("Event Manager", "orange", () => handleRemoveRole('event_manager', member.id))}
              </Box>
            }
            secondary={member.username}
            secondaryTypographyProps={{ color: 'textSecondary' }}
          />
          <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="primary" size="small" onClick={() => handleViewProfile(member.id)}>View Profile</Button>
            <Button variant="contained" color="secondary" size="small" onClick={() => handleGiveAward(member.id)}>Give Award</Button>
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
  );

  const renderDialog = () => (
    <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
      <DialogTitle>Remove Role</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to remove the {confirmDialog.role?.replace('_', ' ')} role from this member?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} disabled={roleActionLoading}>Cancel</Button>
        <Button onClick={handleConfirmRemoveRole} color="error" disabled={roleActionLoading} variant="contained">
          {roleActionLoading ? <CircularProgress size={24} /> : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.background.default }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 4, px: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
          {society ? society.name : "Society"} Members
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ maxWidth: 800, mx: 'auto', p: 3, backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : theme.palette.background.paper }}>
        {members.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center' }}>
            No members found.
          </Typography>
        ) : (
          renderMemberList()
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
      {renderDialog()}
    </Box>
  );
};

export default ViewSocietyMembers;