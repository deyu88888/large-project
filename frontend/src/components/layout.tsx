import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import AdminSidebar from "./layout/AdminSidebar";
// import StudentSidebar from "./layout/StudentSidebar";
// import GlobalSidebar from "./layout/GlobalSidebar";
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
        overflowX: "hidden",
      }}
    >
      <Outlet />
    </Box>
  );
};

interface LayoutProps {
  role: "admin" | "student" | "global";
}

const Layout: React.FC<LayoutProps> = ({ role }) => {
  const renderSidebar = () => {
    switch (role) {
      case "admin":
        return <AdminSidebar />;
      case "student":
      // return <StudentSidebar />;
      default:
      // return <GlobalSidebar />;
    }
  };

  return (
    <SidebarProvider>
      {renderSidebar()}
      {/* <Topbar /> */}
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
