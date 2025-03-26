import React from "react";
interface SubItem {
    label: string;
    icon?: React.ReactNode;
    ref?: React.RefObject<HTMLDivElement>;
    roles?: string[];
}
interface NavigationItem {
    label: string;
    icon: React.ReactNode;
    ref: React.RefObject<HTMLDivElement> | null;
    subItems?: SubItem[];
    roles?: string[];
    unreadCount?: number;
    link?: string;
}
interface SidebarProps {
    onClose: () => void;
    navigationItems: NavigationItem[];
    scrollToSection: (ref: React.RefObject<HTMLDivElement> | null) => void;
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
    sidebarWidth: 'collapsed' | 'expanded';
    userRole?: string;
    onToggle: () => void;
}
declare const Sidebar: React.FC<SidebarProps>;
export default Sidebar;
