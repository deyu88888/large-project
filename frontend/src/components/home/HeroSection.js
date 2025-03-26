import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Breadcrumbs, Container, Link, Typography, useTheme } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { tokens } from "../../theme/theme";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
export default function HeroSection({ showCarousel = false, title, subtitle, breadcrumbs }) {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const renderContent = (customTitle, customSubtitle) => (_jsxs(Box, { padding: 2, sx: { textAlign: "left", pl: { xs: 2, md: 4 } }, children: [_jsx(Typography, { color: theme.palette.mode === "dark" ? "greenAccent.main" : "greenAccent.dark", variant: "h1", align: "left", sx: {
                    fontWeight: 700,
                    fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                    maxWidth: "800px"
                }, children: customTitle }), _jsx(Typography, { color: colors.grey[100], variant: "h6", align: "left", sx: {
                    mt: 2,
                    fontSize: { xs: "1.0rem", sm: "1.0rem", md: "1.0rem" },
                    maxWidth: "700px"
                }, children: customSubtitle })] }));
    return (_jsx(Box, { sx: {
            overflow: "hidden",
            position: "relative",
            backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
            height: 400,
            marginBottom: 4,
        }, children: showCarousel ? (_jsx(Carousel, { NextIcon: _jsx("div", { children: ">" }), PrevIcon: _jsx("div", { children: "<" }), navButtonsProps: {
                style: {
                    backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
                    color: "#ffffff",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                },
            }, indicatorContainerProps: {
                style: {
                    marginTop: 0,
                    position: "absolute",
                    bottom: "20px",
                    zIndex: 1,
                },
            }, activeIndicatorIconButtonProps: {
                style: {
                    color: isLight ? colors.greenAccent[400] : colors.greenAccent[400],
                },
            }, animation: "slide", duration: 600, children: [0, 1, 2, 3].map((i) => (_jsx(Box, { width: 1, height: 400, sx: {
                    backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }, children: _jsx(Container, { maxWidth: "xl", children: i === 0
                        ? renderContent("Welcome to Infinite Loop Innovators", "Discover societies, events, and latest news all in one place")
                        : renderContent(`Featured Content ${i}`, "Explore our selection of highlighted events and societies") }) }, i))) })) : (_jsx(Box, { width: 1, height: "100%", sx: {
                backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: _jsxs(Container, { maxWidth: "xl", children: [breadcrumbs && (_jsx(Breadcrumbs, { separator: _jsx(NavigateNextIcon, { fontSize: "small" }), "aria-label": "breadcrumb", sx: { mb: 2, color: colors.grey[200], ml: 4 }, children: breadcrumbs.map((item, index) => item.href ? (_jsx(Link, { underline: "hover", color: "inherit", href: item.href, children: item.label }, index)) : (_jsx(Typography, { color: "text.primary", children: item.label }, index))) })), renderContent(title, subtitle)] }) })) }));
}
