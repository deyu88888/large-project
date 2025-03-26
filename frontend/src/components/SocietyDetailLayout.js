import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { keyframes, useTheme } from "@mui/material/styles";
import Link from "@mui/material/Link";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import { tokens } from "../theme/theme";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useSettingsStore } from "../stores/settings-store";
const SocietyDetailLayout = ({ society, loading, joined, onJoinSociety, }) => {
    const theme = useTheme();
    const { drawer } = useSettingsStore();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const scrollAnimation = keyframes `
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-10%);
    }
  `;
    if (loading) {
        return (_jsx("p", { style: {
                textAlign: "center",
                fontSize: "1.125rem",
            }, children: "Loading society..." }));
    }
    let iconSrc;
    if (society?.icon) {
        if (typeof society.icon === "string") {
            iconSrc = society.icon;
        }
        else if (society.icon instanceof File) {
            iconSrc = URL.createObjectURL(society.icon);
        }
    }
    return (_jsx(Box, { sx: {
            marginTop: "0px",
            transition: "margin-left 0.3s ease-in-out",
            minHeight: "100vh",
            padding: "30px 50px",
            backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
            maxWidth: drawer ? `calc(90vw - 125px)` : "90vw",
            marginLeft: "auto",
            marginRight: "auto",
        }, children: _jsxs(Box, { sx: {
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2rem",
            }, children: [_jsx("header", { style: { textAlign: "center", marginBottom: "0rem" }, children: _jsxs("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }, children: [society?.icon && (_jsx("img", { src: iconSrc, alt: `${society.name} icon`, style: {
                                    width: "100px",
                                    height: "100px",
                                    borderRadius: "50%",
                                    verticalAlign: "middle",
                                    marginBottom: "1rem",
                                } })), _jsx("h1", { style: {
                                    fontSize: "2.25rem",
                                    fontWeight: 700,
                                    fontFamily: "monaco",
                                }, children: society?.name })] }) }), _jsx("p", { style: {
                        fontSize: "1rem",
                        fontWeight: 400,
                        marginBottom: "4rem",
                        marginTop: "-1.5rem",
                        textAlign: "center",
                    }, children: society?.category }), _jsxs("div", { style: {
                        display: "flex",
                        gap: "3rem",
                    }, children: [_jsx("div", { style: { flex: 1.5 }, children: _jsx("p", { style: {
                                    fontSize: 20,
                                    whiteSpace: "pre-wrap",
                                    marginBottom: "1.5rem",
                                }, children: society?.description }) }), _jsxs("div", { style: { flex: 0.5, fontFamily: "monaco" }, children: [_jsxs(Box, { sx: {
                                        border: 3,
                                        borderColor: "secondary.main",
                                        borderRadius: 2,
                                        position: "relative",
                                        pt: 3,
                                        px: 2,
                                        pb: 2,
                                        mb: 3,
                                        backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
                                    }, children: [_jsx(Box, { sx: {
                                                position: "absolute",
                                                top: -12,
                                                left: 0,
                                                right: 0,
                                                display: "flex",
                                                justifyContent: "center",
                                            }, children: _jsx(Box, { sx: {
                                                    px: 2,
                                                    backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
                                                    color: "secondary.main",
                                                    fontWeight: "bold",
                                                    textAlign: "center",
                                                }, children: "SOCIETY ROLES" }) }), _jsxs(Box, { sx: { display: "flex", flexDirection: "column", alignItems: "center" }, children: [_jsxs(Typography, { variant: "h5", sx: { mb: 1 }, children: [_jsx("strong", { children: "President:" }), " ", society?.president.first_name, " ", society?.president.last_name] }), society?.vice_president && (_jsxs(Typography, { variant: "h5", sx: { mb: 1 }, children: [_jsx("strong", { children: "Vice President:" }), " ", society.vice_president.first_name, " ", society.vice_president.last_name] })), society?.event_manager && (_jsxs(Typography, { variant: "h5", sx: { mb: 1 }, children: [_jsx("strong", { children: "Event Manager:" }), " ", society.event_manager.first_name, " ", society.event_manager.last_name] })), society?.treasurer && (_jsxs(Typography, { variant: "h5", sx: { mb: 1 }, children: [_jsx("strong", { children: "Treasurer:" }), " ", society.treasurer.first_name, " ", society.treasurer.last_name] }))] })] }), _jsxs(Box, { sx: { display: "flex", justifyContent: "center", mt: 3 }, children: [joined === 0 && (_jsx("button", { onClick: () => onJoinSociety(society.id), style: {
                                                backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
                                                color: isLight ? "#ffffff" : colours.grey[100],
                                                padding: "0.5rem 1.5rem",
                                                borderRadius: "0.5rem",
                                                transition: "all 0.2s ease",
                                                border: "none",
                                                cursor: "pointer",
                                            }, children: "Join Society" })), joined === 1 && (_jsx("button", { disabled: true, style: {
                                                backgroundColor: isLight ? colours.grey[900] : colours.grey[300],
                                                color: isLight ? colours.grey[0] : "#ffffff",
                                                padding: "0.5rem 1.5rem",
                                                borderRadius: "0.5rem",
                                                transition: "all 0.2s ease",
                                                border: "none",
                                                cursor: "not-allowed",
                                            }, children: "Request Pending" }))] })] })] }), society?.showreel_images && society.showreel_images.length > 0 && (_jsxs(Box, { sx: {
                        overflow: "hidden",
                        width: "100%",
                        position: "relative",
                        mt: 4,
                        p: 6,
                    }, children: [_jsx(Typography, { variant: "h3", gutterBottom: true, textAlign: "center", padding: 2, sx: { fontWeight: "bold", fontFamily: "monaco" }, children: "Our Society Moments!" }), _jsx(Box, { sx: {
                                display: "inline-flex",
                                animation: `${scrollAnimation} 20s linear infinite`,
                                width: "max-content",
                                gap: 2,
                                "&:hover": {
                                    animationPlayState: "paused",
                                },
                            }, children: [...Array(6).keys()].map((_, index) => (_jsx(Box, { sx: { display: "inline-flex", gap: 2 }, children: society.showreel_images.map((showreel, showreelIndex) => (_jsxs(Paper, { elevation: 2, sx: {
                                        p: 1,
                                        textAlign: "center",
                                        minWidth: 200,
                                        transition: "transform 0.3s",
                                        backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
                                        "&:hover": {
                                            transform: "scale(1.05)",
                                            zIndex: 10,
                                        },
                                    }, children: [_jsx("img", { src: showreel.photo, alt: `Showreel ${showreelIndex + 1}`, style: {
                                                width: 200,
                                                height: 150,
                                                objectFit: "cover",
                                                borderRadius: 8,
                                            } }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 1, display: "block" }, children: showreel.caption })] }, showreelIndex))) }, index))) })] })), _jsx(Divider, {}), _jsxs("div", { style: { display: "flex" }, children: [_jsxs("div", { style: { flex: 1.0 }, children: [_jsx("p", { style: { marginBottom: "1.5rem", fontFamily: "monaco", fontSize: 15 }, children: society?.tags?.map((tag) => "#" + tag || "No society tags!").join(", ") }), _jsxs("p", { style: { fontSize: 18 }, children: ["Contact us:", " ", _jsx(Link, { href: "mailto:" + society?.president.email, style: {
                                                color: isLight ? colours.primary[600] : colours.primary[100],
                                                textDecoration: "none",
                                            }, children: society?.president.email })] })] }), _jsxs("div", { style: { flex: 1.0 }, children: [society?.social_media_links["Instagram"] && (_jsx(Link, { href: society?.social_media_links["Facebook"], target: "_blank", children: _jsx(FacebookIcon, { style: { fontSize: 70, color: isLight ? "black" : "white" } }) })), society?.social_media_links["Instagram"] && (_jsx(Link, { href: society?.social_media_links["Instagram"], target: "_blank", children: _jsx(InstagramIcon, { style: { fontSize: 70, color: isLight ? "black" : "white" } }) })), society?.social_media_links["X"] && (_jsx(Link, { href: society?.social_media_links["X"], target: "_blank", children: _jsx(XIcon, { style: { fontSize: 70, color: isLight ? "black" : "white" } }) })), society?.social_media_links["WhatsApp"] && (_jsx(Link, { href: society?.social_media_links["WhatsApp"], target: "_blank", children: _jsx(WhatsAppIcon, { style: { fontSize: 70, color: isLight ? "black" : "white" } }) })), society?.social_media_links["Other"] && (_jsx(Link, { href: society?.social_media_links["Other"], target: "_blank", children: _jsx(StarOutlineRoundedIcon, { style: { fontSize: 70, color: isLight ? "black" : "white" } }) }))] })] })] }) }));
};
export default SocietyDetailLayout;
