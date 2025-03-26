import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState, useRef, useCallback } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties";
import Sidebar from "../components/Sidebar";
import { HiMenu } from "react-icons/hi";
import { motion } from 'framer-motion';
import { getAllEvents, apiClient } from "../api";
import { useWebSocketChannel } from "../hooks/useWebSocketChannel";
import { useWebSocketManager, CONNECTION_STATES } from "../hooks/useWebSocketManager";
// -- API Functions --
const fetchDashboardStats = async () => {
    try {
        const response = await apiClient.get("/api/dashboard/stats/");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return null;
    }
};
const fetchActivities = async () => {
    try {
        const response = await apiClient.get("/api/dashboard/activities/");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching activities:", error);
        return null;
    }
};
const fetchNotifications = async () => {
    try {
        const response = await apiClient.get("/api/dashboard/notifications");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        return null;
    }
};
// -- Reusable Components --
const SectionCard = ({ title, children }) => (_jsxs(motion.section, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, className: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6\n               border-l-8 border-transparent hover:border-gradient-to-r\n               hover:from-purple-500 hover:to-indigo-500\n               transition-all duration-300", "data-testid": `section-${title.toLowerCase().replace(/\s+/g, '-')}`, children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4", children: title }), _jsx("div", { className: "space-y-4", children: children })] }));
const StatCard = ({ title, value, color }) => (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3 }, className: `p-6 rounded-2xl text-white bg-gradient-to-br ${color}
                shadow-md transition transform hover:scale-105 hover:shadow-lg`, "data-testid": `stat-${title.toLowerCase().replace(/\s+/g, '-')}`, children: [_jsx("p", { className: "text-sm uppercase tracking-wider", children: title }), _jsx("p", { className: "text-4xl font-bold mt-2", children: value })] }));
// -- Tabs Components --
const Tabs = ({ activeTab, setActiveTab, children }) => {
    const tabLabels = React.Children.toArray(children)
        .filter((child) => React.isValidElement(child))
        .map((child) => child.props.label);
    return (_jsxs("div", { "data-testid": "tabs-container", children: [_jsx("div", { className: "flex border-b border-gray-200 dark:border-gray-700", children: tabLabels.map((label) => (_jsx("button", { className: `py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === label
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-300"}`, onClick: () => setActiveTab(label), "data-testid": `tab-${label.toLowerCase().replace(/\s+/g, '-')}`, children: label }, label))) }), _jsx("div", { className: "py-4", "data-testid": "tab-content", children: React.Children.toArray(children).find((child) => React.isValidElement(child) &&
                    child.props.label === activeTab) })] }));
};
const TabPanel = ({ children, label }) => (_jsx("div", { "data-testid": `panel-${label.toLowerCase().replace(/\s+/g, '-')}`, children: children }));
// Enhanced WebSocket connection status component with more detailed information
const WebSocketStatus = () => {
    const { status, connect } = useWebSocketManager();
    const [showDetails, setShowDetails] = useState(false);
    let statusText = "Real-time updates unavailable";
    let statusClass = "text-yellow-500";
    let dotClass = "bg-yellow-500";
    if (status === CONNECTION_STATES.CONNECTING) {
        statusText = "Connecting...";
        statusClass = "text-blue-500";
        dotClass = "bg-blue-500 animate-pulse";
    }
    else if (status === CONNECTION_STATES.AUTHENTICATED) {
        statusText = "Real-time updates enabled";
        statusClass = "text-green-500";
        dotClass = "bg-green-500";
    }
    else if (status === CONNECTION_STATES.CONNECTED) {
        statusText = "Connected (authenticating)";
        statusClass = "text-blue-500";
        dotClass = "bg-blue-500";
    }
    else if (status === CONNECTION_STATES.ERROR || status === CONNECTION_STATES.AUTH_FAILED) {
        statusText = status === CONNECTION_STATES.AUTH_FAILED ? "Authentication failed" : "Connection error";
        statusClass = "text-red-500";
        dotClass = "bg-red-500";
    }
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowDetails(!showDetails), className: `text-sm flex items-center ${statusClass} hover:underline focus:outline-none`, children: [_jsx("span", { className: `inline-block w-2 h-2 rounded-full mr-1 ${dotClass}` }), statusText] }), showDetails && (_jsxs("div", { className: "absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-md z-20 w-64", children: [_jsx("h4", { className: "font-bold mb-2", children: "WebSocket Status" }), _jsxs("p", { className: "text-sm mb-2", children: ["Current state: ", _jsx("span", { className: statusClass, children: status })] }), (status === CONNECTION_STATES.ERROR || status === CONNECTION_STATES.AUTH_FAILED || status === CONNECTION_STATES.DISCONNECTED) && (_jsx("button", { onClick: () => {
                            connect();
                            setShowDetails(false);
                        }, className: "text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition", children: "Reconnect" }))] }))] }));
};
// -- Main Dashboard --
const Dashboard = () => {
    // ---- States ----
    const [introduction] = useState({
        title: "Welcome to Student Societies Dashboard",
        content: [
            "This dashboard provides an overview of all student societies and their activities.",
            "Join a society, attend events, and make the most of your campus experience!"
        ]
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Recent Activities");
    const [sidebarWidth, setSidebarWidth] = useState('collapsed');
    const [darkMode, setDarkMode] = useState(() => {
        try {
            const stored = localStorage.getItem("darkMode");
            if (stored !== null)
                return JSON.parse(stored);
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        catch {
            return false;
        }
    });
    const [error, setError] = useState(null);
    // Get WebSocket manager to initialize connection
    const { status, connect } = useWebSocketManager();
    // -- WebSocket data using the new hooks --
    const { data: stats, loading: statsLoading, error: statsError, isConnected: statsConnected, refresh: refreshStats } = useWebSocketChannel('dashboard/stats', fetchDashboardStats);
    const { data: activities, loading: activitiesLoading, error: activitiesError, isConnected: activitiesConnected, refresh: refreshActivities } = useWebSocketChannel('dashboard/activities', fetchActivities);
    const { data: notifications, loading: notificationsLoading, error: notificationsError, isConnected: notificationsConnected, refresh: refreshNotifications } = useWebSocketChannel('dashboard/notifications', fetchNotifications);
    // -- Refs --
    const statsRef = useRef(null);
    const popularSocietiesRef = useRef(null);
    const upcomingEventsRef = useRef(null);
    const eventCalendarRef = useRef(null);
    const updatesRef = useRef(null);
    // -- Events state and fetching --
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState(null);
    // Track previous status to only refresh when transitioning to AUTHENTICATED
    const prevStatus = useRef(status);
    useEffect(() => {
        // On mount, if disconnected, connect once.
        if (status === CONNECTION_STATES.DISCONNECTED) {
            connect();
        }
        // On the first transition to AUTHENTICATED, refresh data.
        if (status === CONNECTION_STATES.AUTHENTICATED && prevStatus.current !== CONNECTION_STATES.AUTHENTICATED) {
            refreshStats();
            refreshActivities();
            refreshNotifications();
        }
        prevStatus.current = status;
        // Only run this effect when 'status' changes.
    }, [status]);
    useEffect(() => {
        let mounted = true;
        const fetchEvents = async () => {
            try {
                setEventsLoading(true);
                const rawEvents = await getAllEvents();
                if (!mounted)
                    return;
                if (rawEvents && rawEvents.length > 0) {
                    const processedEvents = processEvents(rawEvents);
                    setEvents(processedEvents);
                    setEventsError(null);
                }
                else {
                    setEvents([]);
                    setEventsError("No events available");
                }
            }
            catch (err) {
                console.error("Error fetching events:", err);
                if (mounted) {
                    setEventsError("Failed to load events");
                }
            }
            finally {
                if (mounted) {
                    setEventsLoading(false);
                }
            }
        };
        fetchEvents();
        return () => {
            mounted = false;
        };
    }, []);
    // -- Process raw events into calendar events --
    const processEvents = (rawEvents) => {
        return rawEvents
            .map(event => {
            try {
                const timeField = event.startTime || event.start_time || "";
                const dateStr = `${event.date}T${timeField}`;
                const startDate = new Date(dateStr);
                if (isNaN(startDate.getTime()))
                    return null;
                let endDate = new Date(startDate);
                if (event.duration && event.duration.includes(":")) {
                    const [hours, minutes, seconds = 0] = event.duration.split(":").map(Number);
                    endDate = new Date(startDate.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
                }
                else {
                    // Default duration if not provided (1 hour)
                    endDate = new Date(startDate.getTime() + 3600000);
                }
                return {
                    id: event.id,
                    title: event.title,
                    start: startDate,
                    end: endDate,
                };
            }
            catch (e) {
                console.warn("Invalid event:", event, e);
                return null;
            }
        })
            .filter((event) => event !== null)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    };
    // -- Handler Functions --
    const handleToggleSidebar = useCallback(() => {
        setSidebarWidth(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
    }, []);
    const handleCloseSidebar = useCallback(() => {
        setSidebarWidth('collapsed');
    }, []);
    const handleNavItemClick = useCallback((ref) => {
        if (ref === null) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        else if (ref && ref.current) {
            const headerHeight = document.querySelector('header')?.offsetHeight || 0;
            const elementPosition = ref.current.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementPosition - headerHeight,
                behavior: "smooth",
            });
        }
    }, []);
    // Manual refresh handler for all data
    const handleRefreshAll = useCallback(() => {
        refreshStats();
        refreshActivities();
        refreshNotifications();
        // Also refresh events
        setEventsLoading(true);
        getAllEvents()
            .then(rawEvents => {
            if (rawEvents && rawEvents.length > 0) {
                const processedEvents = processEvents(rawEvents);
                setEvents(processedEvents);
                setEventsError(null);
            }
            else {
                setEvents([]);
                setEventsError("No events available");
            }
        })
            .catch(err => {
            console.error("Error refreshing events:", err);
            setEventsError("Failed to refresh events");
        })
            .finally(() => {
            setEventsLoading(false);
        });
    }, [refreshStats, refreshActivities, refreshNotifications]);
    // -- Dark Mode --
    useEffect(() => {
        try {
            localStorage.setItem("darkMode", JSON.stringify(darkMode));
        }
        catch (e) {
            console.error("Failed to save darkMode:", e);
        }
        document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);
    // -- Combine all errors --
    useEffect(() => {
        // Collect all errors
        const allErrors = [statsError, activitiesError, notificationsError, eventsError]
            .filter(Boolean)
            .join("; ");
        if (allErrors) {
            setError(allErrors);
        }
        else {
            setError(null);
        }
    }, [statsError, activitiesError, notificationsError, eventsError]);
    // -- Navigation Items --
    const navigationItems = [
        { label: "Dashboard", icon: _jsx("span", { className: "text-xl", children: "\uD83C\uDFE0" }), ref: null, scrollToSection: () => handleNavItemClick(null) },
        { label: "Statistics", icon: _jsx("span", { className: "text-xl", children: "\uD83D\uDCCA" }), ref: statsRef, scrollToSection: () => handleNavItemClick(statsRef) },
        { label: "Popular Societies", icon: _jsx("span", { className: "text-xl", children: "\uD83C\uDFC6" }), ref: popularSocietiesRef, scrollToSection: () => handleNavItemClick(popularSocietiesRef) },
        { label: "Upcoming Events", icon: _jsx("span", { className: "text-xl", children: "\uD83D\uDCC5" }), ref: upcomingEventsRef, scrollToSection: () => handleNavItemClick(upcomingEventsRef) },
        { label: "Event Calendar", icon: _jsx("span", { className: "text-xl", children: "\uD83D\uDDD3\uFE0F" }), ref: eventCalendarRef, scrollToSection: () => handleNavItemClick(eventCalendarRef) },
        { label: "Updates", icon: _jsx("span", { className: "text-xl", children: "\uD83D\uDD14" }), ref: updatesRef, scrollToSection: () => handleNavItemClick(updatesRef) },
    ];
    // Overall loading state
    const isLoading = statsLoading || activitiesLoading || notificationsLoading || eventsLoading;
    if (isLoading)
        return _jsx(LoadingView, {});
    return (_jsxs("div", { className: `min-h-screen flex ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"} transition-colors duration-500 grid grid-cols-[auto_1fr]`, style: {
            gridTemplateColumns: sidebarWidth === 'collapsed' ? 'auto 1fr' : '288px 1fr',
        }, "data-testid": "dashboard-container", children: [_jsx(Sidebar, { isOpen: true, onClose: handleCloseSidebar, onToggle: handleToggleSidebar, navigationItems: navigationItems, scrollToSection: handleNavItemClick, darkMode: darkMode, onToggleDarkMode: () => setDarkMode(prev => !prev), sidebarWidth: sidebarWidth }), _jsxs("div", { className: "flex-grow pt-16", "data-testid": "main-content", children: [_jsx(motion.header, { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "bg-white dark:bg-gray-800 shadow-md fixed top-0 z-10 w-full", "data-testid": "dashboard-header", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-2 grid grid-cols-[auto_1fr_auto] gap-4 items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "text-gray-600 dark:text-gray-300 hover:text-gray-800\n                          dark:hover:text-white focus:outline-none", onClick: handleToggleSidebar, "aria-label": "Toggle Menu", "data-testid": "header-toggle-button", children: _jsx(motion.span, { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.2 }, children: _jsx(HiMenu, { className: "h-6 w-6" }) }) }), _jsx("span", { role: "img", "aria-label": "sparkles", className: "text-3xl", children: "\u2728" }), _jsx("h1", { className: "text-xl font-extrabold tracking-wide text-gray-800 dark:text-gray-100", children: "Student Society Dashboard" }), _jsx("button", { onClick: handleRefreshAll, className: "ml-2 p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", title: "Refresh all data", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) })] }), _jsx("div", { className: "flex justify-center", children: _jsx(WebSocketStatus, {}) }), sidebarWidth === 'collapsed' && (_jsxs("div", { className: "flex items-center justify-end gap-4", children: [_jsx("input", { type: "search", placeholder: "Search...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "px-4 py-2 rounded-full border border-gray-300\n                              dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100\n                              focus:outline-none focus:ring-2 focus:ring-purple-500", style: { caretColor: "black" }, "data-testid": "search-input" }), _jsx(Link, { to: "/register", className: "px-4 py-2 bg-purple-600 text-white\n                            rounded-full shadow hover:bg-purple-700 transition whitespace-nowrap", "data-testid": "register-link", children: "Register" }), _jsx(Link, { to: "/login", className: "px-4 py-2 bg-purple-600 text-white\n                            rounded-full shadow hover:bg-purple-700 transition whitespace-nowrap", "data-testid": "login-link", children: "Login" })] }))] }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 space-y-10", "data-testid": "content-container", children: [_jsx(SectionCard, { title: introduction.title, children: _jsx("div", { children: introduction.content.map((paragraph, idx) => (_jsx("p", { className: "text-gray-700 dark:text-gray-200 text-base leading-relaxed", children: paragraph }, idx))) }) }), _jsx("div", { ref: statsRef, className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", "data-testid": "statistics-section", children: stats ? (_jsxs(_Fragment, { children: [_jsx(StatCard, { title: "Total Societies", value: stats.totalSocieties, color: "from-purple-600 to-purple-400" }), _jsx(StatCard, { title: "Total Events", value: stats.totalEvents, color: "from-green-600 to-green-400" }), _jsx(StatCard, { title: "Pending Approvals", value: stats.pendingApprovals, color: "from-yellow-600 to-yellow-400" }), _jsx(StatCard, { title: "Active Members", value: stats.activeMembers, color: "from-blue-600 to-blue-400" })] })) : (_jsx("div", { className: "col-span-4 text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg", children: _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Statistics unavailable" }) })) }), _jsxs(motion.section, { ref: popularSocietiesRef, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, className: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6\n                       border-l-8 border-transparent hover:border-gradient-to-r\n                       hover:from-purple-500 hover:to-indigo-500\n                       transition-all duration-300", "data-testid": "popular-societies-section", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4", children: "Popular Societies" }), _jsx(PopularSocieties, {})] }), _jsx(SectionCard, { title: "Upcoming Events", children: _jsx("div", { ref: upcomingEventsRef, "data-testid": "upcoming-events-section", children: events.length > 0 ? (_jsx(UpcomingEvents, { events: events })) : (_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center", children: "No upcoming events available." })) }) }), _jsx(SectionCard, { title: "Event Calendar", children: _jsx("div", { ref: eventCalendarRef, "data-testid": "event-calendar-section", children: events.length > 0 ? (_jsx(EventCalendar, { events: events })) : (_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center", children: "No events available for calendar." })) }) }), _jsx(SectionCard, { title: "Updates", children: _jsx("div", { ref: updatesRef, "data-testid": "updates-section", children: _jsxs(Tabs, { activeTab: activeTab, setActiveTab: setActiveTab, children: [_jsx(TabPanel, { label: "Recent Activities", children: activities && activities.length > 0 ? (_jsx("ul", { className: "space-y-2 pl-4 list-disc", children: activities.map((activity, idx) => (_jsx("li", { className: "text-gray-700 dark:text-gray-200 text-base", "data-testid": `activity-item-${idx}`, children: activity.description }, idx))) })) : (_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-base", children: "No recent activities available." })) }), _jsx(TabPanel, { label: "Notifications", children: notifications && notifications.length > 0 ? (_jsx("ul", { className: "space-y-2 pl-4 list-disc", children: notifications.map((notification, idx) => (_jsx("li", { className: "text-gray-700 dark:text-gray-200 text-base", "data-testid": `notification-item-${idx}`, children: notification.message }, idx))) })) : (_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-base", children: "No notifications available." })) })] }) }) }), error && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3 }, className: "bg-red-100 dark:bg-red-900 border-l-8 border-red-600\n                       text-red-800 dark:text-red-200 p-6 rounded-2xl shadow-md", "data-testid": "error-message", children: [_jsx("strong", { children: "Error:" }), " ", error] }))] })] })] }));
};
export default Dashboard;
