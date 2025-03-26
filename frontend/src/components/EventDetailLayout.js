import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Typography, Button, Snackbar, useTheme } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useSettingsStore } from "../stores/settings-store";
import { tokens } from "../theme/theme";
export function EventDetailLayout({ eventData }) {
    const { title, mainDescription, date, startTime, duration, location, maxCapacity, coverImageFile, coverImageUrl, extraModules, participantModules, isParticipant, isMember, eventId, hostedBy, current_attendees, } = eventData;
    console.log(eventData.current_attendees);
    const theme = useTheme();
    const navigate = useNavigate();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const { drawer } = useSettingsStore();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState("");
    const coverImageSrc = coverImageFile
        ? URL.createObjectURL(coverImageFile)
        : coverImageUrl;
    const handleJoinEvent = async () => {
        try {
            await apiClient.post("/api/events/rsvp/", { event_id: eventId });
            setSnackbarMsg("Successfully joined the event!");
            setSnackbarOpen(true);
            setTimeout(() => window.location.reload(), 1000);
        }
        catch {
            setSnackbarMsg("Failed to join event.");
            setSnackbarOpen(true);
        }
    };
    const handleCancelRSVP = async () => {
        try {
            await apiClient.delete("/api/events/rsvp/", { data: { event_id: eventId } });
            setSnackbarMsg("Canceled RSVP.");
            setSnackbarOpen(true);
            setTimeout(() => window.location.reload(), 1000);
        }
        catch {
            setSnackbarMsg("Failed to cancel RSVP.");
            setSnackbarOpen(true);
        }
    };
    const handleJoinSociety = () => {
        setSnackbarMsg("Please join the society to RSVP.");
        setSnackbarOpen(true);
        setTimeout(() => {
            navigate(`/student/view-society/${hostedBy}`);
        }, 1500);
    };
    const renderModule = (mod) => {
        switch (mod.type) {
            case "subtitle":
                return (_jsx(Box, { sx: { my: 3 }, children: _jsx(Typography, { variant: "h3", sx: { fontWeight: "bold" }, children: mod.textValue || "Subtitle" }) }, mod.id));
            case "description":
                return (_jsx(Box, { sx: { mb: 3 }, children: _jsx(Typography, { variant: "body1", sx: { whiteSpace: "pre-wrap" }, children: mod.textValue }) }, mod.id));
            case "image": {
                let imageSrc = "";
                if (mod.fileValue instanceof File) {
                    imageSrc = URL.createObjectURL(mod.fileValue);
                }
                else if (typeof mod.fileValue === "string" && mod.fileValue !== "") {
                    imageSrc = mod.fileValue;
                }
                else if (mod.textValue) {
                    imageSrc = mod.textValue;
                }
                return imageSrc ? (_jsx(Box, { sx: { mb: 3 }, children: _jsx(Box, { component: "img", src: imageSrc, alt: "Image preview", sx: {
                            width: "100%",
                            maxHeight: 400,
                            objectFit: "cover",
                            borderRadius: 2,
                        } }) }, mod.id)) : null;
            }
            case "file":
                let fileUrl = "";
                let fileName = "Download File";
                if (mod.fileValue instanceof File) {
                    fileUrl = URL.createObjectURL(mod.fileValue);
                    fileName = mod.fileValue.name;
                }
                else if (typeof mod.fileValue === "string" && mod.fileValue !== "") {
                    fileUrl = mod.fileValue;
                    fileName = mod.fileValue.split("/").pop() || "Download File";
                }
                return fileUrl ? (_jsx(Box, { sx: { mb: 3 }, children: _jsx(Button, { variant: "outlined", href: fileUrl, download: fileName, startIcon: _jsx(InsertDriveFileIcon, {}), sx: {
                            textTransform: "none",
                            border: "2px solid #ccc",
                            color: "black",
                            padding: "8px 12px",
                        }, children: fileName }) }, mod.id)) : null;
            default:
                return null;
        }
    };
    return (_jsxs(Box, { sx: {
            p: 0,
            maxWidth: drawer ? `calc(90vw - 125px)` : "90vw",
            marginLeft: "auto",
            marginRight: "auto",
        }, children: [_jsx(Box, { sx: { textAlign: "center" }, children: _jsx(Typography, { variant: "h1", gutterBottom: true, sx: { fontWeight: "bold" }, children: title || "Event Title" }) }), coverImageSrc && (_jsx(Box, { sx: { textAlign: "center", my: 2 }, children: _jsx(Box, { component: "img", src: coverImageSrc, alt: "Cover", sx: {
                        display: "inline-block",
                        maxWidth: "80%",
                        width: "100%",
                        height: "auto",
                        objectFit: "cover",
                        borderRadius: 2,
                    } }) })), _jsxs(Box, { sx: {
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    px: { xs: 2, md: 6 },
                    py: 4,
                }, children: [_jsx(Box, { flex: "1 1 20%", minWidth: 200, sx: { order: { xs: 1, md: 2 } }, children: _jsxs(Box, { sx: {
                                border: 3,
                                borderColor: 'secondary.main',
                                borderRadius: 2,
                                position: 'relative',
                                pt: 3,
                                px: 2,
                                pb: 2
                            }, children: [_jsx(Box, { sx: {
                                        position: 'absolute',
                                        top: -12,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }, children: _jsx(Box, { sx: {
                                            px: 2,
                                            backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
                                            color: 'secondary.main',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            fontFamily: "monaco",
                                        }, children: "EVENT DETAILS" }) }), _jsxs(Typography, { variant: "body1", sx: { mb: 1 }, children: [_jsx("strong", { children: "Date:" }), " ", date] }), _jsxs(Typography, { variant: "body1", sx: { mb: 1 }, children: [_jsx("strong", { children: "Time:" }), " ", startTime] }), _jsxs(Typography, { variant: "body1", sx: { mb: 1 }, children: [_jsx("strong", { children: "Duration:" }), " ", duration] }), _jsxs(Typography, { variant: "body1", sx: { mb: 1 }, children: [_jsx("strong", { children: "Location:" }), " ", location] }), _jsxs(Typography, { variant: "body1", sx: { mb: 1 }, children: [_jsx("strong", { children: "Max Capacity:" }), " ", maxCapacity === 0 ? "No Limit" : maxCapacity] }), _jsxs(Typography, { variant: "body1", sx: { mb: 1 }, children: [_jsx("strong", { children: "Participants:" }), " ", current_attendees?.length || 0] }), _jsx(Box, { sx: { mt: 2 }, children: !isMember ? (_jsx(Button, { variant: "outlined", onClick: handleJoinSociety, sx: {
                                            color: "white",
                                            backgroundColor: "greenAccent.main",
                                            border: "1px auto",
                                        }, children: "Join Society to RSVP" })) : isParticipant ? (_jsx(Button, { variant: "contained", color: "error", onClick: handleCancelRSVP, children: "Cancel RSVP" })) : (_jsx(Button, { variant: "contained", onClick: handleJoinEvent, sx: {
                                            color: "white",
                                            backgroundColor: "green",
                                            border: "1px auto"
                                        }, children: "Join Event" })) })] }) }), _jsxs(Box, { flex: "1 1", pr: { md: 2 }, sx: { order: { xs: 2, md: 1 } }, minWidth: "70%", children: [_jsx(Typography, { variant: "h3", sx: { mb: 2, fontWeight: "bold" }, children: "Overview" }), _jsx(Typography, { variant: "body1", sx: { whiteSpace: "pre-wrap", mb: 3 }, children: mainDescription || "No description provided." }), extraModules.map(renderModule), participantModules.length > 0 && (isParticipant ? (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "h3", sx: { mb: 2, fontWeight: "bold" }, children: "Participants Only Content" }), participantModules.map(renderModule)] })) : (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "h3", sx: { mb: 2, fontWeight: "bold" }, children: "Participants Only Content" }), _jsx(Typography, { variant: "body1", sx: { fontStyle: "italic", color: "gray" }, children: "Join the event and see the hidden information." })] })))] })] }), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 3000, onClose: () => setSnackbarOpen(false), anchorOrigin: { vertical: "top", horizontal: "center" }, children: _jsx(MuiAlert, { onClose: () => setSnackbarOpen(false), severity: "info", sx: { width: '100%' }, elevation: 6, variant: "filled", children: snackbarMsg }) })] }));
}
