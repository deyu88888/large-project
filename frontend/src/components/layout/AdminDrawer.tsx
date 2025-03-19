import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import LogoutIcon from "@mui/icons-material/Logout";
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import GroupsIcon from '@mui/icons-material/Groups';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';

interface AdminDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  location: { pathname: string };
}

const AdminDrawer: React.FC<AdminDrawerProps> = ({
  drawer,
  toggleDrawer,
  location,
}) => {
  const [selected, setSelected] = useState("Dashboard");
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const menuItems = [
    
    { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/admin" },
    {
      title: "Manage Students",
      icon: <PeopleOutlinedIcon />,
      to: "/admin/student-list",
    },
    {
      title: "Manage Societies",
      icon: <SportsFootballIcon />,
      to: "/admin/society",
    },
    {
      title: "Manage Events",
      icon: <EventIcon />,
      to: "/admin/event",
    },
    {
      title: "Calendar",
      to: "/admin/calendar",
      icon: <CalendarMonthIcon />,
    },
    { title: "Reports", icon: <InboxIcon />, to: "/admin/reports" },

  ];

    // Check if user is super admin before adding the menu item
  if (user?.is_super_admin) {
    menuItems.push({
      title: "Create Admin",
      icon: <PersonAddAltIcon />,
      to: "/admin/create-admin",
    });
  }

  const additionalItems = [
    {
      title: "My Team",
      icon: <GroupsIcon />,
      to: "/admin/student-list",
    },
    {
      title: "Create Admin",
      icon: <PersonAddAltIcon />,
      to: "/admin/create-admin",
    },
    {
      title: "Activity Log",
      icon: <ManageHistoryIcon />,
      to: "/admin/activity-log",
    },
  ];

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <CustomDrawer variant="permanent" open={drawer}>
        <CustomDrawerHeader>
          <IconButton onClick={() => toggleDrawer()}>
            {drawer && <ChevronLeftIcon />}
          </IconButton>
        </CustomDrawerHeader>
        <Divider />

      {/* User Info Section */}
      <Box
        padding={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {drawer ? (
          <Box textAlign="center">
            <Avatar sx={{ width: 72, height: 72, margin: "0 auto" }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mt: "10px" }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {user?.is_super_admin ? "Super Admin" : "Admin"}
            </Typography>
          </Box>
        ) : (
          <Avatar sx={{ width: 25, height: 25 }} />
        )}
      </Box>
      <Divider />

      {/* Menu Items */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.title} disablePadding>
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
                sx={{
                  minWidth: 0,
                  mr: drawer ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawer && <ListItemText primary={item.title} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />

      {/* Additional Items */}
      <List>
        {additionalItems.map((item) => (
          <ListItem key={item.title} disablePadding>
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
                sx={{
                  minWidth: 0,
                  mr: drawer ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawer && <ListItemText primary={item.title} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Logout Item */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              minHeight: 48,
              px: 2.5,
              justifyContent: drawer ? "initial" : "center",
              color: "red",
            }}
            onClick={logout}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: drawer ? 3 : "auto",
                justifyContent: "center",
              }}
            >
              <LogoutIcon sx={{ color: "red" }} />
            </ListItemIcon>
            {drawer && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </List>
    </CustomDrawer>
  );
};

export default AdminDrawer;