import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// TODO: did not refactor, giving error message: 'Failed to assign award.'
// TODO: Tala will fix this page, and refactor it.
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, Divider, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
const GiveAwardPage = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const params = useParams();
    const [awards, setAwards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const studentId = params.student_id || params.memberId;
    useEffect(() => {
        const fetchAwards = async () => {
            try {
                const response = await apiClient.get("/api/awards/");
                setAwards(response.data);
            }
            catch (err) {
                console.error("Error fetching awards", err);
                setError("Failed to load awards.");
            }
            finally {
                setLoading(false);
            }
        };
        fetchAwards();
    }, []);
    const handleGiveAward = async (awardId) => {
        try {
            const studentIdNumber = Number(studentId);
            await apiClient.post("/api/awards/students/", {
                student_id: studentIdNumber,
                award_id: awardId,
            });
            alert("Award assigned successfully!");
            navigate(-1);
        }
        catch (err) {
            console.error("Error giving award", err);
            alert("Failed to assign award.");
        }
    };
    const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
    const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
    const subtitleColor = theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700];
    const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
    if (loading) {
        return (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", sx: { backgroundColor: colors.primary[400] }, children: _jsx(CircularProgress, { color: "secondary" }) }));
    }
    if (error) {
        return (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", sx: {
                backgroundColor,
                color: textColor,
            }, children: _jsx(Typography, { color: colors.redAccent[500], children: error }) }));
    }
    return (_jsxs(Box, { minHeight: "100vh", p: 4, sx: {
            backgroundColor,
            color: textColor,
        }, children: [_jsxs(Box, { textAlign: "center", mb: 4, children: [_jsx(Typography, { variant: "h2", fontWeight: "bold", sx: { color: textColor }, children: "Select an Award" }), _jsx(Typography, { variant: "body1", sx: { color: subtitleColor }, children: "Choose an award to give to the student." })] }), _jsx(Paper, { elevation: 3, sx: {
                    maxWidth: "800px",
                    mx: "auto",
                    p: 4,
                    backgroundColor: paperBackgroundColor,
                    color: textColor,
                    borderRadius: "8px",
                    boxShadow: 3,
                }, children: awards.length === 0 ? (_jsx(Typography, { sx: { color: subtitleColor }, children: "No awards available." })) : (_jsx(List, { sx: { width: "100%" }, children: awards.map((award, index) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { sx: {
                                    py: 2,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }, children: [_jsxs(Box, { children: [_jsxs(Typography, { fontWeight: "medium", sx: { color: textColor }, children: [award.title, " (", award.rank, ")"] }), _jsx(Typography, { variant: "body2", sx: { color: subtitleColor }, children: award.description })] }), _jsx(Button, { onClick: () => handleGiveAward(award.id), sx: {
                                            backgroundColor: colors.greenAccent[500],
                                            color: "#ffffff",
                                            px: 2,
                                            py: 1,
                                            borderRadius: "4px",
                                            fontWeight: "bold",
                                            "&:hover": { backgroundColor: colors.greenAccent[600] },
                                        }, children: "Give Award" })] }), index < awards.length - 1 && _jsx(Divider, {})] }, award.id))) })) }), _jsx(Box, { mt: 3, textAlign: "center", children: _jsx(Button, { onClick: () => navigate(-1), sx: {
                        backgroundColor: colors.grey[500],
                        color: "#ffffff",
                        px: 2,
                        py: 1,
                        borderRadius: "4px",
                        fontWeight: "bold",
                        "&:hover": { backgroundColor: colors.grey[600] },
                    }, children: "Back" }) })] }));
};
export default GiveAwardPage;
