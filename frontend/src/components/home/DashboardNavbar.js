import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { alpha, AppBar, Avatar, Box, Button, Container, Drawer, IconButton, InputBase, Menu, MenuItem, styled, Toolbar, Tooltip, Typography, useTheme, } from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { SearchContext } from "../../components/layout/SearchContext";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { useSettingsStore } from "../../stores/settings-store";
const pages = [
    { name: "Home", path: "/" },
    { name: "Discover", path: "/search" },
    { name: "Societies", path: "/all-societies" },
    { name: "Events", path: "/all-events" },
    { name: "Calendar", path: "/calendar" },
    { name: "Support", path: "/support" },
];
const settings = ["Register", "Login", "Light/Dark"];
const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(3),
        width: "auto",
    },
}));
const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}));
const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    "& .MuiInputBase-input": {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "20ch",
        },
    },
}));
export const DashboardNavbar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleThemeMode } = useSettingsStore();
    const { searchTerm, setSearchTerm } = useContext(SearchContext);
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);
    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };
    const handleThemeToggle = () => {
        toggleThemeMode();
        handleCloseUserMenu();
    };
    const settingsActions = {
        Register: () => navigate("/register"),
        Login: () => navigate("/login"),
        "Light/Dark": handleThemeToggle,
    };
    // Determine text colors based on theme to ensure visibility
    const navTextColor = theme.palette.mode === "dark" ? "#ffffff" : "#000000";
    const highlightColor = theme.palette.mode === "dark" ? "greenAccent.main" : "greenAccent.dark";
    const hoverColor = theme.palette.mode === "dark" ? "greenAccent.main" : "greenAccent.dark";
    return (_jsx(AppBar, { position: "sticky", elevation: 0, sx: {
            bgcolor: (theme) => theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light"
        }, children: _jsx(Container, { maxWidth: "xl", children: _jsxs(Toolbar, { disableGutters: true, sx: {
                    height: {
                        xs: 56,
                        md: 64,
                    },
                }, children: [_jsx(Box, { sx: { flexGrow: 1, display: { xs: "none", md: "flex" } }, children: pages.map((page) => {
                            const isActive = location.pathname === page.path;
                            return (_jsx(Button, { onClick: () => {
                                    handleCloseNavMenu();
                                    navigate(page.path);
                                }, sx: {
                                    color: isActive ? highlightColor : navTextColor,
                                    display: "block",
                                    position: "relative",
                                    height: "64px",
                                    mx: 1,
                                    transition: "color 0.3s ease-in-out",
                                    fontWeight: isActive ? "bold" : "normal",
                                    "&::after": {
                                        content: '""',
                                        position: "absolute",
                                        width: isActive ? "100%" : "0",
                                        height: "2px",
                                        bottom: 0,
                                        left: 0,
                                        backgroundColor: highlightColor,
                                        transition: "width 0.3s ease-in-out",
                                    },
                                    "&:hover": {
                                        color: hoverColor,
                                        bgcolor: "transparent",
                                    },
                                    "&:hover::after": {
                                        width: "100%",
                                        backgroundColor: hoverColor
                                    },
                                }, children: page.name }, page.name));
                        }) }), _jsxs(Box, { sx: { flexGrow: 1, display: { xs: "flex", md: "none" } }, children: [_jsx(IconButton, { size: "large", "aria-label": "account of current user", "aria-controls": "menu-appbar", "aria-haspopup": "true", onClick: handleOpenNavMenu, color: "inherit", children: _jsx(MenuIcon, {}) }), _jsx(Drawer, { open: Boolean(anchorElNav), onClose: handleCloseNavMenu, slotProps: {
                                    paper: {
                                        sx: {
                                            backgroundColor: "primary.main",
                                        },
                                    },
                                }, children: _jsx(Box, { width: "50vw", children: pages.map((page) => {
                                        const isActive = location.pathname === page.path;
                                        return (_jsx(MenuItem, { onClick: () => {
                                                handleCloseNavMenu();
                                                navigate(page.path);
                                            }, children: _jsx(Typography, { sx: {
                                                    textAlign: "center",
                                                    color: isActive ? highlightColor : navTextColor,
                                                    fontWeight: isActive ? "bold" : "normal"
                                                }, children: page.name }) }, page.name));
                                    }) }) })] }), _jsxs(Search, { children: [_jsx(SearchIconWrapper, { children: _jsx(SearchIcon, {}) }), _jsx(StyledInputBase, { placeholder: "Search\u2026", inputProps: { "aria-label": "search" }, value: searchTerm, onChange: handleSearchChange, onKeyPress: (e) => {
                                    if (e.key === "Enter") {
                                        navigate(`/search?q=${e.target.value}`);
                                    }
                                } })] }), _jsxs(Box, { sx: { flexGrow: 0 }, children: [_jsx(Tooltip, { title: "Open settings", children: _jsx(IconButton, { size: "small", onClick: handleOpenUserMenu, sx: { p: 0 }, children: _jsx(Avatar, {}) }) }), _jsx(Menu, { sx: { mt: "45px" }, id: "menu-appbar", anchorEl: anchorElUser, anchorOrigin: {
                                    vertical: "top",
                                    horizontal: "right",
                                }, keepMounted: true, transformOrigin: {
                                    vertical: "top",
                                    horizontal: "right",
                                }, open: Boolean(anchorElUser), onClose: handleCloseUserMenu, children: settings.map((setting) => (_jsx(MenuItem, { onClick: settingsActions[setting] || handleCloseUserMenu, children: _jsx(Typography, { sx: { textAlign: "center" }, children: setting === "Light/Dark" ? (_jsxs(_Fragment, { children: [theme.palette.mode === "dark"
                                                    ? "Light Mode"
                                                    : "Dark Mode", theme.palette.mode === "dark" ? (_jsx(LightModeOutlinedIcon, { sx: { ml: 1, p: 0.1 } })) : (_jsx(DarkModeOutlinedIcon, { sx: { ml: 1, p: 0.1 } }))] })) : (setting) }) }, setting))) })] })] }) }) }));
};
