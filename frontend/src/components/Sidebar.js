import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiX, BiMoon, BiSun, BiSearch, BiChevronDown } from "react-icons/bi";
import { Link } from 'react-router-dom'; // Import Link
const Sidebar = ({ onClose, navigationItems, scrollToSection, darkMode = false, onToggleDarkMode, sidebarWidth, userRole, onToggle }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isHovering, setIsHovering] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const handleSubmenuToggle = (label) => {
        setOpenSubmenu((prev) => (prev === label ? null : label));
    };
    // Filter items by search AND user role.  Include the new items ONLY when expanded.
    const filteredItems = navigationItems.filter((item) => {
        if (sidebarWidth === 'collapsed')
            return true; // Always show icons when collapsed
        if (userRole && item.roles && !item.roles.includes(userRole)) {
            return false; // Hide if user doesn't have the required role
        }
        return item.label.toLowerCase().includes(searchQuery.toLowerCase());
    });
    // Add Register and Login as navigation items, ONLY when expanded
    const allItems = sidebarWidth === 'expanded'
        ? [
            ...filteredItems,
            { label: "Register", icon: _jsx("span", { className: "text-xl" }), ref: null, link: "/register" },
            { label: "Login", icon: _jsx("span", { className: "text-xl" }), ref: null, link: "/login" },
        ]
        : filteredItems;
    const containerStyle = {
        transformStyle: "preserve-3d",
        perspective: "1000px",
        transform: isHovering ? "rotateY(-1deg)" : "none",
        transition: "transform 0.4s ease-in-out",
    };
    return (_jsx("div", { className: "relative z-[200]", children: _jsxs(motion.div, { className: `
        fixed top-0 left-0 h-full
        shadow-2xl z-50 overflow-y-auto
        transition-all duration-300 ease-in-out
        flex flex-col
        ${sidebarWidth === 'collapsed' ? 'w-20' : 'w-72'}
        ${darkMode
                ? 'dark'
                : ''}
      `, style: containerStyle, role: "dialog", "aria-modal": "true", onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false), children: [sidebarWidth === 'expanded' && (_jsx(motion.button, { whileTap: { scale: 0.9 }, className: "absolute top-4 right-4 text-gray-600 dark:text-gray-300\n              hover:text-gray-800 dark:hover:text-white focus:outline-none", onClick: onClose, "aria-label": "Close Sidebar", children: _jsx(BiX, { className: "h-6 w-6" }) })), sidebarWidth === 'expanded' && (_jsx("div", { className: "p-4", children: _jsx("h2", { className: "text-2xl font-bold text-purple-700 dark:text-purple-300", children: "Universal Student Society" }) })), sidebarWidth === 'expanded' && (_jsx("div", { className: "px-4", children: _jsxs("div", { className: "relative text-gray-600 dark:text-gray-200", children: [_jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-2", children: _jsx(BiSearch, {}) }), _jsx("input", { type: "text", placeholder: "Search...", onChange: (e) => setSearchQuery(e.target.value), className: "block w-full bg-white/80 dark:bg-gray-700\n                    rounded-full pl-8 pr-4 py-2 focus:outline-none\n                    focus:ring-2 focus:ring-purple-500 transition" })] }) })), _jsx(motion.nav, { className: "flex-1 mt-4 px-2 flex flex-col", role: "navigation", "aria-label": "Sidebar Navigation", children: _jsx("ul", { className: "space-y-1", children: allItems.map((item) => {
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isExpanded = openSubmenu === item.label;
                            return (_jsxs(Fragment, { children: [_jsx(motion.li, { className: "relative group", children: item.link ? (_jsxs(Link, { to: item.link, className: "w-full text-left flex items-center gap-2 p-3 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition transform group-hover:-translate-y-[1px]", children: [item.icon, sidebarWidth === 'expanded' && (_jsx("span", { className: "font-medium flex-1", children: item.label }))] })) : (_jsxs(motion.button, { onClick: () => {
                                                if (hasSubItems) {
                                                    handleSubmenuToggle(item.label);
                                                }
                                                else {
                                                    scrollToSection(item.ref);
                                                }
                                            }, className: "w-full text-left flex items-center gap-2 p-3 rounded-md text-gray-700 dark:text-gray-200 hover:bg-purple-200 dark:hover:bg-purple-600 transition transform group-hover:-translate-y-[1px] relative", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx(motion.span, { whileHover: { scale: 1.1, rotate: 3 }, transition: { type: "spring", stiffness: 300 }, children: item.icon }), sidebarWidth === 'expanded' && (_jsx("span", { className: "font-medium flex-1", children: item.label })), sidebarWidth === 'expanded' && item.unreadCount && (_jsx("span", { className: "bg-red-500 text-white rounded-full px-2 py-1 text-xs", children: item.unreadCount })), hasSubItems && sidebarWidth === 'expanded' && (_jsx(motion.span, { animate: { rotate: isExpanded ? 180 : 0 }, transition: { duration: 0.2 }, children: _jsx(BiChevronDown, {}) }))] })) }), hasSubItems && sidebarWidth === 'expanded' && (_jsx(AnimatePresence, { children: isExpanded && (_jsx(motion.ul, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.3 }, className: "ml-8 pl-2 border-l border-purple-300 dark:border-purple-700 overflow-hidden", children: item.subItems.map((sub) => (_jsx("li", { className: "mt-1", children: _jsxs(motion.button, { whileTap: { scale: 0.95 }, onClick: () => {
                                                        if (sub.ref) {
                                                            scrollToSection(sub.ref);
                                                        }
                                                        onClose();
                                                    }, className: "w-full text-left flex items-center gap-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-purple-200 dark:hover:bg-purple-600 transition", children: [sub.icon && _jsx("span", { children: sub.icon }), sidebarWidth === 'expanded' && _jsx("span", { className: "flex-1", children: sub.label })] }) }, sub.label))) })) }))] }, item.label));
                        }) }) }), sidebarWidth === 'expanded' && onToggleDarkMode && (_jsx("div", { className: "p-4 border-t border-gray-300 dark:border-gray-700", children: _jsxs(motion.button, { whileTap: { scale: 0.95 }, onClick: onToggleDarkMode, className: "w-full flex items-center gap-2 justify-center\n                 px-2 py-1 bg-purple-500 text-white\n                 rounded-full shadow-sm hover:bg-purple-600 transition", children: [darkMode ? _jsx(BiSun, {}) : _jsx(BiMoon, {}), _jsx("span", { className: "text-sm", children: darkMode ? "Light Mode" : "Dark Mode" })] }) }))] }) }));
};
export default Sidebar;
