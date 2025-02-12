import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import AdminSidebar from "./layout/AdminSidebar";
import Topbar from "./layout/Topbar";
import { SidebarProvider, useSidebar } from "./layout/SidebarContext";

interface LayoutProps {
  role: "admin" | "student" | "global";
}

const Layout: React.FC<LayoutProps> = ({ role }) => {
  const TOPBAR_HEIGHT = 64;
  const { sidebarWidth } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");

  const renderSidebar = () => {
    switch (role) {
      case "admin":
        return <AdminSidebar />;
      case "student":
        return <div>Student Sidebar</div>; //replace once file names are changed
      case "global":
        return <div>Global Sidebar</div>; //replace once file names are changed
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      {renderSidebar()}
      <Topbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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
    </SidebarProvider>
  );
};

export default Layout;
