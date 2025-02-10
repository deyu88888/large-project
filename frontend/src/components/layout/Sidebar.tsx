import React, { useState, useEffect } from "react";
import { Sidebar as ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../styles/theme";
import { useSidebar } from "./SidebarContext";

// Importing a bunch of icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

interface ItemProps {
  title: string;
  to: string;
  icon: React.ReactNode;
  selected: string;
  setSelected: (title: string) => void;
}

const Item: React.FC<ItemProps> = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);

  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colours.grey[100],
      }}
      onClick={() => setSelected(title)}
      icon={icon}
      component={<Link to={to} />}
    >
      <Typography>{title}</Typography>
    </MenuItem>
  );
};

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const storedState = localStorage.getItem('sidebarCollapsed');
    return storedState ? JSON.parse(storedState) : true;
  });
  
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);
  const [selected, setSelected] = useState("Dashboard");

 
  const expandedWidth = 120;
  const collapsedWidth = 0;

  const { setSidebarWidth } = useSidebar();

  useEffect(() => {
    setSidebarWidth(isCollapsed ? collapsedWidth : expandedWidth);
  }, [isCollapsed, setSidebarWidth, collapsedWidth, expandedWidth]);

  return (
    <Box
      sx={{
        "& .ps-sidebar-root": {
          background: `${colours.primary[400]} !important`,
          border: "none",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          width: isCollapsed ? `${collapsedWidth}px` : `${expandedWidth}px`,
          overflow: "hidden",
        },
        "& .ps-sidebar-container": {
          background: `${colours.primary[400]} !important`,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: colours.primary[400],
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colours.blueAccent[600],
            borderRadius: "6px",
            border: `2px solid ${colours.primary[400]}`,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: colours.blueAccent[500],
          },
        },
        "& .ps-menu-button": {
          backgroundColour: "transparent !important",
          colour: colours.grey[100],
        },
        "& .ps-menu-button:hover": {
          colour: `${colours.blueAccent[500]} !important`,
          backgroundColour: `${colours.primary[500]} !important`,
        },
        "& .ps-menu-button.ps-active": {
          colour: `${colours.blueAccent[500]} !important`,
        },
        "& .ps-menu-root": {
          padding: "5px 0",
        },
      }}
    >
      <ProSidebar key={`sidebar-${isCollapsed}`} collapsed={isCollapsed}>
        <Menu>
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colours.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box display="flex" justifyContent="space-between" alignItems="center" ml="15px">
                <Typography variant="h3" color={colours.grey[100]}>
                  Student
                </Typography>
                <IconButton sx={{ color: colours.grey[100] }}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={`../../assets/user.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography variant="h2" colour={colours.grey[100]} fontWeight="bold" sx={{ m: "10px 0 0 0" }}>
                  Ed Roh
                </Typography>
                <Typography variant="h5" colour={colours.greenAccent[500]}>
                  VP Fancy Admin
                </Typography>
              </Box>
            </Box>
          )}

          {/* Pages */}
          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Dashboard"
              to="/student-dashboard"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Typography variant="h6" colour={colours.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
              Pages
            </Typography>
            <Item
              title="Join a society"
              to="/join-society"
              icon={<PersonAddAltIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="My societies"
              to="/my-societies"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Events"
              to="/view-events"
              icon={<EventOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Notifications"
              to="/view-notifications"
              icon={<NotificationsNoneOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Calendar"
              to="/calendar"
              icon={<CalendarTodayOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Start a society"
              to="/start-society"
              icon={<GroupAddOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
