import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import Groups2Icon from "@mui/icons-material/Groups2";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import InboxIcon from "@mui/icons-material/MoveToInbox";
const PresidentDrawer = ({ drawer, toggleDrawer, location, }) => {
    const [selected, setSelected] = useState("Dashboard");
    const [student, setStudent] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await apiClient.get("/api/user/current");
                setStudent(response.data);
                console.log(student);
            }
            catch (error) {
                console.error("Error retrieving student:", error);
                alert("Failed to retrieve student. Please contact an administrator.");
            }
        };
        fetchStudentData();
    }, []);
    const topMenuItems = [
        { title: "Dashboard", icon: _jsx(HomeOutlinedIcon, {}), to: "/student" },
        { title: "My Societies", icon: _jsx(Groups2Icon, {}), to: "/student/my-societies" },
        { title: "My Events", icon: _jsx(EventAvailableIcon, {}), to: "/student/view-events" },
        { title: "News", icon: _jsx(NewspaperIcon, {}), to: "/student/view-news" },
        { title: "Discover Societies", icon: _jsx(GroupAddOutlinedIcon, {}), to: "/student/join-society" },
        { title: "Discover Events", icon: _jsx(GroupAddOutlinedIcon, {}), to: "/student/all-events" },
        // "Start A Society" item has been removed
    ];
    const bottomMenuItems = [
        { title: "Notifications", icon: _jsx(NotificationsNoneOutlinedIcon, {}), to: "/student/view-notifications" },
        { title: "Inbox", icon: _jsx(InboxIcon, {}), to: "/student/view-inbox" },
        { title: "Report", icon: _jsx(ReportProblemOutlinedIcon, {}), to: "/student/report-to-admin" },
    ];
    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };
    return (_jsxs(CustomDrawer, { variant: "permanent", open: drawer, children: [_jsx(CustomDrawerHeader, { children: _jsx(IconButton, { onClick: toggleDrawer, children: drawer && _jsx(ChevronLeftIcon, {}) }) }), _jsx(Divider, {}), _jsx(Box, { padding: 2, display: "flex", justifyContent: "center", alignItems: "center", children: drawer ? (_jsx(Box, { sx: { textAlign: "center" }, children: _jsxs(Link, { to: "/student/profile", style: { textDecoration: "none", color: "inherit" }, children: [_jsx("img", { src: student?.icon, alt: `${student?.username} icon`, style: {
                                    width: "72px",
                                    height: "72px",
                                    borderRadius: "50%",
                                    margin: "0 auto"
                                } }), _jsxs(Typography, { variant: "h6", fontWeight: "bold", sx: { mt: "10px" }, children: [student?.first_name, " ", student?.last_name] }), _jsx(Typography, { variant: "body2", color: "textSecondary", children: "President" })] }) })) : (_jsx("img", { src: student?.icon, alt: `${student?.username} icon`, style: {
                        width: "25px",
                        height: "25px",
                        borderRadius: "50%",
                    } })) }), _jsx(Divider, {}), _jsx(List, { children: topMenuItems.map((item) => (_jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { component: Link, to: item.to, selected: selected === item.title, onClick: () => setSelected(item.title), sx: { justifyContent: drawer ? "initial" : "center", px: 2.5 }, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: 0,
                                    mr: drawer ? 3 : "auto",
                                    justifyContent: "center",
                                }, children: item.icon }), drawer && _jsx(ListItemText, { primary: item.title })] }) }, item.title))) }), _jsx(Divider, {}), _jsx(List, { children: bottomMenuItems.map((item) => (_jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { component: Link, to: item.to, selected: selected === item.title, onClick: () => setSelected(item.title), sx: { justifyContent: drawer ? "initial" : "center", px: 2.5 }, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: 0,
                                    mr: drawer ? 3 : "auto",
                                    justifyContent: "center",
                                }, children: item.icon }), drawer && _jsx(ListItemText, { primary: item.title })] }) }, item.title))) }), _jsx(Divider, {}), drawer && (_jsx(Box, { sx: { px: 2, py: 1 }, children: _jsx(Typography, { variant: "subtitle2", color: "textSecondary", children: "Manage" }) })), _jsx(List, { children: _jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { component: Link, to: "/president-page/" + student.president_of, selected: selected === "Manage My Societies", onClick: () => setSelected("Manage My Societies"), sx: { justifyContent: drawer ? "initial" : "center", px: 2.5 }, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: 0,
                                    mr: drawer ? 3 : "auto",
                                    justifyContent: "center",
                                }, children: _jsx(ManageAccountsOutlinedIcon, {}) }), drawer && _jsx(ListItemText, { primary: "Manage My Societies" })] }) }) }), _jsx(Divider, {}), _jsx(List, { children: _jsx(ListItem, { disablePadding: true, children: _jsxs(ListItemButton, { sx: {
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
export default PresidentDrawer;
