import React, { ReactNode, useState, useCallback, FC } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import EventList from "./AdminEventList";
import EventListRejected from "./RejectedEventsList";
import PendingEventRequest from "./PendingEventRequest";

// Types and Interfaces
interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

interface TabConfig {
  label: string;
  component: ReactNode;
}

interface TabAccessibilityProps {
  id: string;
  'aria-controls': string;
}

interface TabContainerProps {
  activeTab: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: TabConfig[];
}

interface TabPanelsProps {
  activeTab: number;
  tabs: TabConfig[];
}

interface PageHeaderProps {
  colors: any;
}

// Constants
const ACTIVE_TAB_KEY = "activeEventTab";

const TABS: TabConfig[] = [
  { label: "Approved events", component: <EventList /> },
  { label: "Pending events", component: <PendingEventRequest /> },
  { label: "Rejected events", component: <EventListRejected /> },
];

// Helper functions
const getTabAccessibilityProps = (index: number): TabAccessibilityProps => {
  return {
    id: `event-tab-${index}`,
    'aria-controls': `event-tabpanel-${index}`,
  };
};

const getInitialTabState = (): number => {
  try {
    const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
    return savedTab ? parseInt(savedTab, 10) : 0;
  } catch (error) {
    console.error("Error parsing saved tab value:", error);
    return 0;
  }
};

const saveTabState = (newValue: number): void => {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, newValue.toString());
  } catch (error) {
    console.error("Error saving tab value:", error);
  }
};

// Component: CustomTabPanel
const CustomTabPanel: FC<TabPanelProps> = ({ children, value, index }) => {
  if (value !== index) return null;
  
  return (
    <Box
      role="tabpanel"
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
    >
      {children}
    </Box>
  );
};

// Component: PageHeader
const PageHeader: FC<PageHeaderProps> = ({ colors }) => {
  return (
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
  );
};

// Component: TabContainer
const TabContainer: FC<TabContainerProps> = ({ activeTab, handleTabChange, tabs }) => {
  return (
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
        {tabs.map((tab, index) => (
          <Tab
            key={`tab-${index}`}
            label={tab.label}
            {...getTabAccessibilityProps(index)}
          />
        ))}
      </Tabs>
    </Box>
  );
};

// Component: TabPanels
const TabPanels: FC<TabPanelsProps> = ({ activeTab, tabs }) => {
  return (
    <>
      {tabs.map((tab, index) => (
        <CustomTabPanel
          key={`panel-${index}`}
          value={activeTab}
          index={index}
        >
          {tab.component}
        </CustomTabPanel>
      ))}
    </>
  );
};

// Main component
const ManageEvents: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  // State
  const [activeTab, setActiveTab] = useState<number>(getInitialTabState);
  
  // Event handlers
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    saveTabState(newValue);
  }, []);
  
  // Container style
  const containerStyle = {
    height: "calc(100vh - 64px)",
  };
  
  return (
    <Box sx={containerStyle}>
      <PageHeader colors={colors} />
      
      <TabContainer 
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        tabs={TABS}
      />
      
      <TabPanels 
        activeTab={activeTab}
        tabs={TABS}
      />
    </Box>
  );
};

export default ManageEvents;