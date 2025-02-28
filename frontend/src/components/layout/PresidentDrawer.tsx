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
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";

interface PresidentDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  location: { pathname: string };
}

const PresidentDrawer: React.FC<PresidentDrawerProps> = ({
  drawer,
  toggleDrawer,
  location,
}) => {
  const [selected, setSelected] = useState("Dashboard");
  const navigate = useNavigate();

  const menuItems = [
    { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/student" },
    { title: "My Societies", icon: <GroupAddOutlinedIcon />, to: "/student/my-societies" },
    { title: "Start Society", icon: <EventOutlinedIcon />, to: "/student/start-society" },
    { title: "View Events", icon: <NotificationsNoneOutlinedIcon />, to: "/student/view-events" },
    { title: "Notifications", icon: <PersonOutlinedIcon />, to: "/student/view-notifications" },
  ];

  const manageMySocietiesItems = [
    { title: "Society Details", icon: <DescriptionOutlinedIcon />, to: "http://localhost:3000/president-page/1/manage-society-details" },
    { title: "Society Events", icon: <EventNoteOutlinedIcon />, to: "http://localhost:3000/president-page/1/manage-society-events" },
    { title: "Pending Members", icon: <PeopleOutlineIcon />, to: "http://localhost:3000/president-page/1/pending-members" },
    { title: "All Members", icon: <GroupOutlinedIcon />, to: "http://localhost:3000/president-page/1/view-society-members" },
    { title: "Report to Admin", icon: <ReportProblemOutlinedIcon />, to: "http://localhost:3000/president-page/1/report-to-admin" },
  ];

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <CustomDrawer variant="permanent" open={drawer}>
      <CustomDrawerHeader>
        <IconButton onClick={toggleDrawer}>
          {drawer && <ChevronLeftIcon />}
        </IconButton>
      </CustomDrawerHeader>
      <Divider />

      {/* User Info Section */}
      <Box padding={2} display="flex" justifyContent="center" alignItems="center">
        {drawer ? (
          <Box sx={{ textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, margin: "0 auto" }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mt: "10px" }}>
              President Name
            </Typography>
            <Typography variant="body2" color="textSecondary">
              President Dashboard
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
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              {drawer && <ListItemText primary={item.title} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />

      {/* Manage My Societies Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/president-page/1"
            selected={selected === "Manage My Societies"}
            onClick={() => setSelected("Manage My Societies")}
            sx={{ justifyContent: "initial", px: 2.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ManageAccountsOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Manage My Societies" />
          </ListItemButton>
        </ListItem>

        {manageMySocietiesItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton
              component="a"
              href={item.to}
              selected={selected === item.title}
              onClick={() => setSelected(item.title)}
              sx={{ justifyContent: "initial", px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
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
            to="/president/join-society"
            sx={{ justifyContent: drawer ? "initial" : "center", px: 2.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AddCircleOutlineIcon />
            </ListItemIcon>
            {drawer && <ListItemText primary="Join Societies" />}
          </ListItemButton>
        </ListItem>
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
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon sx={{ color: "red" }} />
            </ListItemIcon>
            {drawer && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </List>
    </CustomDrawer>
  );
};

export default PresidentDrawer;
