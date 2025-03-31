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
import {
  Society,
} from "../../types/president/ViewSocietyMembers";

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

  const determineEffectiveSocietyId = (): string => {
    return String(societyId || user?.president_of);
  };

  const validateSocietyId = (id: string | undefined): void => {
    if (!id) throw new Error("No society id available");
  };

  const fetchSocietyData = async (id: string): Promise<void> => {
    const response = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(Number(id)));
    setSociety(response.data);
  };

  const fetchMembersData = async (id: string): Promise<void> => {
    const response = await apiClient.get(`/api/society/${id}/members/`);
    setMembers(response.data || []);
  };

  const handleFetchError = (error: unknown): void => {
    console.error("Error fetching data:", error);
  };

  const completeDataFetch = (): void => {
    setLoading(false);
  };

  const fetchData = async (): Promise<void> => {
    try {
      const id = determineEffectiveSocietyId();
      validateSocietyId(id);

      if (id) {
        await fetchSocietyData(id);
        await fetchMembersData(id);
      }
    } catch (error) {
      handleFetchError(error);
    } finally {
      completeDataFetch();
    }
  };

  useEffect(() => {
    fetchData();
  }, [societyId, user]);

  const navigateToProfile = (memberId: number): void => {
    navigate(`/student/profile/${memberId}`);
  };

  const handleViewProfile = (memberId: number): void => {
    navigateToProfile(memberId);
  };

  const navigateToGiveAward = (memberId: number): void => {
    navigate(`/president-page/${societyId}/give-award-page/${memberId}`);
  };

  const handleGiveAward = (memberId: number): void => {
    navigateToGiveAward(memberId);
  };

  const navigateToAssignRole = (memberId: number): void => {
    navigate(`/president-page/${societyId}/assign-role/${memberId}`);
  };

  const handleAssignRole = (memberId: number): void => {
    navigateToAssignRole(memberId);
  };

  const openRemoveRoleDialog = (role: string, memberId: number): void => {
    setConfirmDialog({ open: true, role, memberId });
  };

  const handleRemoveRole = (role: string, memberId: number): void => {
    openRemoveRoleDialog(role, memberId);
  };

  const closeRemoveRoleDialog = (): void => {
    setConfirmDialog({ open: false, role: '', memberId: null });
  };

  const startRoleAction = (): void => {
    setRoleActionLoading(true);
  };

  const endRoleAction = (): void => {
    setRoleActionLoading(false);
  };

  const createRemoveRolePayload = (role: string): Record<string, null> => {
    return { [role]: null };
  };

  const sendRemoveRoleRequest = async (role: string): Promise<void> => {
    const payload = createRemoveRolePayload(role);
    await apiClient.patch(`/api/society/${societyId}/roles/`, payload);
  };

  const handleRemoveRoleError = (error: unknown): void => {
    console.error("Error removing role:", error);
  };

  const handleConfirmRemoveRole = async (): Promise<void> => {
    if (!confirmDialog.role || !confirmDialog.memberId) return;
    
    startRoleAction();
    try {
      await sendRemoveRoleRequest(confirmDialog.role);
      await fetchData();
    } catch (error) {
      handleRemoveRoleError(error);
    } finally {
      endRoleAction();
      closeRemoveRoleDialog();
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

  const hasAnyRole = (memberId: number): boolean => {
    return isPresident(memberId) || isVicePresident(memberId) || isEventManager(memberId);
  };

  const formatRoleName = (role: string): string => {
    return role.replace('_', ' ');
  };

  const createRoleChip = (
    label: string, 
    color: string, 
    onClick: () => void,
    chipKey: string
  ): React.ReactElement => {
    return (
      <Chip
        key={chipKey}
        label={label}
        size="small"
        sx={{ bgcolor: color, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        onClick={onClick}
        onDelete={onClick}
      />
    );
  };

  const createPresidentChip = (memberId: number): React.ReactElement => {
    return (
      <Chip 
        key={`president-chip-${memberId}`}
        label="President" 
        size="small" 
        sx={{ bgcolor: 'green', color: 'white', fontWeight: 'bold' }} 
      />
    );
  };

  const createVicePresidentChip = (memberId: number): React.ReactElement => {
    return createRoleChip(
      "Vice President", 
      "blue", 
      () => handleRemoveRole('vice_president', memberId),
      `vice-president-chip-${memberId}`
    );
  };

  const createEventManagerChip = (memberId: number): React.ReactElement => {
    return createRoleChip(
      "Event Manager", 
      "orange", 
      () => handleRemoveRole('event_manager', memberId),
      `event-manager-chip-${memberId}`
    );
  };

  const createMemberRoleChips = (memberId: number): React.ReactElement[] => {
    const chips = [];
    
    if (isPresident(memberId)) {
      chips.push(createPresidentChip(memberId));
    }
    
    if (isVicePresident(memberId)) {
      chips.push(createVicePresidentChip(memberId));
    }
    
    if (isEventManager(memberId)) {
      chips.push(createEventManagerChip(memberId));
    }
    
    return chips;
  };

  const createMemberNameDisplay = (member: Member): React.ReactElement => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography color="textPrimary" fontWeight="medium">
          {`${member.first_name} ${member.last_name}`}
        </Typography>
        {createMemberRoleChips(member.id)}
      </Box>
    );
  };

  const createViewProfileButton = (memberId: number): React.ReactElement => {
    return (
      <Button 
        variant="contained" 
        color="primary" 
        size="small" 
        onClick={() => handleViewProfile(memberId)}
      >
        View Profile
      </Button>
    );
  };

  const createGiveAwardButton = (memberId: number): React.ReactElement => {
    return (
      <Button 
        variant="contained" 
        color="secondary" 
        size="small" 
        onClick={() => handleGiveAward(memberId)}
      >
        Give Award
      </Button>
    );
  };

  const createAssignRoleButton = (memberId: number): React.ReactElement => {
    return (
      <Button
        variant="contained"
        color="info"
        size="small"
        onClick={() => handleAssignRole(memberId)}
        disabled={hasAnyRole(memberId)}
      >
        Assign Role
      </Button>
    );
  };

  const createMemberActionButtons = (memberId: number): React.ReactElement => {
    return (
      <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
        {createViewProfileButton(memberId)}
        {createGiveAwardButton(memberId)}
        {createAssignRoleButton(memberId)}
      </ListItemSecondaryAction>
    );
  };

  const createMemberListItem = (member: Member): React.ReactElement => {
    return (
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
          primary={createMemberNameDisplay(member)}
          secondary={member.username}
          secondaryTypographyProps={{ color: 'textSecondary' }}
        />
        {createMemberActionButtons(member.id)}
      </ListItem>
    );
  };

  const createMembersList = (): React.ReactElement => {
    return (
      <List>
        {members.map(createMemberListItem)}
      </List>
    );
  };

  const createEmptyMembersMessage = (): React.ReactElement => {
    return (
      <Typography color="textSecondary" sx={{ textAlign: 'center' }}>
        No members found.
      </Typography>
    );
  };

  const createMembersContent = (): React.ReactElement => {
    if (members.length === 0) {
      return createEmptyMembersMessage();
    }
    return createMembersList();
  };

  const navigateBack = (): void => {
    navigate(-1);
  };

  const createBackButton = (): React.ReactElement => {
    return (
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={navigateBack}>
          Back to Dashboard
        </Button>
      </Box>
    );
  };

  const createDialogTitle = (): React.ReactElement => {
    return <DialogTitle>Remove Role</DialogTitle>;
  };

  const createDialogContent = (): React.ReactElement => {
    return (
      <DialogContent>
        <Typography>
          Are you sure you want to remove the {formatRoleName(confirmDialog.role)} role from this member?
        </Typography>
      </DialogContent>
    );
  };

  const createCancelButton = (): React.ReactElement => {
    return (
      <Button 
        onClick={closeRemoveRoleDialog} 
        disabled={roleActionLoading}
      >
        Cancel
      </Button>
    );
  };

  const createRemoveButton = (): React.ReactElement => {
    return (
      <Button 
        onClick={handleConfirmRemoveRole} 
        color="error" 
        disabled={roleActionLoading} 
        variant="contained"
      >
        {roleActionLoading ? <CircularProgress size={24} /> : 'Remove'}
      </Button>
    );
  };

  const createDialogActions = (): React.ReactElement => {
    return (
      <DialogActions>
        {createCancelButton()}
        {createRemoveButton()}
      </DialogActions>
    );
  };

  const createRemoveRoleDialog = (): React.ReactElement => {
    return (
      <Dialog open={confirmDialog.open} onClose={closeRemoveRoleDialog}>
        {createDialogTitle()}
        {createDialogContent()}
        {createDialogActions()}
      </Dialog>
    );
  };

  const createLoadingView = (): React.ReactElement => {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.background.default }}>
        <CircularProgress />
      </Box>
    );
  };

  const createPageTitle = (): React.ReactElement => {
    return (
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
          {society ? society.name : "Society"} Members
        </Typography>
      </Box>
    );
  };

  const createMembersPaper = (): React.ReactElement => {
    return (
      <Paper elevation={3} sx={{ maxWidth: 800, mx: 'auto', p: 3, backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : theme.palette.background.paper }}>
        {createMembersContent()}
        {createBackButton()}
      </Paper>
    );
  };

  const createMainContent = (): React.ReactElement => {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 4, px: 2 }}>
        {createPageTitle()}
        {createMembersPaper()}
        {createRemoveRoleDialog()}
      </Box>
    );
  };

  if (loading) {
    return createLoadingView();
  }

  return createMainContent();
};

export default ViewSocietyMembers;