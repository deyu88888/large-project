import React, { ReactNode, useEffect, useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import SocietyList from "./SocietyList";
import SocietyListRejected from "./RejectedSocietiesList";
import PendingSocietyRequest from "./SocietyCreationRequests";
import PendingSocietyDetailRequests from "./PendingSocietyDetailRequests.tsx";

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
const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  value === index ? (
    <Box 
      role="tabpanel"
      id={`society-tabpanel-${index}`}
      aria-labelledby={`society-tab-${index}`}
    >
      {children}
    </Box>
  ) : null
);

/**
 * Props for tab accessibility
 */
const a11yProps = (index: number) => {
  return {
    id: `society-tab-${index}`,
    'aria-controls': `society-tabpanel-${index}`,
  };
};

/**
 * LocalStorage key for active tab
 */
const ACTIVE_TAB_KEY = "activeTab";

/**
 * Tab configuration for society management
 */
const TABS = [
  { label: "Current societies", component: <SocietyList /> },
  { label: "Pending societies", component: <PendingSocietyRequest /> },
  { label: "Rejected societies", component: <SocietyListRejected /> },
  { label: "Society detail requests", component: <PendingSocietyDetailRequests /> },
];

/**
 * ManageSocieties component provides a tabbed interface for society management
 */
const ManageSocieties: React.FC = () => {
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
   * Save tab preference to localStorage
   */
  const saveTabPreference = useCallback((tabIndex: number) => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, tabIndex.toString());
    } catch (error) {
      console.error("Error saving tab preference:", error);
    }
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    saveTabPreference(newValue);
  }, [saveTabPreference]);

  /**
   * Save tab preference on unmount
   */
  useEffect(() => {
    return () => {
      saveTabPreference(activeTab);
    };
  }, [activeTab, saveTabPreference]);

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
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
        Manage Societies
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
          aria-label="Society management tabs"
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

export default ManageSocieties;