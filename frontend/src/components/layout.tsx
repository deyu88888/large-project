import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";
import { SidebarProvider, useSidebar } from "./layout/SidebarContext";

const LayoutContent: React.FC = () => {
  const TOPBAR_HEIGHT = 64;
  const { sidebarWidth } = useSidebar();

  return (
    <Box
      component="main"
      sx={{
        marginLeft: `${sidebarWidth}px`,
        marginTop: `${TOPBAR_HEIGHT}px`,
        p: 2,
      }}
    >
      <Outlet />
    </Box>
  );
};

const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
