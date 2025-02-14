// import React, { createContext, useState, useContext, ReactNode, useLayoutEffect } from "react";

// interface SidebarContextProps {
//   sidebarWidth: number;
//   setSidebarWidth: (width: number) => void;
//   toggleSidebar: () => void;
//   isSidebarExpanded: boolean;
// }

// const SidebarContext = createContext<SidebarContextProps>({
//   sidebarWidth: 80, // Default width when expanded
//   setSidebarWidth: () => {},
//   toggleSidebar: () => {},
//   isSidebarExpanded: true, // Default to expanded state
// });

// interface SidebarProviderProps {
//   children: ReactNode;
// }

// export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
//   const expandedWidth = 0;  // Change this to the actual expanded width
//   const collapsedWidth = 0;  // Change this to the actual collapsed width

//   const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
//   const [sidebarWidth, setSidebarWidth] = useState<number>(expandedWidth);

//   const handleResize = () => {
//     if (isSidebarExpanded) {
//       const calculatedWidth = Math.max(Math.min(window.innerWidth * 0.2, expandedWidth), collapsedWidth);
//       setSidebarWidth(calculatedWidth);
//     } else {
//       setSidebarWidth(collapsedWidth);
//     }
//   };

//   useLayoutEffect(() => {
//     window.addEventListener("resize", handleResize);
//     handleResize(); // Call on mount to set the initial width correctly
//     return () => window.removeEventListener("resize", handleResize);
//   }, [isSidebarExpanded]);

//   const toggleSidebar = () => {
//     setIsSidebarExpanded((prevState) => !prevState);
//     handleResize(); // Ensure the width updates immediately after toggle
//   };

//   return (
//     <SidebarContext.Provider value={{ sidebarWidth, setSidebarWidth, toggleSidebar, isSidebarExpanded }}>
//       {children}
//     </SidebarContext.Provider>
//   );
// };

// export const useSidebar = () => useContext(SidebarContext);
