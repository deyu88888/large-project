import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";

import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import Groups2Icon from "@mui/icons-material/Groups2";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import InboxIcon from "@mui/icons-material/MoveToInbox";

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
  const [student, setStudent] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
      const fetchStudentData = async () => {
        try {
          const response = await apiClient.get("/api/user/current");
          setStudent(response.data);
          console.log(response.data);
        } catch (error) {
          console.error("Error retrieving student:", error);
          alert("Failed to retrieve student. Please contact an administrator.");
        }
      };  
    fetchStudentData();
  }, []);

  const topMenuItems = [
    { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/student" },
    { title: "My Societies", icon: <Groups2Icon />, to: "/student/my-societies" },
    { title: "My Events", icon: <EventAvailableIcon />, to: "/student/view-events" },
    { title: "News", icon: <NewspaperIcon />, to: "/student/view-news" },
    { title: "Discover Societies", icon: <GroupAddOutlinedIcon />, to: "/student/join-society" },
    { title: "Discover Events", icon: <GroupAddOutlinedIcon />, to: "/student/all-events" },
    // "Start A Society" item has been removed
  ];

  const bottomMenuItems = [
    { title: "Notifications", icon: <NotificationsNoneOutlinedIcon />, to: "/student/view-notifications" },
    { title: "Inbox", icon: <InboxIcon />, to: "/student/view-inbox" },
    { title: "Report", icon: <ReportProblemOutlinedIcon />, to: "/student/report-to-admin" },
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
            <Link to="/student/profile" style={{ textDecoration: "none", color: "inherit" }}>
              <img
              src={student?.icon}
              alt={`${student?.username || 'User'} icon`}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                margin: "0 auto"
              }}
              />
              <Typography variant="h6" fontWeight="bold" sx={{ mt: "10px" }}>
                {student?.first_name} {student?.last_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                President
              </Typography>
            </Link>
          </Box>
        ) : (
          <img
            src={student?.icon}
            alt={`${student?.username || 'User'} icon`}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
            }}
          />
        )}
      </Box>
      <Divider />

      {/* Main Menu Items */}
      <List>
        {topMenuItems.map((item) => (
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

      <List>
        {bottomMenuItems.map((item) => (
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

      {/* Manage My Societies Section */}
      {drawer && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Manage
          </Typography>
        </Box>
      )}
      <List>
        {student && student.president_of ? (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to={"/president-page/" + student.president_of}
              selected={selected === "Manage My Societies"}
              onClick={() => setSelected("Manage My Societies")}
              sx={{ justifyContent: drawer ? "initial" : "center", px: 2.5 }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawer ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <ManageAccountsOutlinedIcon />
              </ListItemIcon>
              {drawer && <ListItemText primary="Manage My Societies" />}
            </ListItemButton>
          </ListItem>
        ) : null}
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

export default PresidentDrawer;