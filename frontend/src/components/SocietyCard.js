import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
import { StyledButton } from "./home/StyledButton";
const SocietyCard = ({ society, isLight, colors, onViewSociety, }) => {
    return (_jsxs(Box, { id: `society-card-${society.id}`, sx: {
            backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
            boxShadow: isLight
                ? "0 4px 12px rgba(0, 0, 0, 0.05)"
                : "0 4px 12px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
        }, children: [_jsx(Typography, { variant: "h5", sx: {
                    color: colors.grey[100],
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    mb: 1.5,
                    minHeight: "3rem",
                }, children: society.name }), _jsx(Box, { sx: {
                    height: "120px",
                    backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.5rem",
                }, children: society.icon ? (_jsx("img", { src: society.icon || undefined, alt: `${society.name} icon`, style: {
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        verticalAlign: "middle",
                    } })) : (_jsx(Typography, { sx: { color: isLight ? colors.grey[800] : colors.grey[100] }, children: "Society Image" })) }), _jsx(Box, { sx: {
                    display: "flex",
                    alignItems: "center",
                    mb: 1.5,
                    gap: "0.5rem",
                }, children: _jsx("span", { style: {
                        backgroundColor: isLight ? colors.blueAccent[400] : colors.blueAccent[700],
                        color: "white",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        display: "inline-block",
                    }, children: society.category || "General" }) }), _jsx(Box, { sx: { mb: 2 }, children: _jsxs(Typography, { sx: {
                        color: colors.grey[200],
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                        mb: 2,
                    }, children: [society.description?.substring(0, 120), society.description && society.description.length > 120 ? "..." : ""] }) }), society.tags && society.tags.length > 0 && (_jsx(Box, { sx: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    mb: 2,
                }, children: society.tags.slice(0, 3).map((tag, idx) => (_jsx("span", { style: {
                        backgroundColor: isLight ? colors.greenAccent[400] : colors.greenAccent[700],
                        color: "white",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                    }, children: tag }, idx))) })), _jsx(Box, { sx: { display: "flex", justifyContent: "flex-end", mt: "auto" }, children: _jsx(StyledButton, { onClick: () => onViewSociety(society.id), sx: {
                        "& .MuiButtonBase-root, & .MuiButton-root": {
                            color: isLight ? "black !important" : "white !important"
                        }
                    }, children: _jsx("span", { style: { position: "relative", zIndex: 10 }, children: "View Society" }) }) })] }, society.id));
};
export default SocietyCard;
