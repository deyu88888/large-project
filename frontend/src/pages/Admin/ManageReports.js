import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Box, Tabs, Tab, useTheme, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";
import AdminReportList from "./AdminReportList";
import ReportRepliedList from "./ReportRepliedList";
import ReportRepliesList from "./ReportRepliesList";
const STORAGE_KEY = "reportsActiveTab";
const createTabConfigs = () => [
    { label: "New reports", component: _jsx(AdminReportList, {}), ariaLabel: "New reports tab" },
    { label: "New replies", component: _jsx(ReportRepliesList, {}), ariaLabel: "New replies tab" },
    { label: "Replied", component: _jsx(ReportRepliedList, {}), ariaLabel: "Replied reports tab" },
];
const createStorageOperations = () => {
    const getActiveTab = () => {
        try {
            const savedTab = localStorage.getItem(STORAGE_KEY);
            return savedTab !== null ? parseInt(savedTab, 10) : 0;
        }
        catch (error) {
            console.error("Error reading from localStorage:", error);
            return 0;
        }
    };
    const setActiveTab = (value) => {
        try {
            localStorage.setItem(STORAGE_KEY, value.toString());
        }
        catch (error) {
            console.error("Error writing to localStorage:", error);
        }
    };
    return {
        getActiveTab,
        setActiveTab,
    };
};
const CustomTabPanel = ({ children, value, index }) => {
    if (value !== index) {
        return null;
    }
    return (_jsx(Box, { role: "tabpanel", id: `reports-tabpanel-${index}`, "aria-labelledby": `reports-tab-${index}`, children: children }));
};
const ReportTabs = ({ tabs, activeTabIndex, handleTabChange }) => {
    return (_jsx(Box, { sx: { borderBottom: 1, borderColor: "divider" }, children: _jsx(Tabs, { value: activeTabIndex, onChange: handleTabChange, "aria-label": "Report management tabs", textColor: "secondary", indicatorColor: "secondary", children: tabs.map((tab, index) => (_jsx(Tab, { label: tab.label, id: `reports-tab-${index}`, "aria-controls": `reports-tabpanel-${index}`, "aria-label": tab.ariaLabel }, `tab-${index}`))) }) }));
};
const TabPanelContainer = ({ tabs, activeTabIndex }) => {
    return (_jsx(_Fragment, { children: tabs.map((tab, index) => (_jsx(CustomTabPanel, { value: activeTabIndex, index: index, children: tab.component }, `panel-${index}`))) }));
};
const PageTitle = ({ colors }) => {
    return (_jsx(Typography, { variant: "h1", sx: {
            color: colors.grey[100],
            fontSize: "1.75rem",
            fontWeight: 800,
            mb: 2,
        }, children: "Manage Reports" }));
};
const ManageReports = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const tabs = createTabConfigs();
    const storage = createStorageOperations();
    const [activeTabIndex, setActiveTabIndex] = useState(storage.getActiveTab);
    const handleTabChange = useCallback((_, newValue) => {
        setActiveTabIndex(newValue);
        storage.setActiveTab(newValue);
    }, [storage]);
    return (_jsxs(Box, { sx: {
            height: "calc(100vh - 64px)",
            backgroundColor: theme.palette.background.default,
        }, children: [_jsx(PageTitle, { colors: colors }), _jsx(ReportTabs, { tabs: tabs, activeTabIndex: activeTabIndex, handleTabChange: handleTabChange }), _jsx(TabPanelContainer, { tabs: tabs, activeTabIndex: activeTabIndex })] }));
};
export default ManageReports;
