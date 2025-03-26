import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme, Box, Typography, Button, Paper, CircularProgress } from "@mui/material";
import { apiClient } from "../../api";
import { useAuthStore } from "../../stores/auth-store";
import { tokens } from "../../theme/theme";
// interface SocietyIdParams {
//   society_id: string;
// }
// interface NavigationItem {
//   text: string;
//   path: string;
//   color: string;
// }
const PresidentPage = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { societyId } = useParams();
    const { society_id } = useParams();
    const [society, setSociety] = useState(null);
    const [pendingMembers, setPendingMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Always prioritize the user's president_of society ID
                const id = user?.president_of || user?.vice_president_of || societyId;
                console.log(`Using society ID: ${id} for API requests`);
                if (!id)
                    throw new Error("No society ID available");
                const societyResponse = await apiClient.get(`/api/society/manage/${id}`);
                setSociety(societyResponse.data);
                const pendingResponse = await apiClient.get(`/api/society/${id}/pending-members/`);
                setPendingMembers(pendingResponse.data || []);
            }
            catch (error) {
                console.error("Error fetching president data:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [societyId, user]);
    const navigationItems = [
        { text: "Society Details", path: "manage-society-details", color: colors.greenAccent[500] },
        { text: "Society Events", path: "manage-society-events", color: colors.greenAccent[500] },
        { text: "Manage News", path: "manage-society-news", color: colors.blueAccent[500] },
        { text: "Pending Members", path: "pending-members", color: colors.blueAccent[500] },
        { text: "Report to Admin", path: "report-to-admin", color: colors.redAccent[500] },
        { text: "All Members", path: "view-society-members", color: colors.blueAccent[500] },
    ];
    const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
    const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
    const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
    if (loading) {
        return (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", sx: { backgroundColor: colors.primary[400] }, children: _jsx(CircularProgress, { color: "secondary" }) }));
    }
    // Get the current society ID for navigation, prioritizing in order:
    // 1. URL parameter societyId
    // 2. User's president_of society
    // 3. User's vice_president_of society
    // 4. Society object's ID if available
    const currentSocietyId = societyId || user?.president_of || user?.vice_president_of || (society ? society.id : null);
    return (_jsxs(Box, { minHeight: "100vh", p: 4, sx: {
            backgroundColor,
            color: textColor,
        }, children: [_jsx(Box, { textAlign: "center", mb: 4, children: _jsx(Typography, { variant: "h1", fontWeight: "bold", sx: { color: textColor }, children: society ? society.name : "My Society" }) }), _jsx(Box, { display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", mb: 4, children: navigationItems.map((item) => (_jsx(Button, { onClick: () => currentSocietyId && navigate(`/president-page/${currentSocietyId}/${item.path}`), sx: {
                        backgroundColor: item.color,
                        color: theme.palette.mode === "dark" ? colors.primary[900] : "#fff",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        "&:hover": { backgroundColor: item.color, opacity: 0.8 },
                        transition: "0.3s",
                    }, children: item.text }, item.text))) }), _jsxs(Paper, { elevation: 4, sx: {
                    maxWidth: 600,
                    mx: "auto",
                    p: 4,
                    backgroundColor: paperBackgroundColor,
                    color: textColor,
                    borderRadius: "8px",
                    boxShadow: 3,
                }, children: [_jsx(Typography, { variant: "h3", fontWeight: "bold", mb: 2, children: "Pending Members" }), pendingMembers.length === 0 ? (_jsx(Typography, { color: colors.grey[300], children: "No pending membership requests." })) : (_jsx(Box, { children: pendingMembers.slice(0, 3).map((member) => (_jsxs(Box, { py: 1, borderBottom: `1px solid ${colors.grey[600]}`, children: [_jsxs(Typography, { fontWeight: "bold", children: [member.first_name, " ", member.last_name] }), _jsx(Typography, { variant: "body2", color: colors.grey[300], children: member.username })] }, member.id))) })), pendingMembers.length > 3 && (_jsx(Button, { onClick: () => currentSocietyId && navigate(`/pending-members/${currentSocietyId}`), sx: { mt: 2, color: colors.blueAccent[500], textTransform: "none" }, children: "View All Pending Members" }))] })] }));
};
export default PresidentPage;
