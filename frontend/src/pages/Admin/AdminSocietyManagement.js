import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import SocietyList from "./SocietyList";
import SocietyListRejected from "./RejectedSocietiesList";
import PendingSocietyRequest from "./SocietyCreationRequests";
import PendingSocietyDetailRequests from "./PendingSocietyDetailRequest";
const ACTIVE_TAB_KEY = "activeTab";
const TABS = [
    { label: "Current societies", component: _jsx(SocietyList, {}) },
    { label: "Pending societies", component: _jsx(PendingSocietyRequest, {}) },
    { label: "Rejected societies", component: _jsx(SocietyListRejected, {}) },
    { label: "Society detail requests", component: _jsx(PendingSocietyDetailRequests, {}) },
];
const getTabAccessibilityProps = (index) => {
    return {
        id: `society-tab-${index}`,
        'aria-controls': `society-tabpanel-${index}`,
    };
};
const getInitialTabState = () => {
    try {
        const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
        return savedTab ? parseInt(savedTab, 10) : 0;
    }
    catch (error) {
        console.error("Error parsing saved tab value:", error);
        return 0;
    }
};
const saveTabToStorage = (tabIndex) => {
    try {
        localStorage.setItem(ACTIVE_TAB_KEY, tabIndex.toString());
    }
    catch (error) {
        console.error("Error saving tab preference:", error);
    }
};
const CustomTabPanel = ({ children, value, index }) => {
    if (value !== index)
        return null;
    return (_jsx(Box, { role: "tabpanel", id: `society-tabpanel-${index}`, "aria-labelledby": `society-tab-${index}`, children: children }));
};
const Header = ({ colors }) => {
    return (_jsx(Typography, { variant: "h1", sx: {
            color: colors.grey[100],
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: 2
        }, children: "Manage Societies" }));
};
const TabsContainer = ({ activeTab, onTabChange, tabs }) => {
    return (_jsx(Box, { sx: {
            borderBottom: 1,
            borderColor: "divider",
        }, children: _jsx(Tabs, { value: activeTab, onChange: onTabChange, "aria-label": "Society management tabs", textColor: "secondary", indicatorColor: "secondary", children: tabs.map((tab, index) => (_jsx(Tab, { label: tab.label, ...getTabAccessibilityProps(index) }, `tab-${index}`))) }) }));
};
const TabPanels = ({ activeTab, tabs }) => {
    return (_jsx(_Fragment, { children: tabs.map((tab, index) => (_jsx(CustomTabPanel, { value: activeTab, index: index, children: tab.component }, `panel-${index}`))) }));
};
const ManageSocieties = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [activeTab, setActiveTab] = useState(getInitialTabState);
    const saveTabPreference = useCallback((tabIndex) => {
        saveTabToStorage(tabIndex);
    }, []);
    const handleTabChange = useCallback((event, newValue) => {
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
    return (_jsxs(Box, { sx: containerStyle, children: [_jsx(Header, { colors: colors }), _jsx(TabsContainer, { activeTab: activeTab, onTabChange: handleTabChange, tabs: TABS }), _jsx(TabPanels, { activeTab: activeTab, tabs: TABS })] }));
};
export default ManageSocieties;
