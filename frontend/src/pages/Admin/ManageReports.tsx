// TODO: make sure this page workds once seed is ready

import React, { ReactNode, useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import AdminReportList from "./AdminReportList";
import ReportRepliedList from "./ReportRepliedList";
import ReportRepliesList from "./ReportRepliesList";

interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

/**
 * Custom TabPanel component to manage tab content visibility
 */
const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return value === index ? (
    <Box 
      role="tabpanel"
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
    >
      {children}
    </Box>
  ) : null;
};

/**
 * Tab configuration containing label and component for each tab
 */
interface TabConfig {
  label: string;
  component: ReactNode;
  ariaLabel?: string;
}

const STORAGE_KEY = "reportsActiveTab";

const tabs: TabConfig[] = [
  { label: "New reports", component: <AdminReportList />, ariaLabel: "New reports tab" },
  { label: "New replies", component: <ReportRepliesList />, ariaLabel: "New replies tab" },
  { label: "Replied", component: <ReportRepliedList />, ariaLabel: "Replied reports tab" },
];

/**
 * ManageReports component for handling report administration
 */
const ManageReports: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Initialize active tab from local storage or default to first tab
  const [activeTabIndex, setActiveTabIndex] = useState<number>(() => {
    try {
      const savedTab = localStorage.getItem(STORAGE_KEY);
      return savedTab !== null ? parseInt(savedTab, 10) : 0;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return 0;
    }
  });

  // Handle tab change with memoized callback
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTabIndex(newValue);
    try {
      localStorage.setItem(STORAGE_KEY, newValue.toString());
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, []);

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem", 
          fontWeight: 800, 
          mb: 2,
        }}
      >
        Manage Reports
      </Typography>
      
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          value={activeTabIndex}
          onChange={handleTabChange}
          aria-label="Report management tabs"
          textColor="secondary"
          indicatorColor="secondary"
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={`tab-${index}`} 
              label={tab.label} 
              id={`reports-tab-${index}`}
              aria-controls={`reports-tabpanel-${index}`}
              aria-label={tab.ariaLabel}
            />
          ))}
        </Tabs>
      </Box>

      {tabs.map((tab, index) => (
        <CustomTabPanel 
          key={`panel-${index}`} 
          value={activeTabIndex} 
          index={index}
        >
          {tab.component}
        </CustomTabPanel>
      ))}
    </Box>
  );
};

export default ManageReports;