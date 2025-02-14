import React, { useContext } from "react";
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
import MenuIcon from "@mui/icons-material/Menu";

import AdminDrawer from "./layout/AdminDrawer";
import StudentDrawer from "./layout/StudentDrawer";
import { CustomAppBar } from "./layout/drawer/CustomDrawer";

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
                {
                  marginRight: 5,
                },
                drawer && { display: "none" },
              ]}
            >
              <MenuIcon
                sx={{
                  color: theme.palette.text.primary,
                }}
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
              <IconButton
                onClick={() => {
                  if (location.pathname.startsWith("/admin")) {
                    navigate("/admin/profile");
                  } else if (location.pathname.startsWith("/student")) {
                    navigate("/student/profile");
                  } else {
                    navigate("/profile");
                  }
                }}
              >
                <PersonOutlinedIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </CustomAppBar>

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