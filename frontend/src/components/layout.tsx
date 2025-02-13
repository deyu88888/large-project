import React, { useContext, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import { useSettingsStore } from "../stores/settings-store";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

import {
  CustomAppBar,
  CustomDrawer,
  CustomDrawerHeader,
} from "./layout/drawer/CustomDrawer";
import { SearchContext } from "./layout/SearchContext";

interface LayoutProps {}

const Layout: React.FC<LayoutProps> = () => {
  const theme = useTheme();
  const { drawer, toggleDrawer } = useSettingsStore();
  const { toggleThemeMode } = useSettingsStore();
  const [selected, setSelected] = useState("Dashboard");
  const { searchTerm, setSearchTerm } = useContext(SearchContext);
  const location = useLocation();

  let menuItems = [];
  if (location.pathname.startsWith("/admin")) {
    menuItems = [
      { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/admin" },
      { title: "Manage Students", icon: <PeopleOutlinedIcon />, to: "/admin/student-list" },
      { title: "View All Societies", icon: <EventOutlinedIcon />, to: "/admin/society-list" },
      { title: "View All Events", icon: <NotificationsNoneOutlinedIcon />, to: "/admin/event-list" },
      { title: "Pending Societies", icon: <GroupAddOutlinedIcon />, to: "/admin/request-society" },
      { title: "Pending Events", icon: <GroupAddOutlinedIcon />, to: "/admin/request-event" },
      { title: "Calendar", icon: <CalendarTodayOutlinedIcon />, to: "/admin/calendar" },
      { title: "Activity Log", icon: <CalendarTodayOutlinedIcon />, to: "/admin/admin-dashboard" },
      { title: "Create Admin", icon: <PersonAddAltIcon />, to: "/admin/create-admin" },
    ];
  } else if (location.pathname.startsWith("/student")) {
    menuItems = [
      { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/student" },
      { title: "My Societies", icon: <GroupAddOutlinedIcon />, to: "/student/my-societies" },
      { title: "Start Society", icon: <EventOutlinedIcon />, to: "/student/start-society" },
      { title: "View Events", icon: <NotificationsNoneOutlinedIcon />, to: "/student/view-events" },
      { title: "Notifications", icon: <PersonOutlinedIcon />, to: "/student/view-notifications" },
    ];
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CustomAppBar
        position="fixed"
        open={drawer}
        elevation={0}
        sx={{
          backgroundColor: "transparent",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => toggleDrawer()}
            edge="start"
            sx={[
              { marginRight: 5 },
              drawer && { display: "none" },
            ]}
          >
            <MenuIcon
              sx={{ color: theme.palette.text.primary }}
            />
          </IconButton>
          <Box display="flex" borderRadius="3px">
            <InputBase
              sx={{ ml: 2, flex: 1 }}
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IconButton type="button" sx={{ p: 1 }}>
              <SearchIcon />
            </IconButton>
          </Box>
          <Box display="flex" marginLeft={"auto"}>
            <IconButton
              onClick={() => {
                console.log("changing theme");
                toggleThemeMode();
              }}
            >
              {theme.palette.mode === "dark" ? (
                <DarkModeOutlinedIcon />
              ) : (
                <LightModeOutlinedIcon />
              )}
            </IconButton>
            <IconButton>
              <NotificationsOutlinedIcon />
            </IconButton>
            <IconButton>
              <SettingsOutlinedIcon />
            </IconButton>
            <IconButton>
              <PersonOutlinedIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </CustomAppBar>
      <CustomDrawer variant="permanent" open={drawer}>
        <CustomDrawerHeader>
          <IconButton onClick={() => toggleDrawer()}>
            {drawer && <ChevronLeftIcon />}
          </IconButton>
        </CustomDrawerHeader>
        <Divider />
        <Box padding={2} display="flex" justifyContent="center" alignItems="center">
          {drawer ? (
            <Box textAlign="center">
              <Avatar
                sx={{ width: "72px", height: "72px", margin: "0 auto" }}
              />
              <Typography variant="h6" fontWeight="bold" sx={{ mt: "10px" }}>
                Ed Roh
              </Typography>
              <Typography variant="body2" color="textSecondary">
                VP Fancy Admin
              </Typography>
            </Box>
          ) : (
            <Avatar sx={{ width: "25px", height: "25px" }} />
          )}
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.title} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={selected === item.title}
                onClick={() => setSelected(item.title)}
                sx={{
                  justifyContent: drawer ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: "center" },
                    drawer ? { mr: 3 } : { mr: "auto" },
                  ]}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  sx={{ opacity: drawer ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {["All mail", "Trash", "Spam"].map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  drawer ? { justifyContent: "initial" } : { justifyContent: "center" },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: "center" },
                    drawer ? { mr: 3 } : { mr: "auto" },
                  ]}
                >
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={[drawer ? { opacity: 1 } : { opacity: 0 }]}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CustomDrawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <CustomDrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
