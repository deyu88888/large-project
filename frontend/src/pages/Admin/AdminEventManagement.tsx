import React, { ReactNode, useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import EventList from "./AdminEventList";
import EventListRejected from "./RejectedEventsList";
import PendingEventRequest from "./PendingEventRequest";

/**
 * Props for TabPanel component
 */
interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

/**
 * CustomTabPanel component to conditionally render tab content
 */
const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return value === index ? (
    <Box 
      role="tabpanel"
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
    >
      {children}
    </Box>
  ) : null;
};

/**
 * Props for tab accessibility
 */
const a11yProps = (index: number) => {
  return {
    id: `event-tab-${index}`,
    'aria-controls': `event-tabpanel-${index}`,
  };
};

/**
 * Tab configuration for event management
 */
const TABS = [
  { label: "Approved events", component: <EventList /> },
  { label: "Pending events", component: <PendingEventRequest /> },
  { label: "Rejected events", component: <EventListRejected /> },
];

/**
 * LocalStorage key for active tab
 */
const ACTIVE_TAB_KEY = "activeEventTab";

/**
 * ManageEvents component provides a tabbed interface for event management
 */
const ManageEvents: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  /**
   * Initialize tab state from localStorage
   */
  const [activeTab, setActiveTab] = useState<number>(() => {
    try {
      const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
      return savedTab ? parseInt(savedTab, 10) : 0;
    } catch (error) {
      console.error("Error parsing saved tab value:", error);
      return 0;
    }
  });

  /**
   * Handle tab change and persist selection
   */
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, newValue.toString());
    } catch (error) {
      console.error("Error saving tab value:", error);
    }
  }, []);

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        backgroundColor: colors.primary[400],
        padding: 2,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem", 
          fontWeight: 800,
          marginBottom: 2
        }}
      >
        Manage Events
      </Typography>
      
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Event management tabs"
          textColor="secondary"
          indicatorColor="secondary"
        >
          {TABS.map((tab, index) => (
            <Tab 
              key={`tab-${index}`} 
              label={tab.label} 
              {...a11yProps(index)} 
            />
          ))}
        </Tabs>
      </Box>

      {TABS.map((tab, index) => (
        <CustomTabPanel 
          key={`panel-${index}`} 
          value={activeTab} 
          index={index}
        >
          {tab.component}
        </CustomTabPanel>
      ))}
    </Box>
  );
};

export default ManageEvents;