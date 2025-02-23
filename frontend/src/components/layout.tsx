import React, { useContext, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  InputBase,
  Toolbar,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { useSettingsStore } from "../stores/settings-store";
import { SearchContext } from "./layout/SearchContext";

// Import separate drawer components
import AdminDrawer from "./layout/AdminDrawer";
import StudentDrawer from "./layout/StudentDrawer";

interface LayoutProps {}

const Layout: React.FC<LayoutProps> = () => {
  const theme = useTheme();
  const { drawer, toggleDrawer, toggleThemeMode } = useSettingsStore();
  const { searchTerm, setSearchTerm } = useContext(SearchContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Choose the appropriate drawer based on the current route
  const DrawerComponent = location.pathname.startsWith("/admin")
    ? AdminDrawer
    : StudentDrawer;

  // Define drawer widths
  const drawerOpenWidth = 240;
  const drawerClosedWidth = 60;
  const currentDrawerWidth = drawer ? drawerOpenWidth : drawerClosedWidth;

  return (
    <Box sx={{ display: "flex" }}>
      {/* Topbar without the drawer toggle */}
      <Box
        component="header"
        sx={{
          position: "fixed",
          width: `calc(100% - ${currentDrawerWidth}px)`,
          ml: `${currentDrawerWidth}px`,
          zIndex: 1100,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: "transparent",
        }}
      >
        <Toolbar>
          {/* Removed extra toggle button from here */}
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
          <Box display="flex" marginLeft="auto">
            <IconButton onClick={() => toggleThemeMode()}>
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
            {/* Profile Icon navigates to the profile page */}
            <IconButton onClick={() => navigate("/logout/profile")}>
              <PersonOutlinedIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Box>

      {/* Drawer */}
      <DrawerComponent drawer={drawer} toggleDrawer={toggleDrawer} location={location} />

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: "64px" }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;