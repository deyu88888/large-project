import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import EventList from "./AdminEventList";
import EventListRejected from "./RejectedEventsList";
import PendingEventRequest from "./PendingEventRequest";
const ACTIVE_TAB_KEY = "activeEventTab";
const TABS = [
    { label: "Approved events", component: _jsx(EventList, {}) },
    { label: "Pending events", component: _jsx(PendingEventRequest, {}) },
    { label: "Rejected events", component: _jsx(EventListRejected, {}) },
];
const getTabAccessibilityProps = (index) => {
    return {
        id: `event-tab-${index}`,
        'aria-controls': `event-tabpanel-${index}`,
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
const saveTabState = (newValue) => {
    try {
        localStorage.setItem(ACTIVE_TAB_KEY, newValue.toString());
    }
    catch (error) {
        console.error("Error saving tab value:", error);
    }
};
const CustomTabPanel = ({ children, value, index }) => {
    if (value !== index)
        return null;
    return (_jsx(Box, { role: "tabpanel", id: `event-tabpanel-${index}`, "aria-labelledby": `event-tab-${index}`, children: children }));
};
const PageHeader = ({ colors }) => {
    return (_jsx(Typography, { variant: "h1", sx: {
            color: colors.grey[100],
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: 2
        }, children: "Manage Events" }));
};
const TabContainer = ({ activeTab, handleTabChange, tabs }) => {
    return (_jsx(Box, { sx: {
            borderBottom: 1,
            borderColor: "divider",
        }, children: _jsx(Tabs, { value: activeTab, onChange: handleTabChange, "aria-label": "Event management tabs", textColor: "secondary", indicatorColor: "secondary", children: tabs.map((tab, index) => (_jsx(Tab, { label: tab.label, ...getTabAccessibilityProps(index) }, `tab-${index}`))) }) }));
};
const TabPanels = ({ activeTab, tabs }) => {
    return (_jsx(_Fragment, { children: tabs.map((tab, index) => (_jsx(CustomTabPanel, { value: activeTab, index: index, children: tab.component }, `panel-${index}`))) }));
};
const ManageEvents = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [activeTab, setActiveTab] = useState(getInitialTabState);
    const handleTabChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
        saveTabState(newValue);
    }, []);
    const containerStyle = {
        height: "calc(100vh - 64px)",
    };
    return (_jsxs(Box, { sx: containerStyle, children: [_jsx(PageHeader, { colors: colors }), _jsx(TabContainer, { activeTab: activeTab, handleTabChange: handleTabChange, tabs: TABS }), _jsx(TabPanels, { activeTab: activeTab, tabs: TABS })] }));
};
export default ManageEvents;
