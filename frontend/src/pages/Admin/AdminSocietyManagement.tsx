import React, { ReactNode, useEffect, useState, useCallback, FC } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import SocietyList from "./SocietyList";
import SocietyListRejected from "./RejectedSocietiesList";
import PendingSocietyRequest from "./SocietyCreationRequests";
import PendingSocietyDetailRequests from "./PendingSocietyDetailRequests.tsx";


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

interface TabsContainerProps {
  activeTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: TabConfig[];
}

interface TabPanelsProps {
  activeTab: number;
  tabs: TabConfig[];
}

interface HeaderProps {
  colors: any;
}


const ACTIVE_TAB_KEY = "activeTab";

const TABS: TabConfig[] = [
  { label: "Current societies", component: <SocietyList /> },
  { label: "Pending societies", component: <PendingSocietyRequest /> },
  { label: "Rejected societies", component: <SocietyListRejected /> },
  { label: "Society detail requests", component: <PendingSocietyDetailRequests /> },
];


const getTabAccessibilityProps = (index: number): TabAccessibilityProps => {
  return {
    id: `society-tab-${index}`,
    'aria-controls': `society-tabpanel-${index}`,
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

const saveTabToStorage = (tabIndex: number): void => {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tabIndex.toString());
  } catch (error) {
    console.error("Error saving tab preference:", error);
  }
};


const CustomTabPanel: FC<TabPanelProps> = ({ children, value, index }) => {
  if (value !== index) return null;
  
  return (
    <Box
      role="tabpanel"
      id={`society-tabpanel-${index}`}
      aria-labelledby={`society-tab-${index}`}
    >
      {children}
    </Box>
  );
};


const Header: FC<HeaderProps> = ({ colors }) => {
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
      Manage Societies
    </Typography>
  );
};


const TabsContainer: FC<TabsContainerProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        aria-label="Society management tabs"
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


const ManageSocieties: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  
  const [activeTab, setActiveTab] = useState<number>(getInitialTabState);
  
  
  const saveTabPreference = useCallback((tabIndex: number) => {
    saveTabToStorage(tabIndex);
  }, []);
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    saveTabPreference(newValue);
  }, [saveTabPreference]);
  
  
  useEffect(() => {
    return () => {
      saveTabPreference(activeTab);
    };
  }, [activeTab, saveTabPreference]);
  
  
  const containerStyle = {
    height: "calc(100vh - 64px)",
  };
  
  return (
    <Box sx={containerStyle}>
      <Header colors={colors} />
      
      <TabsContainer 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={TABS}
      />
      
      <TabPanels 
        activeTab={activeTab}
        tabs={TABS}
      />
    </Box>
  );
};

export default ManageSocieties;