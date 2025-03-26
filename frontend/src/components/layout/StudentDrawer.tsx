import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import {
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import LogoutIcon from '@mui/icons-material/Logout';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Groups2Icon from '@mui/icons-material/Groups2';

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
  const [student, setStudent] = useState<any>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await apiClient.get("/api/user/current");
        setStudent(response.data);
      } catch (error) {
        console.error("Error retrieving student:", error);
        alert("Failed to retrieve student. Please contact an administrator.");
      }
    };  
  fetchStudentData();
  },[]);

  const topMenuItems = [
    { title: "Dashboard", icon: <HomeOutlinedIcon />, to: "/student" },
    { title: "My Societies", icon: <Groups2Icon />, to: "/student/my-societies" },
    { title: "My Events", icon: <EventAvailableIcon />, to: "/student/view-events" },
    { title: "News", icon: <NewspaperIcon />, to: "/student/view-news" },
    { title: "Discover Societies", icon: <GroupAddOutlinedIcon />, to: "/student/join-society" },
    { title: "Discover Events", icon: <GroupAddOutlinedIcon />, to: "/student/all-events" },
    { title: "Start A Society", icon: <AddCircleOutlineIcon />, to: "/student/start-society" },
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
              <Link to="/student/profile" style={{ textDecoration: "none", color: "inherit" }}>
                <img
                  src={student?.icon}
                  alt={`${student?.username} icon`}
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
                  Student
                </Typography>
              </Link>
            </Box>
          ) : (
            <img
              src={student?.icon}
              alt={`${student?.username} icon`}
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