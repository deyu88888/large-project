import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, IconButton, InputBase, Toolbar, useTheme, } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import { useSettingsStore } from "../stores/settings-store";
import { useAuthStore } from "../stores/auth-store";
import { SearchContext } from "./layout/SearchContext";
import AdminDrawer from "./layout/AdminDrawer";
import StudentDrawer from "./layout/StudentDrawer";
import PresidentDrawer from "./layout/PresidentDrawer";
import { CustomAppBar } from "./layout/drawer/CustomDrawer";
const Layout = () => {
    const theme = useTheme();
    const { drawer, toggleDrawer, toggleThemeMode } = useSettingsStore();
    const { searchTerm, setSearchTerm } = useContext(SearchContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    // If the user is a president, use the PresidentDrawer.
    // Otherwise, use the admin drawer if the route starts with "/admin", or student drawer for other routes.
    const DrawerComponent = user?.is_president
        ? PresidentDrawer
        : location.pathname.startsWith("/admin")
            ? AdminDrawer
            : StudentDrawer;
    const handleSearch = () => {
        if (!searchTerm.trim())
            return;
        if (location.pathname.startsWith("/student")) {
            navigate(`/student/student-search?q=${encodeURIComponent(searchTerm)}`);
        }
        else if (location.pathname.startsWith("/admin")) {
            setSearchTerm(searchTerm);
        }
    };
    return (_jsxs(Box, { sx: { display: "flex" }, children: [_jsx(CustomAppBar, { position: "fixed", open: drawer, elevation: 0, sx: {
                    backgroundColor: theme.palette.mode === "dark"
                        ? theme.palette.background.default
                        : theme.palette.background.default,
                }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { color: "inherit", "aria-label": "open drawer", onClick: () => toggleDrawer(), edge: "start", sx: [
                                {
                                    marginRight: 5,
                                },
                                drawer && { display: "none" },
                            ], children: _jsx(MenuIcon, { sx: {
                                    color: theme.palette.text.primary,
                                } }) }), _jsxs(Box, { display: "flex", borderRadius: "3px", children: [_jsx(InputBase, { sx: { ml: 2, flex: 1 }, placeholder: "Search", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), onKeyDown: (e) => {
                                        if (e.key === "Enter") {
                                            handleSearch();
                                        }
                                    } }), _jsx(IconButton, { type: "button", sx: { p: 1 }, onClick: handleSearch, children: _jsx(SearchIcon, {}) })] }), _jsxs(Box, { display: "flex", marginLeft: "auto", children: [_jsx(IconButton, { onClick: () => {
                                        console.log("changing theme");
                                        toggleThemeMode();
                                    }, children: theme.palette.mode === "dark" ? (_jsx(DarkModeOutlinedIcon, {})) : (_jsx(LightModeOutlinedIcon, {})) }), _jsx(IconButton, { onClick: () => {
                                        if (location.pathname.startsWith("/admin")) {
                                            navigate("/admin/profile");
                                        }
                                        else if (location.pathname.startsWith("/student") || location.pathname.startsWith("/president")) {
                                            navigate("/student/profile");
                                        }
                                        else {
                                            navigate("/profile");
                                        }
                                    }, children: _jsx(PersonOutlinedIcon, {}) })] })] }) }), _jsx(DrawerComponent, { drawer: drawer, toggleDrawer: toggleDrawer, location: location }), _jsx(Box, { component: "main", sx: { flexGrow: 1, p: 3, mt: "64px" }, children: _jsx(Outlet, {}) })] }));
};
export default Layout;
