import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import LogoutIcon from '@mui/icons-material/Logout';
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";

interface StudentDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  location: { pathname: string };
}

const StudentDrawer: React.FC<StudentDrawerProps> = ({
  drawer,
  toggleDrawer,
  location,
}) => {
  const [selected, setSelected] = useState("Dashboard");
  const navigate = useNavigate();

  const menuItems = [
    { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/student" },
    { title: "My Societies", icon: <PeopleOutlineIcon />, to: "/student/my-societies" },
    { title: "Start Society", icon: <AddCircleOutlineIcon />, to: "/student/start-society" },
    { title: "View Events", icon: <EventAvailableIcon />, to: "/student/view-events" },
    { title: "Notifications", icon: <NotificationsNoneOutlinedIcon />, to: "/student/view-notifications" },
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
          padding= {2}
          display= "flex"
          justifyContent= "center"
          alignItems= "center"
        >
          {drawer ? (
            <Box sx={{ textAlign: "center" }}>
              <Avatar sx={{ width: 72, height: 72, margin: "0 auto" }} />
              <Typography variant="h6" fontWeight="bold" sx={{ mt: "10px" }}>
                Student Name
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Student Dashboard
              </Typography>
            </Box>
          ) : (
            <Avatar sx={{ width: 25, height: 25 }} />
          )}
        </Box>
        <Divider />

        {/* Main Menu Items */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.title} disablePadding>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={selected === item.title}
                onClick={() => setSelected(item.title)}
                sx={{ justifyContent: drawer ? "initial" : "center", px: 2.5 }}
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

        {/* Join Societies Section */}
        {drawer && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Join Societies
            </Typography>
          </Box>
        )}
        <List>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/student/join-society" // Updated route to singular
              sx={{ justifyContent: drawer ? "initial" : "center", px: 2.5 }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawer ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <GroupAddOutlinedIcon />
              </ListItemIcon>
              {drawer && <ListItemText primary="Join Societies" />}
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />

        {/* Additional Items */}
        <List>
          {["All mail", "Trash", "Spam"].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: drawer ? "initial" : "center",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: drawer ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                {drawer && <ListItemText primary={text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider/>

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
                <LogoutIcon sx={{ color: "red"}}/> 
              </ListItemIcon>
              {drawer && <ListItemText primary="Logout" />}
            </ListItemButton>
          </ListItem>
        </List>
   </CustomDrawer>
  );
};

export default StudentDrawer;