import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import { Avatar, Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import LogoutIcon from "@mui/icons-material/Logout";
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import GroupsIcon from '@mui/icons-material/Groups';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
const AdminDrawer = ({ drawer, toggleDrawer, location, }) => {
    const [selected, setSelected] = useState("Dashboard");
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const menuItems = [
        { title: "Dashboard", icon: _jsx(HomeOutlinedIcon, {}), to: "/admin" },
        {
            title: "Manage Students",
            icon: _jsx(PeopleOutlinedIcon, {}),
            to: "/admin/student-list",
        },
        {
            title: "Manage Societies",
            icon: _jsx(SportsFootballIcon, {}),
            to: "/admin/society",
        },
        {
            title: "Manage Events",
            icon: _jsx(EventIcon, {}),
            to: "/admin/event",
        },
        {
            title: "Calendar",
            to: "/admin/calendar",
            icon: _jsx(CalendarMonthIcon, {}),
        },
        { title: "Reports", icon: _jsx(InboxIcon, {}), to: "/admin/reports" },
    ];
    const additionalItems = [
        {
            title: "My Team",
            icon: _jsx(GroupsIcon, {}),
            to: "/admin/my-team",
        },
        {
            title: "Activity Log",
            icon: _jsx(ManageHistoryIcon, {}),
            to: "/admin/activity-log",
        },
    ];
    // Check if user is super admin before adding the menu item
    if (user?.is_super_admin) {
        additionalItems.push({
            title: "Create Admin",
            icon: _jsx(PersonAddAltIcon, {}),
            to: "/admin/create-admin",
        });
    }
    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };
    return (_jsxs(CustomDrawer, { variant: "permanent", open: drawer, children: [_jsx(CustomDrawerHeader, { children: _jsx(IconButton, { onClick: () => toggleDrawer(), children: drawer && _jsx(ChevronLeftIcon, {}) }) }), _jsx(Divider, {}), _jsx(Box, { padding: 2, display: "flex", justifyContent: "center", alignItems: "center", children: drawer ? (_jsx(Box, { textAlign: "center", children: _jsxs(Link, { to: "/admin/profile", style: { textDecoration: "none", color: "inherit" }, children: [_jsx(Avatar, { sx: { width: 72, height: 72, margin: "0 auto" } }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", sx: { mt: "10px" }, children: [user?.first_name, " ", user?.last_name] }), _jsx(Typography, { variant: "body2", color: "textSecondary", children: user?.is_super_admin ? "Super Admin" : "Admin" })] }) })) : (_jsx(Avatar, { sx: { width: 25, height: 25 } })) }), _jsx(Divider, {}), _jsx(List, { children: menuItems.map((item) => (_jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { component: Link, to: item.to, selected: selected === item.title, onClick: () => setSelected(item.title), sx: {
                            justifyContent: drawer ? "initial" : "center",
                            px: 2.5,
                        }, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: 0,
                                    mr: drawer ? 3 : "auto",
                                    justifyContent: "center",
                                }, children: item.icon }), drawer && _jsx(ListItemText, { primary: item.title })] }) }, item.title))) }), _jsx(Divider, {}), _jsx(List, { children: additionalItems.map((item) => (_jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { component: Link, to: item.to, selected: selected === item.title, onClick: () => setSelected(item.title), sx: {
                            justifyContent: drawer ? "initial" : "center",
                            px: 2.5,
                        }, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: 0,
                                    mr: drawer ? 3 : "auto",
                                    justifyContent: "center",
                                }, children: item.icon }), drawer && _jsx(ListItemText, { primary: item.title })] }) }, item.title))) }), _jsx(Divider, {}), _jsx(List, { children: _jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { sx: {
                            minHeight: 48,
                            px: 2.5,
                            justifyContent: drawer ? "initial" : "center",
                            color: "red",
                        }, onClick: logout, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: 0,
                                    mr: drawer ? 3 : "auto",
                                    justifyContent: "center",
                                }, children: _jsx(LogoutIcon, { sx: { color: "red" } }) }), drawer && _jsx(ListItemText, { primary: "Logout" })] }) }) })] }));
};
export default AdminDrawer;
