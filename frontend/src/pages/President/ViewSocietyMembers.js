import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient, apiPaths } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { tokens } from "../../theme/theme";
const ViewSocietyMembers = () => {
    const { societyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [society, setSociety] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({
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
            if (!id)
                throw new Error("No society id available");
            const societyResponse = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(Number(societyId)));
            const membersResponse = await apiClient.get(`/api/society/${id}/members/`);
            setSociety(societyResponse.data);
            setMembers(membersResponse.data || []);
        }
        catch (error) {
            console.error("Error fetching data:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleViewProfile = (memberId) => navigate(`/student/profile/${memberId}`);
    const handleGiveAward = (memberId) => void navigate(`/president-page/${societyId}/give-award-page/${memberId}`);
    const handleAssignRole = (memberId) => {
        navigate(`/president-page/${societyId}/assign-role/${memberId}`);
    };
    const handleRemoveRole = (role, memberId) => {
        setConfirmDialog({ open: true, role, memberId });
    };
    const handleConfirmRemoveRole = async () => {
        if (!confirmDialog.role || !confirmDialog.memberId)
            return;
        setRoleActionLoading(true);
        try {
            const payload = { [confirmDialog.role]: null };
            await apiClient.patch(`/api/society/${societyId}/roles/`, payload);
            await fetchData();
        }
        catch (error) {
            console.error("Error removing role:", error);
        }
        finally {
            setRoleActionLoading(false);
            setConfirmDialog({ open: false, role: '', memberId: null });
        }
    };
    const isPresident = (memberId) => society?.president?.id === memberId;
    const isVicePresident = (memberId) => society?.vice_president?.id === memberId;
    const isEventManager = (memberId) => society?.event_manager?.id === memberId;
    const renderRoleChip = (label, color, onClick) => (_jsx(Chip, { label: label, size: "small", sx: { bgcolor: color, color: 'white', fontWeight: 'bold', cursor: 'pointer' }, onClick: onClick, onDelete: onClick }));
    const renderMemberList = () => (_jsx(List, { children: members.map((member) => (_jsxs(ListItem, { sx: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
            }, children: [_jsx(ListItemText, { primary: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }, children: [_jsx(Typography, { color: "textPrimary", fontWeight: "medium", children: `${member.first_name} ${member.last_name}` }), isPresident(member.id) && _jsx(Chip, { label: "President", size: "small", sx: { bgcolor: 'green', color: 'white', fontWeight: 'bold' } }), isVicePresident(member.id) && renderRoleChip("Vice President", "blue", () => handleRemoveRole('vice_president', member.id)), isEventManager(member.id) && renderRoleChip("Event Manager", "orange", () => handleRemoveRole('event_manager', member.id))] }), secondary: member.username, secondaryTypographyProps: { color: 'textSecondary' } }), _jsxs(ListItemSecondaryAction, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "contained", color: "primary", size: "small", onClick: () => handleViewProfile(member.id), children: "View Profile" }), _jsx(Button, { variant: "contained", color: "secondary", size: "small", onClick: () => handleGiveAward(member.id), children: "Give Award" }), _jsx(Button, { variant: "contained", color: "info", size: "small", onClick: () => handleAssignRole(member.id), disabled: isPresident(member.id) || isVicePresident(member.id) || isEventManager(member.id), children: "Assign Role" })] })] }, member.id))) }));
    const renderDialog = () => (_jsxs(Dialog, { open: confirmDialog.open, onClose: () => setConfirmDialog({ ...confirmDialog, open: false }), children: [_jsx(DialogTitle, { children: "Remove Role" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["Are you sure you want to remove the ", confirmDialog.role?.replace('_', ' '), " role from this member?"] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setConfirmDialog({ ...confirmDialog, open: false }), disabled: roleActionLoading, children: "Cancel" }), _jsx(Button, { onClick: handleConfirmRemoveRole, color: "error", disabled: roleActionLoading, variant: "contained", children: roleActionLoading ? _jsx(CircularProgress, { size: 24 }) : 'Remove' })] })] }));
    if (loading) {
        return (_jsx(Box, { sx: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.background.default }, children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { sx: { minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 4, px: 2 }, children: [_jsx(Box, { sx: { textAlign: 'center', mb: 4 }, children: _jsxs(Typography, { variant: "h1", sx: { color: colors.grey[100], fontWeight: 'bold' }, children: [society ? society.name : "Society", " Members"] }) }), _jsxs(Paper, { elevation: 3, sx: { maxWidth: 800, mx: 'auto', p: 3, backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : theme.palette.background.paper }, children: [members.length === 0 ? (_jsx(Typography, { color: "textSecondary", sx: { textAlign: 'center' }, children: "No members found." })) : (renderMemberList()), _jsx(Box, { sx: { mt: 2, display: 'flex', justifyContent: 'center' }, children: _jsx(Button, { variant: "contained", color: "primary", onClick: () => navigate(-1), children: "Back to Dashboard" }) })] }), renderDialog()] }));
};
export default ViewSocietyMembers;
