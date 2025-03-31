import React, { useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import AdminReportList from "./AdminReportList";
import ReportRepliedList from "./ReportRepliedList";
import ReportRepliesList from "./ReportRepliesList";
import {
  TabPanelProps,
  TabConfig,
  StorageOperations,
  ReportTabsProps,
  TabPanelContainerProps,
  PageTitleProps
} from "../../types/admin/ManageReports";


const STORAGE_KEY = "reportsActiveTab";


const createTabConfigs = (): TabConfig[] => [
  { label: "New reports", component: <AdminReportList />, ariaLabel: "New reports tab" },
  { label: "New replies", component: <ReportRepliesList />, ariaLabel: "New replies tab" },
  { label: "Replied", component: <ReportRepliedList />, ariaLabel: "Replied reports tab" },
];

const createStorageOperations = (): StorageOperations => {
  const getActiveTab = (): number => {
    try {
      const savedTab = localStorage.getItem(STORAGE_KEY);
      return savedTab !== null ? parseInt(savedTab, 10) : 0;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return 0;
    }
  };

  const setActiveTab = (value: number): void => {
    try {
      localStorage.setItem(STORAGE_KEY, value.toString());
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return {
    getActiveTab,
    setActiveTab,
  };
};


const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  if (value !== index) {
    return null;
  }
  
  return (
    <Box
      role="tabpanel"
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
    >
      {children}
    </Box>
  );
};

const ReportTabs: React.FC<ReportTabsProps> = ({ tabs, activeTabIndex, handleTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
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
  );
};

const TabPanelContainer: React.FC<TabPanelContainerProps> = ({ tabs, activeTabIndex }) => {
  return (
    <>
      {tabs.map((tab, index) => (
        <CustomTabPanel
          key={`panel-${index}`}
          value={activeTabIndex}
          index={index}
        >
          {tab.component}
        </CustomTabPanel>
      ))}
    </>
  );
};

const PageTitle: React.FC<PageTitleProps> = ({ colors }) => {
  return (
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
  );
};


const ManageReports: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const tabs = createTabConfigs();
  const storage = createStorageOperations();
  
  const [activeTabIndex, setActiveTabIndex] = useState<number>(storage.getActiveTab);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTabIndex(newValue);
    storage.setActiveTab(newValue);
  }, [storage]);

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <PageTitle colors={colors} />
      <ReportTabs 
        tabs={tabs} 
        activeTabIndex={activeTabIndex} 
        handleTabChange={handleTabChange} 
      />
      <TabPanelContainer tabs={tabs} activeTabIndex={activeTabIndex} />
    </Box>
  );
};

export default ManageReports;