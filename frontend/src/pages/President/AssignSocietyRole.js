import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { Box, Typography, Button, CircularProgress, Paper, Stack, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
const ROLE_OPTIONS = [
    { key: "vice_president", label: "Vice President" },
    { key: "event_manager", label: "Event Manager" },
];
const AssignSocietyRole = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { memberId } = useParams();
    const { societyId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
    const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
    const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
    const subtitleColor = theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700];
    useEffect(() => {
        validateParams();
    }, [societyId]);
    const validateParams = () => {
        if (!societyId) {
            setError("Society ID is missing. Please go back and try again.");
        }
    };
    const handleError = (err) => {
        const axiosError = err;
        const message = axiosError?.response?.data?.error || "Failed to assign role. Please try again.";
        setError(message);
    };
    const buildPayload = (roleKey) => ({
        [roleKey]: Number(memberId),
    });
    const sendRoleAssignment = async (roleKey) => {
        const payload = buildPayload(roleKey);
        await apiClient.patch(`/api/society/${societyId}/roles/`, payload);
    };
    const handleAssignRole = async (roleKey) => {
        if (!societyId) {
            setError("Cannot assign role: Society ID is missing");
            return;
        }
        try {
            setLoading(true);
            await sendRoleAssignment(roleKey);
            alert(`Assigned ${roleKey.replace("_", " ")} role to student ${memberId}`);
            navigate(-1);
        }
        catch (err) {
            console.error("Error assigning role", err);
            handleError(err);
        }
        finally {
            setLoading(false);
        }
    };
    const renderHeader = () => (_jsxs(Box, { textAlign: "center", mb: 4, children: [_jsx(Typography, { variant: "h2", fontWeight: "bold", sx: { color: textColor }, children: "Assign Society Role" }), _jsxs(Typography, { variant: "body1", sx: { color: subtitleColor }, children: ["Choose a role to assign to student with ID: ", memberId] })] }));
    const renderError = () => error && (_jsx(Box, { mb: 3, textAlign: "center", children: _jsx(Typography, { color: colors.redAccent[500], children: error }) }));
    const renderRoleButtons = () => (_jsx(Paper, { elevation: 3, sx: {
            maxWidth: "500px",
            mx: "auto",
            p: 4,
            backgroundColor: paperBackgroundColor,
            color: textColor,
            borderRadius: "8px",
            boxShadow: 3,
        }, children: _jsx(Stack, { spacing: 2, children: ROLE_OPTIONS.map((role) => (_jsx(Button, { onClick: () => handleAssignRole(role.key), disabled: loading, sx: {
                    backgroundColor: colors.blueAccent[500],
                    color: "#ffffff",
                    py: 1.5,
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: colors.blueAccent[600] },
                    "&.Mui-disabled": {
                        backgroundColor: colors.blueAccent[300],
                        color: "#ffffff",
                    },
                }, children: role.label }, role.key))) }) }));
    const renderBackButton = () => (_jsx(Box, { mt: 3, textAlign: "center", children: _jsx(Button, { onClick: () => navigate(-1), disabled: loading, sx: {
                backgroundColor: colors.grey[500],
                color: "#ffffff",
                px: 3,
                py: 1,
                borderRadius: "4px",
                fontWeight: "bold",
                "&:hover": { backgroundColor: colors.grey[600] },
                "&.Mui-disabled": {
                    backgroundColor: colors.grey[300],
                    color: "#ffffff",
                },
            }, children: "Back" }) }));
    const renderLoader = () => loading && (_jsx(Box, { display: "flex", justifyContent: "center", mt: 4, children: _jsx(CircularProgress, { color: "secondary" }) }));
    return (_jsxs(Box, { minHeight: "100vh", p: 4, sx: {
            backgroundColor,
            color: textColor,
        }, children: [renderHeader(), renderError(), renderRoleButtons(), renderBackButton(), renderLoader()] }));
};
export default AssignSocietyRole;
