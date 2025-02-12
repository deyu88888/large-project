import React, {
    useEffect,
    useCallback,
    useState,
    CSSProperties,
    Fragment,
  } from "react";
  import { useLocation } from "react-router-dom";
  import { motion, AnimatePresence } from "framer-motion";
  import {
    BiX,
    BiMoon,
    BiSun,
    BiSearch,
    BiChevronLeft,
    BiChevronRight,
    BiChevronDown,
  } from "react-icons/bi";
  
  /** 
   * SubItem: for multi-level nav (optional submenus).
   */
  interface SubItem {
    label: string;
    icon?: React.ReactNode;
    ref?: React.RefObject<HTMLDivElement>;
  }
  
  /**
   * NavigationItem: top-level item with optional subItems (for accordion).
   */
  interface NavigationItem {
    label: string;
    icon: React.ReactNode;
    ref: React.RefObject<HTMLDivElement> | null;
    subItems?: SubItem[];
  }
  
  /**
   * SidebarProps: receives the parent's darkMode, onToggleDarkMode, etc.
   */
  interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    navigationItems: NavigationItem[];
    scrollToSection: (ref: React.RefObject<HTMLElement>) => void;
  
    // Dark mode
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
  
    // Optional floating toggle tab
    showFloatingToggle?: boolean;
  }
  
  /**
   * Sidebar Component:
   * - 3D tilt effect on hover
   * - Accordion submenus
   * - Search bar to filter nav items
   * - Dark mode toggle
   * - Optional floating toggle tab for desktop
   */
  const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    navigationItems,
    scrollToSection,
    darkMode = false,
    onToggleDarkMode,
    showFloatingToggle = false,
  }) => {
    // For route-based checks (if needed)
    const location = useLocation();
  
    // Search query for filtering
    const [searchQuery, setSearchQuery] = useState("");
  
    // 3D tilt on hover
    const [isHovering, setIsHovering] = useState(false);
  
    // Track which submenu is open (accordion)
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  
    // For optional floating toggle
    const [isTabOpen, setTabOpen] = useState(false);
    useEffect(() => {
      setTabOpen(!isOpen);
    }, [isOpen]);
  
    // Accessibility: close sidebar on "Escape"
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      },
      [isOpen, onClose]
    );
    useEffect(() => {
      if (isOpen) {
        window.addEventListener("keydown", handleKeyDown);
      }
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, handleKeyDown]);
  
    // Toggle submenus (accordion)
    const handleSubmenuToggle = (label: string) => {
      setOpenSubmenu((prev) => (prev === label ? null : label));
    };
  
    // Filter items by search
    const filteredItems = navigationItems.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    // 3D tilt style
    const containerStyle: CSSProperties = {
      transformStyle: "preserve-3d",
      perspective: "1000px",
      transform: isHovering ? "rotateY(-1deg)" : "none",
      transition: "transform 0.4s ease-in-out",
    };
  
    // === Framer Motion Variants ===
    const backdropVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 0.5,
        transition: { duration: 0.2 },
      },
    };
  
    const sidebarVariants = {
      hidden: { x: "-100%" },
      visible: {
        x: 0,
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    };
  
    const listVariants = {
      visible: {
        transition: { staggerChildren: 0.07 },
      },
    };
  
    const itemVariants = {
      hidden: { opacity: 0, x: -10 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.2 },
      },
    };
  
    const submenuVariants = {
      closed: { height: 0, opacity: 0 },
      open: {
        height: "auto",
        opacity: 1,
        transition: { duration: 0.3 },
      },
    };
  
    return (
      <div className="relative z-[200]">
        {/* 1) Floating Toggle Tab (optional) */}
        {showFloatingToggle && (
          <motion.button
            className="fixed top-1/2 left-0 transform -translate-y-1/2
                       bg-purple-600 text-white w-8 h-16 rounded-r-md
                       shadow-lg hidden sm:flex items-center justify-center"
            style={{ zIndex: 210 }}
            animate={{ x: isTabOpen ? 0 : 240 }}
            transition={{ duration: 0.3 }}
            onClick={isOpen ? onClose : undefined}
            aria-label="Toggle Sidebar"
          >
            {isOpen ? <BiChevronLeft size={24} /> : <BiChevronRight size={24} />}
          </motion.button>
        )}
  
        {/* 2) Backdrop (for mobile) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-black z-40"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={onClose}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
  
        {/* 3) Sidebar Container */}
        <motion.div
          className={`
            fixed top-0 left-0 h-full w-72
            backdrop-blur-md bg-gradient-to-br from-white/80 via-white/60 to-white/80
            dark:bg-gradient-to-br dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/60
            shadow-2xl z-50 overflow-y-auto
            transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            sm:translate-x-0 flex flex-col
          `}
          style={containerStyle}
          variants={sidebarVariants}
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          role="dialog"
          aria-modal="true"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* 3A) Close Button (X) */}
          <button
            className="absolute top-4 right-4 text-gray-600 dark:text-gray-300
                       hover:text-gray-800 dark:hover:text-white focus:outline-none"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <BiX className="h-6 w-6" />
          </button>
  
          {/* 3B) Title / Logo */}
          <div className="p-4">
            <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              Universal Student Society
            </h2>
          </div>
  
          {/* 3C) Search Bar */}
          <div className="px-4">
            <div className="relative text-gray-600 dark:text-gray-200">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <BiSearch />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full bg-white/80 dark:bg-gray-700
                           rounded-full pl-8 pr-4 py-2 focus:outline-none
                           focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>
          </div>
  
          {/* 3D) Navigation Items (with submenus) */}
          <motion.nav
            className="flex-1 mt-4 px-2 flex flex-col"
            role="navigation"
            aria-label="Sidebar Navigation"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <ul className="space-y-1">
              {filteredItems.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = openSubmenu === item.label;
  
                return (
                  <Fragment key={item.label}>
                    <motion.li
                      variants={itemVariants}
                      className="relative group"
                    >
                      {/* Top-level nav button */}
                      <button
                        onClick={() => {
                          if (hasSubItems) {
                            handleSubmenuToggle(item.label);
                          } else {
                            // If no subItems, we can directly scroll
                            if (item.ref) {
                              scrollToSection(item.ref);
                            }
                            onClose();
                          }
                        }}
                        className="w-full text-left flex items-center gap-2 p-3
                                   rounded-md text-gray-700 dark:text-gray-200
                                   hover:bg-purple-200 dark:hover:bg-purple-600
                                   transition transform group-hover:-translate-y-[1px]"
                      >
                        {/* Icon with hover scale/rotate */}
                        <motion.span
                          whileHover={{ scale: 1.1, rotate: 3 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {item.icon}
                        </motion.span>
  
                        {/* Label */}
                        <span className="font-medium flex-1">{item.label}</span>
  
                        {/* Submenu arrow */}
                        {hasSubItems && (
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <BiChevronDown />
                          </motion.span>
                        )}
                      </button>
                    </motion.li>
  
                    {/* Submenu / Accordion */}
                    {hasSubItems && (
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.ul
                            variants={submenuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="ml-8 pl-2 border-l border-purple-300
                                       dark:border-purple-700 overflow-hidden"
                          >
                            {item.subItems!.map((sub) => (
                              <li key={sub.label} className="mt-1">
                                <button
                                  onClick={() => {
                                    if (sub.ref) {
                                      scrollToSection(sub.ref);
                                    }
                                    onClose();
                                  }}
                                  className="w-full text-left flex items-center gap-2
                                             p-2 rounded-md text-gray-600 dark:text-gray-300
                                             hover:bg-purple-200 dark:hover:bg-purple-600
                                             transition"
                                >
                                  {sub.icon && <span>{sub.icon}</span>}
                                  <span>{sub.label}</span>
                                </button>
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
  
          {/* 3E) Dark Mode Toggle (Optional) */}
          {onToggleDarkMode && (
            <div className="p-4 border-t border-gray-300 dark:border-gray-700">
              <button
                onClick={onToggleDarkMode}
                className="w-full flex items-center gap-2 justify-center
                           px-2 py-1 bg-purple-500 text-white
                           rounded-full shadow-sm hover:bg-purple-600 transition"
              >
                {darkMode ? <BiSun /> : <BiMoon />}
                <span className="text-sm">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };
  
  export default Sidebar;  