import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Divider, Grid, Paper, Typography } from "@mui/material";
import { FaTrophy } from "react-icons/fa";
export default function AwardList({ awards, isSelf, colors }) {
    return (_jsxs(_Fragment, { children: [_jsx(Divider, { sx: {
                    my: 3,
                    "&::before, &::after": { borderColor: colors.grey[500] },
                    color: colors.grey[100],
                }, children: _jsx(Typography, { variant: "h5", children: "Awards & Achievements" }) }), awards.length === 0 ? (_jsx(Box, { sx: { textAlign: "center", py: 4 }, children: _jsx(Typography, { variant: "body1", sx: { color: colors.grey[300] }, children: isSelf
                        ? "You haven't earned any awards yet"
                        : "This user hasn't earned any awards yet" }) })) : (_jsx(Grid, { container: true, spacing: 3, children: awards.map((award) => {
                    const rankColor = award.award.rank === "Gold"
                        ? "#FFD700"
                        : award.award.rank === "Silver"
                            ? "#C0C0C0"
                            : "#CD7F32";
                    const rankBg = award.award.rank === "Gold"
                        ? "rgba(255, 215, 0, 0.1)"
                        : award.award.rank === "Silver"
                            ? "rgba(192, 192, 192, 0.1)"
                            : "rgba(205, 127, 50, 0.1)";
                    return (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Paper, { elevation: 3, sx: {
                                p: 2,
                                height: "100%",
                                backgroundColor: colors.primary[500],
                                borderRadius: 2,
                                borderLeft: `4px solid ${rankColor}`,
                                transition: "transform 0.2s",
                                "&:hover": {
                                    transform: "translateY(-5px)",
                                },
                            }, children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 1, children: [_jsx(FaTrophy, { size: 24, style: { marginRight: 12, color: rankColor } }), _jsx(Typography, { variant: "h6", sx: { color: colors.grey[100], fontWeight: "bold" }, children: award.award.title })] }), _jsxs(Typography, { variant: "subtitle2", sx: {
                                        color: colors.grey[300],
                                        mb: 1,
                                        display: "inline-block",
                                        backgroundColor: rankBg,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: "4px",
                                    }, children: [award.award.rank, " Award"] }), _jsx(Typography, { variant: "body2", sx: { color: colors.grey[300], mt: 1 }, children: award.award.description })] }) }, award.id));
                }) }))] }));
}
