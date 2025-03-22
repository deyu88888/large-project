import { Link } from "react-router-dom";
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
import {
  ChevronLeft as ChevronLeftIcon,
  HomeOutlined as HomeOutlinedIcon,
  PeopleOutlined as PeopleOutlinedIcon,
  PersonAddAlt as PersonAddAltIcon,
  MoveToInbox as InboxIcon,
  Logout as LogoutIcon,
  SportsFootball as SportsFootballIcon,
  Groups as GroupsIcon,
  ManageHistory as ManageHistoryIcon,
  CalendarMonth as CalendarMonthIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { CustomDrawer, CustomDrawerHeader } from "./drawer/CustomDrawer";
import { useAuthContext } from "../auth/AuthContext";
import { memo, useMemo, useState } from "react";

interface AdminDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  location: { pathname: string };
}

const AdminDrawer: React.FC<AdminDrawerProps> = ({ drawer, toggleDrawer }) => {
  const { user } = useAuthStore();
  const { logoutMutation } = useAuthContext();

  const [selected, setSelected] = useState("Dashboard");

  const menuItems = useMemo(
    () => [
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
      { title: "Manage Events", icon: <EventIcon />, to: "/admin/event" },
      { title: "Calendar", icon: <CalendarMonthIcon />, to: "/admin/calendar" },
      { title: "Reports", icon: <InboxIcon />, to: "/admin/reports" },
    ],
    []
  );

  const additionalItems = useMemo(() => {
    const items = [
      { title: "My Team", icon: <GroupsIcon />, to: "/admin/my-team" },
      {
        title: "Activity Log",
        icon: <ManageHistoryIcon />,
        to: "/admin/activity-log",
      },
    ];
    if (user?.is_super_admin) {
      items.push({
        title: "Create Admin",
        icon: <PersonAddAltIcon />,
        to: "/admin/create-admin",
      });
    }
    return items;
  }, [user]);

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

export default memo(AdminDrawer);
