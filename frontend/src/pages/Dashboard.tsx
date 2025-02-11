import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import EventCalendar from "../components/EventCalendar";
import UpcomingEvents from "../components/UpcomingEvents";
import { Link } from "react-router-dom";
import { LoadingView } from "../components/loading/loading-view";
import PopularSocieties from "../components/PopularSocieties";
import { getAllEvents } from "../api";
import { motion } from "framer-motion";

console.log("=== React app is running! ===");

// --- Type Definitions ---
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

// WebSocket message types
type WebSocketMessage =
    | { type: "dashboard.update"; data: StatData }
    | { type: "update_activities"; activities: Activity[] }
    | { type: "update_notifications"; notifications: Notification[] }
    | { type: "update_events"; events: { id: number; title: string; start: string; end: string }[] }
    | { type: "update_introduction"; introduction: Introduction };


// ==================== REUSABLE COMPONENTS ====================

// SectionCard: a reusable card wrapper for each content block
const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = memo(
    ({ title, icon, children }) => (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border-l-8 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all duration-300"
        >
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <span aria-hidden="true" className="text-3xl">
                    {icon}
                </span>
                {title}
            </h2>
            <div className="space-y-4">{children}</div>
        </motion.section>
    )
);
SectionCard.displayName = "SectionCard";

// StatCard: a reusable card for displaying statistics
const StatCard: React.FC<{ title: string; value: number; color: string }> = memo(
    ({ title, value, color }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`p-6 rounded-2xl text-white bg-gradient-to-br ${color} shadow-md transition transform hover:scale-105 hover:shadow-lg`}
        >
            <p className="text-sm uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-bold mt-2">{value}</p>
        </motion.div>
    )
);
StatCard.displayName = "StatCard";

// ==================== MAIN DASHBOARD COMPONENT ====================

const Dashboard: React.FC = () => {
    // State Management
    const [stats, setStats] = useState<StatData>({ totalSocieties: 0, totalEvents: 0, pendingApprovals: 0, activeMembers: 0 });
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [eventCalendar, setEventCalendar] = useState<CalendarEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
    const [introduction, setIntroduction] = useState<Introduction | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    // WebSocket references
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const MAX_RECONNECT_ATTEMPTS = 5;
    let reconnectAttempts = 0;

    // --- Fetch All Events for Both Calendar & Upcoming Events ---
    useEffect(() => {
        getAllEvents()
            .then((data) => {
                console.log("🎉 Raw Events from API:", data);

                interface RawEvent {
                    id: number;
                    title: string;
                    date: string;
                    startTime: string;
                    duration?: string;
                }

                const formattedEvents: CalendarEvent[] = (data as RawEvent[])
                    .map((event: RawEvent): CalendarEvent | null => {
                        try {
                            if (!event.duration || typeof event.duration !== "string" || !event.duration.includes(":")) {
                                console.warn(`⚠️ Skipping event with invalid duration:`, event);
                                return null;
                            }

                            const startDateTime = new Date(`${event.date}T${event.startTime}`);
                            const [hours, minutes, seconds] = event.duration.split(":").map(Number);
                            const durationMs = (hours * 3600 + minutes * 60 + (seconds || 0)) * 1000;
                            const endDateTime = new Date(startDateTime.getTime() + durationMs);

                            return {
                                id: event.id,
                                title: event.title,
                                start: startDateTime,
                                end: endDateTime,
                            };
                        } catch (error) {
                            console.error(`❌ Error processing event:`, event, error);
                            return null;
                        }
                    })
                    .filter((event): event is CalendarEvent => event !== null);

                formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

                console.log("✅ Formatted Events (Sorted):", formattedEvents);
                setUpcomingEvents(formattedEvents);
                setEventCalendar(formattedEvents);
            })
            .catch((error) => {
                console.error("❌ Error fetching events:", error);
                setError("Failed to fetch events.");
            });
    }, []);

    // --- WebSocket Message Handler ---
    const messageHandler = useCallback((data: WebSocketMessage) => {
        switch (data.type) {
            case "dashboard.update":
                setStats((prev) => (prev.totalSocieties !== data.data.totalSocieties ? data.data : prev));
                break;
            case "update_activities":
                setRecentActivities((prev) => (prev.length !== data.activities.length ? data.activities : prev));
                break;
            case "update_notifications":
                setNotifications((prev) => (prev.length !== data.notifications.length ? data.notifications : prev));
                break;
            case "update_events": {
                const formattedEvents = data.events.map((ev) => ({
                    id: ev.id,
                    title: ev.title,
                    start: new Date(ev.start),
                    end: new Date(ev.end),
                }));
                setEventCalendar(formattedEvents);
                setUpcomingEvents(formattedEvents);
                break;
            }
            case "update_introduction":
                setIntroduction((prev) => (prev?.title !== data.introduction.title ? data.introduction : prev));
                break;
            default:
                console.warn("Unknown WebSocket message type:", data);
        }
    }, []);

    // --- WebSocket Connection Handling ---
    useEffect(() => {
        console.log("[Dashboard] Initializing WebSocket...");
        const wsURL = process.env.NODE_ENV === "production"
            ? "wss://your-production-domain.com/ws/dashboard/"
            : "ws://127.0.0.1:8000/ws/dashboard/";

        const connectWebSocket = () => {
            if (socketRef.current) {
                console.warn("[Dashboard] WebSocket already connected. Skipping reconnection.");
                return;
            }

            const socket = new WebSocket(wsURL);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("[Dashboard] WebSocket Connected!");
                setError(null);
                reconnectAttempts = 0;
                if (reconnectIntervalRef.current) {
                    clearInterval(reconnectIntervalRef.current);
                    reconnectIntervalRef.current = null;
                }
            };

            socket.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);
                    messageHandler(data);
                } catch (parseError) {
                    console.error("Error parsing WebSocket message:", parseError);
                    setError("Error parsing WebSocket message.");
                }
            };

            socket.onerror = (error) => {
                console.error("[Dashboard] WebSocket Error:", error);
                setError("WebSocket connection failed.");
            };

            socket.onclose = (event) => {
                console.warn("[Dashboard] WebSocket Closed:", event.code);
                socketRef.current = null;

                if (event.code !== 1000 && event.code !== 1005 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    console.log(`[Dashboard] Attempting WebSocket Reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                    if (!reconnectIntervalRef.current) {
                        reconnectIntervalRef.current = setTimeout(connectWebSocket, 5000);
                    }
                } else {
                    console.warn("[Dashboard] Maximum WebSocket reconnect attempts reached. Stopping retries.");
                }
            };
        };

        connectWebSocket();

        return () => {
            console.log("[Dashboard] Cleaning up WebSocket...");
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current);
                reconnectIntervalRef.current = null;
            }
        };
    }, [messageHandler]);

    // Set loading state after stats & introduction are received
    useEffect(() => {
        if (stats.totalSocieties >= 0 && introduction !== null) {
            setLoading(false);
        }
    }, [stats, introduction]);

    if (loading) {
        return <LoadingView />;
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Fixed Header */}
            <motion.header
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow-md fixed top-0 left-0 right-0 z-10"
            >
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span role="img" aria-label="sparkles" className="text-3xl">
                            ✨
                        </span>
                        <h1 className="text-xl font-extrabold tracking-wide text-gray-800">
                            Student Society Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300"
                            style={{ caretColor: "black" }}
                        />
                        <Link
                            to="/register"
                            className="px-4 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
                        >
                            Register
                        </Link>
                        <Link
                            to="/login"
                            className="px-4 py-2 bg-green-500 text-white rounded-full shadow hover:bg-green-600 transition"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </motion.header>

            {/* Main Content Area */}
            <div className="pt-20 max-w-7xl mx-auto px-4 py-8 space-y-10">
                {/* Website Introduction */}
                <SectionCard title={introduction?.title || "Welcome!"} icon="🌐">
                    {introduction?.content?.length ? (
                        introduction.content.map((paragraph, idx) => (
                            <p key={idx} className="text-gray-700 text-base leading-relaxed">
                                {paragraph}
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-700 text-base">No introduction available.</p>
                    )}
                </SectionCard>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Societies" value={stats.totalSocieties} color="from-blue-600 to-blue-400" />
                    <StatCard title="Total Events" value={stats.totalEvents} color="from-green-600 to-green-400" />
                    <StatCard title="Pending Approvals" value={stats.pendingApprovals} color="from-yellow-600 to-yellow-400" />
                    <StatCard title="Active Members" value={stats.activeMembers} color="from-purple-600 to-purple-400" />
                </div>

                {/* Popular Societies Section */}
                 <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border-l-8 border-transparent hover:border-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all duration-300"
                >
                    <PopularSocieties />
                </motion.section>


                {/* Upcoming Events Section */}
                <SectionCard title="Upcoming Events" icon="📅">
                    {upcomingEvents.length > 0 ? (
                        <UpcomingEvents events={upcomingEvents} />
                    ) : (
                        <p className="text-gray-500 text-center animate-pulse">No upcoming events.</p>
                    )}
                </SectionCard>

                {/* Event Calendar */}
                <SectionCard title="Event Calendar" icon="📆">
                    {eventCalendar.length > 0 ? (
                        <EventCalendar events={eventCalendar} />
                    ) : (
                        <p className="text-gray-500 text-center animate-pulse">No events scheduled yet.</p>
                    )}
                </SectionCard>

                {/* Recent Activities */}
                <SectionCard title="Recent Activities" icon="🔥">
                    {recentActivities.length ? (
                        <ul className="space-y-2 pl-4">
                            {recentActivities.map((activity, idx) => (
                                <li key={idx} className="text-gray-700 text-base">
                                    • {activity.description}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-base">No recent activities found.</p>
                    )}
                </SectionCard>

                {/* Notifications */}
                <SectionCard title="Notifications" icon="🔔">
                    {notifications.length ? (
                        <ul className="space-y-2 pl-4">
                            {notifications.map((notification, idx) => (
                                <li key={idx} className="text-gray-700 text-base">
                                    • {notification.message}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-base">No notifications found.</p>
                    )}
                </SectionCard>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-red-100 border-l-8 border-red-600 text-red-800 p-6 rounded-2xl shadow-md"
                    >
                        <strong>Error:</strong> {error}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;