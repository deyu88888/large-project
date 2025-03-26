import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Typography, Box, Paper, Divider } from "@mui/material";
import { tokens } from "../../theme/theme";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
export default function ProfileUserInfo({ major, isPresident, isVicePresident, isEventManager, presidentOf, vicePresidentOfSociety, eventManagerOfSociety, }) {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [societyName, setSocietyName] = useState(null);
    useEffect(() => {
        const societyId = presidentOf || vicePresidentOfSociety || eventManagerOfSociety;
        if (!societyId)
            return;
        apiClient
            .get(`/api/society/view/${societyId}/`)
            .then((res) => {
            setSocietyName(res.data.name);
        })
            .catch((err) => {
            console.error("Failed to fetch society info", err);
        });
    }, [presidentOf, vicePresidentOfSociety, eventManagerOfSociety]);
    const getPositionText = () => {
        if (!societyName)
            return null;
        if (isPresident)
            return `President of ${societyName}`;
        if (isVicePresident)
            return `Vice President of ${societyName}`;
        if (isEventManager)
            return `Event Manager of ${societyName}`;
        return null;
    };
    const positionText = getPositionText();
    if (!major && !positionText)
        return null;
    return (_jsxs(Box, { mt: 4, children: [_jsx(Divider, { sx: {
                    my: 3,
                    "&::before, &::after": { borderColor: colors.grey[500] },
                    color: colors.grey[100],
                }, children: _jsx(Typography, { variant: "h5", children: "User Information" }) }), _jsxs(Paper, { elevation: 3, sx: {
                    p: 3,
                    backgroundColor: colors.primary[500],
                    color: colors.grey[100],
                    borderLeft: `4px solid ${colors.greenAccent[500]}`,
                }, children: [major && (_jsxs(Typography, { align: "center", variant: "body1", sx: { mt: 1 }, children: [_jsx("strong", { children: "Major:" }), " ", major] })), positionText && (_jsxs(Typography, { align: "center", variant: "body1", sx: { mt: 1 }, children: [_jsx("strong", { children: "Role:" }), " ", positionText] }))] })] }));
}
