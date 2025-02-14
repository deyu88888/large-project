import React, { useState, CSSProperties, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiX, BiMoon, BiSun, BiSearch, BiChevronDown } from "react-icons/bi";

interface SubItem {
    label: string;
    icon?: React.ReactNode;
    ref?: React.RefObject<HTMLDivElement>;
    roles?: string[]; // Optional roles for visibility
}

interface NavigationItem {
    label: string;
    icon: React.ReactNode;
    ref: React.RefObject<HTMLDivElement> | null;
    subItems?: SubItem[];
    roles?: string[]; // Optional roles for visibility
    unreadCount?: number; // Optional unread count
}

interface SidebarProps {
    onClose: () => void; // Keep this for the close button in the expanded state
    navigationItems: NavigationItem[];
    scrollToSection: (ref: React.RefObject<HTMLDivElement> | null) => void; // Accepts null
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
    sidebarWidth: 'collapsed' | 'expanded';
    userRole?: string; // Add userRole prop
}

const Sidebar: React.FC<SidebarProps> = ({
    onClose,
    navigationItems,
    scrollToSection,
    darkMode = false,
    onToggleDarkMode,
    sidebarWidth,
    userRole, // Receive userRole
}) => {

    const [searchQuery, setSearchQuery] = useState("");
    const [isHovering, setIsHovering] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    const handleSubmenuToggle = (label: string) => {
        setOpenSubmenu((prev) => (prev === label ? null : label));
    };

    // Filter items by search AND user role
    const filteredItems = navigationItems.filter((item) => {
        if (sidebarWidth === 'collapsed') return true; // Always show icons when collapsed
        if (userRole && item.roles && !item.roles.includes(userRole)) {
            return false; // Hide if user doesn't have the required role
        }
        return item.label.toLowerCase().includes(searchQuery.toLowerCase());
    });


    const containerStyle: CSSProperties = {
        transformStyle: "preserve-3d",
        perspective: "1000px",
        transform: isHovering ? "rotateY(-1deg)" : "none",
        transition: "transform 0.4s ease-in-out",
    };

    return (
        <div className="relative z-[200]">
            {/* Sidebar Container */}
            <motion.div
                className={`
        fixed top-0 left-0 h-full
        shadow-2xl z-50 overflow-y-auto
        transition-all duration-300 ease-in-out
        flex flex-col
        ${sidebarWidth === 'collapsed' ? 'w-20' : 'w-72'}
        ${darkMode
                        ? 'dark'
                        : ''
                    }
      `}
                style={containerStyle}
                role="dialog"
                aria-modal="true"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Close Button (X) - Only show when expanded */}
                {sidebarWidth === 'expanded' && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-4 right-4 text-gray-600 dark:text-gray-300
              hover:text-gray-800 dark:hover:text-white focus:outline-none"
                        onClick={onClose}
                        aria-label="Close Sidebar"
                    >
                        <BiX className="h-6 w-6" />
                    </motion.button>
                )}

                {/* Title / Logo - Only show when expanded */}
                {sidebarWidth === 'expanded' && (
                    <div className="p-4">
                        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            Universal Student Society
                        </h2>
                    </div>
                )}


                {/* Search Bar - Only show when expanded */}
                {sidebarWidth === 'expanded' && (
                    <div className="px-4">
                        <div className="relative text-gray-600 dark:text-gray-200">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                                <BiSearch />
                            </span>
                            <input
                                type="text"
                                placeholder="Search..."
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full bg-white/80 dark:bg-gray-700
                    rounded-full pl-8 pr-4 py-2 focus:outline-none
                    focus:ring-2 focus:ring-purple-500 transition"
                            />
                        </div>
                    </div>
                )}


                {/* Navigation Items (with submenus) */}
                <motion.nav
                    className="flex-1 mt-4 px-2 flex flex-col"
                    role="navigation"
                    aria-label="Sidebar Navigation"
                >
                    <ul className="space-y-1">
                        {filteredItems.map((item) => {
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isExpanded = openSubmenu === item.label;

                            return (
                                <Fragment key={item.label}>
                                    <motion.li
                                        className="relative group"
                                    >
                                        {/* Top-level nav button */}
                                        <motion.button
                                            onClick={() => {
                                                if (hasSubItems) {
                                                    handleSubmenuToggle(item.label);
                                                } else {
                                                    // Only call scrollToSection, NEVER onClose here
                                                    scrollToSection(item.ref);
                                                }
                                            }}
                                            className="w-full text-left flex items-center gap-2 p-3
                         rounded-md text-gray-700 dark:text-gray-200
                         hover:bg-purple-200 dark:hover:bg-purple-600
                         transition transform group-hover:-translate-y-[1px] relative"

                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <motion.span
                                                whileHover={{ scale: 1.1, rotate: 3 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                {item.icon}
                                            </motion.span>

                                            {sidebarWidth === 'expanded' && (
                                                <span className="font-medium flex-1">{item.label}</span>
                                            )}
                                             {sidebarWidth === 'expanded' && item.unreadCount && (
                                                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                                                    {item.unreadCount}
                                                </span>
                                            )}

                                            {hasSubItems && sidebarWidth === 'expanded' && (
                                                <motion.span
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <BiChevronDown />
                                                </motion.span>
                                            )}
                                        </motion.button>
                                    </motion.li>

                                    {/* Submenu / Accordion - Only show when expanded and has subitems*/}
                                    {hasSubItems && sidebarWidth === 'expanded' && (
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.ul
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="ml-8 pl-2 border-l border-purple-300
                                    dark:border-purple-700 overflow-hidden"
                                                >
                                                    {item.subItems!.map((sub) => (
                                                        <li key={sub.label} className="mt-1">
                                                            <motion.button
                                                              whileTap={{ scale: 0.95 }}
                                                                onClick={() => {
                                                                    if (sub.ref) {
                                                                        scrollToSection(sub.ref);
                                                                    }
                                                                    onClose(); //Keep this for sub-items
                                                                }}
                                                                className="w-full text-left flex items-center gap-2
                                            p-2 rounded-md text-gray-600 dark:text-gray-300
                                            hover:bg-purple-200 dark:hover:bg-purple-600
                                            transition"
                                                            >
                                                                {sub.icon && <span>{sub.icon}</span>}
                                                                {sidebarWidth === 'expanded' && <span className="flex-1">{sub.label}</span>}
                                                            </motion.button>
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </Fragment>
                            );
                        })}
                    </ul>
                </motion.nav>

                {sidebarWidth === 'expanded' && onToggleDarkMode && (
                    <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onToggleDarkMode}
                            className="w-full flex items-center gap-2 justify-center
                 px-2 py-1 bg-purple-500 text-white
                 rounded-full shadow-sm hover:bg-purple-600 transition"
                        >
                            {darkMode ? <BiSun /> : <BiMoon />}
                            <span className="text-sm">
                                {darkMode ? "Light Mode" : "Dark Mode"}
                            </span>
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Sidebar;