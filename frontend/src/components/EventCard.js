import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
import { StyledButton } from "./home/StyledButton";
const EventCard = ({ event, isLight, colors, onViewEvent, followingsAttending = [], }) => {
    return (_jsxs(Box, { sx: {
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
                }, children: event.title }), _jsx(Box, { sx: {
                    height: "120px",
                    backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.5rem",
                }, children: event.cover_image ? (_jsx("img", { src: event.cover_image, alt: event.title, style: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "0.5rem",
                    } })) : (_jsx(Typography, { sx: { color: isLight ? colors.grey[800] : colors.grey[100] }, children: "Event Image" })) }), _jsxs(Box, { sx: {
                    display: "flex",
                    alignItems: "center",
                    mb: 1.5,
                    gap: "0.5rem",
                }, children: [_jsx("span", { style: {
                            backgroundColor: isLight
                                ? colors.blueAccent[400]
                                : colors.blueAccent[700],
                            color: "white",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            display: "inline-block",
                        }, children: new Date(event.date).toLocaleDateString() }), event.location && (_jsx("span", { style: {
                            backgroundColor: isLight
                                ? colors.greenAccent[400]
                                : colors.greenAccent[700],
                            color: "white",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            display: "inline-block",
                        }, children: event.location }))] }), _jsx(Box, { sx: { mb: 2 }, children: _jsxs(Typography, { sx: {
                        color: colors.grey[200],
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                        mb: 2,
                    }, children: [event.main_description?.substring(0, 120), event.main_description && event.main_description.length > 120
                            ? "..."
                            : ""] }) }), followingsAttending.length > 0 && (_jsxs(Box, { sx: {
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    mt: 1,
                    mb: 1.5,
                    flexWrap: "wrap"
                }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [followingsAttending.slice(0, 3).map((att, index) => (_jsx(Box, { sx: {
                                    width: index === 0 ? 36 : 28,
                                    height: index === 0 ? 36 : 28,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    border: `2px solid ${isLight ? "#fff" : colors.primary[600]}`,
                                    marginLeft: index > 0 ? "-10px" : 0,
                                    zIndex: 10 - index,
                                    position: "relative",
                                }, children: _jsx("img", { src: att.icon || "/default-avatar.png", alt: att.first_name, style: {
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    } }) }, att.id))), followingsAttending.length > 3 && (_jsxs(Typography, { sx: {
                                    fontSize: "0.75rem",
                                    color: colors.grey[300],
                                    marginLeft: "0.5rem",
                                }, children: ["+", followingsAttending.length - 3] }))] }), _jsxs(Typography, { variant: "body2", sx: {
                            color: colors.grey[300],
                            fontSize: "0.8rem",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            flex: 1
                        }, children: [followingsAttending[0].first_name, followingsAttending.length > 1
                                ? ` and ${followingsAttending.length - 1} more following`
                                : "", " ", "also attending this event"] })] })), _jsx(Box, { sx: { display: "flex", justifyContent: "flex-end", mt: "auto" }, children: _jsx(StyledButton, { onClick: () => onViewEvent(event.id), sx: {
                        "& .MuiButtonBase-root, & .MuiButton-root": {
                            color: isLight ? "black !important" : "white !important",
                        },
                    }, children: _jsx("span", { style: { position: "relative", zIndex: 10 }, children: "View Event" }) }) })] }));
};
export default EventCard;
