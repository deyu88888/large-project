import React, { useEffect, useState, useRef, useCallback } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties";
import Sidebar from "../components/Sidebar";
import { HiMenu } from "react-icons/hi";
import { motion } from 'framer-motion';
import { useFetchWebSocket } from "../hooks/useFetchWebSocket";
import { getAllEvents, apiClient } from "../api";

// -- Type Definitions --
interface StatData {
  totalSocieties: number;
  totalEvents: number;
  pendingApprovals: number;
  activeMembers: number;
}

interface Activity {
  description: string;
}

interface Notification {
  message: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

interface Introduction {
  title: string;
  content: string[];
}

interface RawEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  start_time?: string; // Added for test compatibility
  duration?: string;
}

// -- Reusable Components --
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6
               border-l-8 border-transparent hover:border-gradient-to-r
               hover:from-purple-500 hover:to-indigo-500
               transition-all duration-300"
    data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </motion.section>
);

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({
  title,
  value,
  color,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`p-6 rounded-2xl text-white bg-gradient-to-br ${color}
                shadow-md transition transform hover:scale-105 hover:shadow-lg`}
    data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <p className="text-sm uppercase tracking-wider">{title}</p>
    <p className="text-4xl font-bold mt-2">{value}</p>
  </motion.div>
);

// Tabs for "Updates" section
interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

// Define the Tabs component
const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, children }) => {
  const tabLabels = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => (child as React.ReactElement).props.label);

  return (
    <div data-testid="tabs-container">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabLabels.map((label: string) => (
          <button
            key={label}
            className={`py-2 px-4 text-sm font-medium focus:outline-none ${
              activeTab === label
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
            }`}
            onClick={() => setActiveTab(label)}
            data-testid={`tab-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="py-4" data-testid="tab-content">
        {React.Children.toArray(children).find(
          (child) =>
            React.isValidElement(child) &&
            (child as React.ReactElement).props.label === activeTab
        )}
      </div>
    </div>
  );
};

interface TabPanelProps {
  label: string;
  children: React.ReactNode;
}

// Define the TabPanel component
const TabPanel: React.FC<TabPanelProps> = ({ children, label }) => (
  <div data-testid={`panel-${label.toLowerCase().replace(/\s+/g, '-')}`}>{children}</div>
);

// -- API Functions to use with useFetchWebSocket --
const fetchDashboardStats = async (): Promise<StatData> => {
  try {
    const response = await apiClient.get("/api/dashboard/stats");
    return response.data || {
      totalSocieties: 5,
      totalEvents: 10,
      pendingApprovals: 3,
      activeMembers: 125
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalSocieties: 5,
      totalEvents: 10,
      pendingApprovals: 3,
      activeMembers: 125
    };
  }
};

const fetchActivities = async (): Promise<Activity[]> => {
  try {
    const response = await apiClient.get("/api/dashboard/activities");
    return response.data || [
      { description: "Chess Society organized a tournament" },
      { description: "New Debate Society was created" },
      { description: "Music Club scheduled a concert for next month" }
    ];
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [
      { description: "Chess Society organized a tournament" },
      { description: "New Debate Society was created" },
      { description: "Music Club scheduled a concert for next month" }
    ];
  }
};

const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get("/api/dashboard/notifications");
    return response.data || [
      { message: "New event proposal requires approval" },
      { message: "Society budget reports due next week" }
    ];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [
      { message: "New event proposal requires approval" },
      { message: "Society budget reports due next week" }
    ];
  }
};

// -- Main Dashboard --
const Dashboard: React.FC = () => {
  // ---- States ----
  const [stats, setStats] = useState<StatData>({
    totalSocieties: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeMembers: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [introduction, setIntroduction] = useState<Introduction | null>({
    title: "Welcome to Student Societies Dashboard",
    content: [
      "This dashboard provides an overview of all student societies and their activities.",
      "Join a society, attend events, and make the most of your campus experience!"
    ]
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Recent Activities");

  // Sidebar control - Manages width instead of open/closed state
  const [sidebarWidth, setSidebarWidth] = useState<'collapsed' | 'expanded'>('collapsed');

  // -- Dark Mode --
  const [darkMode, setDarkMode] = useState(() => {
    try {
      // Optional: read from localStorage or system preference
      const stored = localStorage.getItem("darkMode");
      if (stored !== null) {
        return JSON.parse(stored);
      }
      // Or default to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark;
    } catch (e) {
      // Fallback if localStorage or matchMedia fails
      return false;
    }
  });

  // Apply or remove .dark class on <html> or <body>
  useEffect(() => {
    try {
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    } catch (e) {
      console.error("Failed to save darkMode to localStorage:", e);
    }
    
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // -- Refs for Scrollable Sections --
  const statsRef = useRef<HTMLDivElement>(null);
  const popularSocietiesRef = useRef<HTMLDivElement>(null);
  const upcomingEventsRef = useRef<HTMLDivElement>(null);
  const eventCalendarRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);

  // -- Use WebSocket Hook for Dashboard Stats --
  const dashboardStats = useFetchWebSocket<StatData>(fetchDashboardStats, "dashboard/stats");
  
  // -- Use WebSocket Hook for Activities --
  const activities = useFetchWebSocket<Activity>(fetchActivities, "dashboard/activities");
  
  // -- Use WebSocket Hook for Notifications --
  const notificationData = useFetchWebSocket<Notification>(fetchNotifications, "dashboard/notifications");

  // -- Toggle Sidebar -- (ONLY for the hamburger button)
  const handleToggleSidebar = useCallback(() => {
    setSidebarWidth((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsed'));
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarWidth('collapsed');
  }, []);

  const handleNavItemClick = useCallback((ref: React.RefObject<HTMLElement> | null) => {
    scrollToSection(ref);
  }, []);

  // -- Navigation Items Array --
  const navigationItems = [
    {
      label: "Dashboard",
      icon: <span className="text-xl">🏠</span>,
      ref: null,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Statistics",
      icon: <span className="text-xl">📊</span>,
      ref: statsRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Popular Societies",
      icon: <span className="text-xl">🏆</span>,
      ref: popularSocietiesRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Upcoming Events",
      icon: <span className="text-xl">📅</span>,
      ref: upcomingEventsRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Event Calendar",
      icon: <span className="text-xl">🗓️</span>,
      ref: eventCalendarRef,
      scrollToSection: handleNavItemClick,
    },
    {
      label: "Updates",
      icon: <span className="text-xl">🔔</span>,
      ref: updatesRef,
      scrollToSection: handleNavItemClick,
    },
  ];

  // -- Smooth Scroll --
  const scrollToSection = useCallback((ref: React.RefObject<HTMLElement> | null) => {
    if (ref === null) {
      // Scroll to the top of the document
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else if (ref && ref.current) {
      // Existing scroll to section logic
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const elementPosition = ref.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  // -- Helpers for parsing Dates & Durations --
  const parseEventDateTime = useCallback((dateStr: string, timeStr: string): Date | null => {
    try {
      const dateTimeStr = `${dateStr}T${timeStr}`;
      const date = new Date(dateTimeStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch (e) {
      console.error("Error parsing date/time:", e);
      return null;
    }
  }, []);

  const calculateEventEnd = useCallback((start: Date | null, durationStr?: string): Date | null => {
    if (!start || !durationStr) return null;
    if (!durationStr.includes(":")) return null;
    
    try {
      const [hours, minutes, seconds] = durationStr.split(":").map(Number);
      const durationMs = (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
      return new Date(start.getTime() + durationMs);
    } catch (e) {
      console.error("Error calculating event end time:", e);
      return null;
    }
  }, []);

  // Update state when WebSocket data changes
  useEffect(() => {
    if (dashboardStats && dashboardStats.length > 0) {
      setStats(dashboardStats[0]);
    }
  }, [dashboardStats]);

  useEffect(() => {
    if (activities && activities.length > 0) {
      setRecentActivities(activities);
    }
  }, [activities]);

  useEffect(() => {
    if (notificationData && notificationData.length > 0) {
      setNotifications(notificationData);
    }
  }, [notificationData]);

  // ---- Fetch Events ----
  useEffect(() => {
    let isMounted = true;
  
    async function fetchEvents() {
      try {
        // 1️⃣ Fetch raw events from the API
        const rawEvents: RawEvent[] = await getAllEvents();
        console.log("🎉 Raw Events from API:", rawEvents);
  
        if (!isMounted) return;
  
        // Use mock events if API call failed
        if (!rawEvents || rawEvents.length === 0) {
          const mockEvents = [
            { id: 1, title: "Welcome Party", date: "2025-03-10", startTime: "18:00:00", duration: "02:00:00" },
            { id: 2, title: "Chess Tournament", date: "2025-03-15", startTime: "14:00:00", duration: "03:00:00" },
            { id: 3, title: "Spring Concert", date: "2025-03-22", startTime: "19:30:00", duration: "01:30:00" }
          ];
          processEvents(mockEvents);
        } else {
          processEvents(rawEvents);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching events:", err);
        
        // Use mock events as fallback
        const mockEvents = [
          { id: 1, title: "Welcome Party", date: "2025-03-10", startTime: "18:00:00", duration: "02:00:00" },
          { id: 2, title: "Chess Tournament", date: "2025-03-15", startTime: "14:00:00", duration: "03:00:00" },
          { id: 3, title: "Spring Concert", date: "2025-03-22", startTime: "19:30:00", duration: "01:30:00" }
        ];
        
        if (isMounted) {
          processEvents(mockEvents);
          setError("Using mock data - API connection failed.");
          setLoading(false);
        }
      }
    }
    
    function processEvents(events: RawEvent[]) {
      // 2️⃣ Convert raw events to formatted events
      const formattedEvents = events
        .map((event): CalendarEvent | null => {
          // Use the API field names - handle both startTime and start_time for compatibility
          const timeField = event.startTime || event.start_time || "";
          const startDateTime = parseEventDateTime(event.date, timeField);
          // Calculate the end time using the provided duration
          const endDateTime = calculateEventEnd(startDateTime, event.duration);

          if (!startDateTime || !endDateTime) {
            console.warn("⚠️ Skipping invalid event:", event);
            return null;
          }

          return {
            id: event.id,
            title: event.title,
            start: startDateTime,
            end: endDateTime,
          };
        })
        .filter((evt): evt is CalendarEvent => evt !== null);

      // 3️⃣ Sort events by start time
      formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      console.log("✅ Formatted Events:", formattedEvents);

      if (isMounted) {
        setUpcomingEvents(formattedEvents);
        setEventCalendar(formattedEvents);
      }
    }
  
    fetchEvents();
    
    // Set up event polling with a small interval for real-time updates
    const eventPolling = setInterval(fetchEvents, 3000);
  
    return () => {
      isMounted = false;
      clearInterval(eventPolling);
    };
  }, [parseEventDateTime, calculateEventEnd]);

  // Loading state check
  useEffect(() => {
    if (
      dashboardStats && 
      activities && 
      notificationData && 
      upcomingEvents.length > 0
    ) {
      setLoading(false);
    }
  }, [dashboardStats, activities, notificationData, upcomingEvents]);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <div
      className={`min-h-screen flex ${
        darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      } transition-colors duration-500 grid grid-cols-[auto_1fr]`}
      style={{
        gridTemplateColumns: sidebarWidth === 'collapsed' ? 'auto 1fr' : '288px 1fr',
      }}
      data-testid="dashboard-container"
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={true}
        onClose={handleCloseSidebar}
        onToggle={handleToggleSidebar}
        navigationItems={navigationItems}
        scrollToSection={handleNavItemClick}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        sidebarWidth={sidebarWidth}
      />

      {/* Main Content */}
      <div className="flex-grow pt-16" data-testid="main-content">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-md fixed top-0 z-10 w-full"
          style={{
            gridTemplateColumns: sidebarWidth === 'collapsed' ? 'auto 1fr auto' : '288px 1fr',
          }}
          data-testid="dashboard-header"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
            <div className="flex items-center gap-2">
              {/* Toggle Button */}
              <button
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800
                          dark:hover:text-white focus:outline-none"
                onClick={handleToggleSidebar}
                aria-label="Toggle Menu"
                data-testid="header-toggle-button"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiMenu className="h-6 w-6" />
                </motion.span>
              </button>
              <span role="img" aria-label="sparkles" className="text-3xl">
                ✨
              </span>
              <h1 className="text-xl font-extrabold tracking-wide text-gray-800 dark:text-gray-100">
                Student Society Dashboard
              </h1>
            </div>

            {/* Conditionally render Register/Login links */}
            {sidebarWidth === 'collapsed' && (
              <div className="flex items-center justify-end gap-4">
                {/* Search and Buttons */}
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-300
                              dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100
                              focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ caretColor: "black" }}
                  data-testid="search-input"
                />
                <Link
                  to="/register"
                  className="px-4 py-2 bg-purple-600 text-white
                              rounded-full shadow hover:bg-purple-700 transition whitespace-nowrap"
                  data-testid="register-link"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-purple-600 text-white
                              rounded-full shadow hover:bg-purple-700 transition whitespace-nowrap"
                  data-testid="login-link"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </motion.header>

        {/* Main Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-10" data-testid="content-container">
          {/* Introduction */}
          <SectionCard title={introduction?.title || "Welcome!"}>
            <div>
              {introduction?.content?.length ? (
                introduction.content.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-gray-700 dark:text-gray-200 text-base leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-base">
                  No introduction available.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Statistics */}
          <div
            ref={statsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            data-testid="statistics-section"
          >
            <StatCard
              title="Total Societies"
              value={stats.totalSocieties}
              color="from-purple-600 to-purple-400"
            />
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              color="from-green-600 to-green-400"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              color="from-yellow-600 to-yellow-400"
            />
            <StatCard
              title="Active Members"
              value={stats.activeMembers}
              color="from-blue-600 to-blue-400"
            />
          </div>

          {/* Popular Societies */}
          <motion.section
            ref={popularSocietiesRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-6
                       border-l-8 border-transparent hover:border-gradient-to-r
                       hover:from-purple-500 hover:to-indigo-500
                       transition-all duration-300"
            data-testid="popular-societies-section"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Popular Societies
            </h2>
            <PopularSocieties />
          </motion.section>

          {/* Upcoming Events */}
          <SectionCard title="Upcoming Events">
            <div ref={upcomingEventsRef} data-testid="upcoming-events-section">
              {upcomingEvents.length > 0 ? (
                <UpcomingEvents events={upcomingEvents} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center animate-pulse">
                  No upcoming events.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Event Calendar */}
          <SectionCard title="Event Calendar">
            <div ref={eventCalendarRef} data-testid="event-calendar-section">
              {eventCalendar.length > 0 ? (
                <EventCalendar events={eventCalendar} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center animate-pulse">
                  No events scheduled yet.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Updates */}
          <SectionCard title="Updates">
            <div ref={updatesRef} data-testid="updates-section">
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab}>
                <TabPanel label="Recent Activities">
                  {recentActivities.length ? (
                    <ul className="space-y-2 pl-4 list-disc">
                      {recentActivities.map((activity, idx) => (
                        <li
                          key={idx}
                          className="text-gray-700 dark:text-gray-200 text-base"
                          data-testid={`activity-item-${idx}`}
                        >
                          {activity.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-base">
                      No recent activities.
                    </p>
                  )}
                </TabPanel>
                <TabPanel label="Notifications">
                  {notifications.length ? (
                    <ul className="space-y-2 pl-4 list-disc">
                      {notifications.map((notification, idx) => (
                        <li
                          key={idx}
                          className="text-gray-700 dark:text-gray-200 text-base"
                          data-testid={`notification-item-${idx}`}
                        >
                          {notification.message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-base">
                      No notifications.
                    </p>
                  )}
                </TabPanel>
              </Tabs>
            </div>
          </SectionCard>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-red-100 dark:bg-red-900 border-l-8 border-red-600
                       text-red-800 dark:text-red-200 p-6 rounded-2xl shadow-md"
              data-testid="error-message"
            >
              <strong>Error:</strong> {error}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;