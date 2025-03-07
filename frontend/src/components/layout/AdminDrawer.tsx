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
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import LogoutIcon from "@mui/icons-material/Logout";
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";

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
      icon: <EventOutlinedIcon />,
      to: "/admin/society",
    },
    {
      title: "Manage Events",
      icon: <EventOutlinedIcon />,
      to: "/admin/event",
    },
    {
      title: "Pending Societies",
      icon: <GroupAddOutlinedIcon />,
      to: "/admin/request-society",
    },
    {
      title: "Pending Events",
      icon: <GroupAddOutlinedIcon />,
      to: "/admin/request-event",
    },
    {
      title: "Pending Descriptions",
      icon: <GroupAddOutlinedIcon />,
      to: "/admin/request-description",
    },
    // {(student?.is_president === true || student?.is_vice_president === true) && (
    // below should only be added if admnin is a 'super admin'
    // console.log({user?.is_super_admin});
    // {
    //   title: "Create Admin",
    //   icon: <PersonAddAltIcon />,
    //   to: "/admin/create-admin",
    // },
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
    { title: "Reports", icon: <InboxIcon />, to: "/admin/report-list" },
    {
      title: "Calendar",
      icon: <CalendarTodayOutlinedIcon />,
      to: "/admin/calendar",
    },
    {
      title: "Activity Log",
      icon: <CalendarTodayOutlinedIcon />,
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