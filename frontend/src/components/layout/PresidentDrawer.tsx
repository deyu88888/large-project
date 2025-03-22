import React, { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
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
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import {
  HomeOutlined,
  PeopleOutline,
  EventAvailable,
  NotificationsNoneOutlined,
  NotificationImportantOutlined,
  AddCircleOutline,
  ReportProblemOutlined,
  DescriptionOutlined,
  EventNoteOutlined,
  GroupOutlined,
} from "@mui/icons-material";

import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import { useAuthStore } from "../../stores/auth-store";
import { useAuthContext } from "../auth/AuthContext";

interface PresidentDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  location: { pathname: string };
}

const PresidentDrawer: React.FC<PresidentDrawerProps> = ({
  drawer,
  toggleDrawer,
}) => {
  const { user } = useAuthStore();
  const { logoutMutation } = useAuthContext();
  const [selected, setSelected] = useState("Dashboard");

  const menuItems = useMemo(
    () => [
      { title: "Dashboard", icon: <HomeOutlined />, to: "/student" },
      {
        title: "My Societies",
        icon: <PeopleOutline />,
        to: "/student/my-societies",
      },
      {
        title: "Start Society",
        icon: <AddCircleOutline />,
        to: "/student/start-society",
      },
      {
        title: "View Events",
        icon: <EventAvailable />,
        to: "/student/view-events",
      },
      {
        title: "Notifications",
        icon: <NotificationsNoneOutlined />,
        to: "/student/view-notifications",
      },
      {
        title: "Inbox",
        icon: <NotificationImportantOutlined />,
        to: "/student/view-inbox",
      },
      {
        title: "Report to Admin",
        icon: <ReportProblemOutlined />,
        to: "/student/report-to-admin",
      },
    ],
    []
  );

  const manageMySocietiesItems = useMemo(
    () => [
      {
        title: "Society Details",
        icon: <DescriptionOutlined />,
        to: "/president-page/1/manage-society-details",
      },
      {
        title: "Society Events",
        icon: <EventNoteOutlined />,
        to: "/president-page/1/manage-society-events",
      },
      {
        title: "Pending Members",
        icon: <PeopleOutline />,
        to: "/president-page/1/pending-members",
      },
      {
        title: "All Members",
        icon: <GroupOutlined />,
        to: "/president-page/1/view-society-members",
      },
    ],
    []
  );

  return (
    <CustomDrawer variant="permanent" open={drawer}>
      <CustomDrawerHeader>
        <IconButton onClick={toggleDrawer}>
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
          <Box sx={{ textAlign: "center" }}>
            <img
              src={"http://localhost:8000/api" + user?.icon}
              alt={`${user?.username} icon`}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                margin: "0 auto",
              }}
            />
            <Typography variant="h6" fontWeight="bold" sx={{ mt: "10px" }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              President Dashboard
            </Typography>
          </Box>
        ) : (
          <img
            src={"http://localhost:8000/api" + user?.icon}
            alt={`${user?.username} icon`}
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

      {/* Manage My Societies Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/president-page/1"
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

        {/* Society Management Items */}
        {manageMySocietiesItems.map((item) => (
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
            to="/student/join-society"
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
            onClick={() => logoutMutation.mutate()}
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

export default memo(PresidentDrawer);
