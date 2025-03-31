// Refactored
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";
import { CircularProgress } from "@mui/material";
import EventCard from "../components/EventCard";
import { useAuthStore } from "../stores/auth-store";
import { User } from "../types/user/user";
import { EventData, Attendee } from "../types/event/event";
import { mapToEventData } from "../utils/mapper.ts";

export default function AllEventsPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const { user, setUser } = useAuthStore();

    const [currentUser, setCurrentUser] = useState<User | null>(user);
    const [events, setEvents] = useState<EventData[]>([]);
    const [userLoading, setUserLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            apiClient
                .get("/api/user/current")
                .then((res) => {
                    setCurrentUser(res.data);
                    setUser && setUser(res.data);
                })
                .catch((err) => {
                    if (err.response?.status === 401) {
                        console.log("User not logged in, that's okay.");
                    } else {
                        console.error("Error fetching current user:", err);
                        setError("Failed to fetch user information.");
                    }
                })
                .finally(() => {
                    setUserLoading(false);
                });
        } else {
            setCurrentUser(user);
            setUserLoading(false);
        }
    }, [user, setUser]);

    useEffect(() => {
        setEventsLoading(true);
        setError(null);
        apiClient
            .get("/api/events/all/")
            .then((res) => {
                const mappedEvents = (res.data || []).map(mapToEventData);
                setEvents(mappedEvents);
            })
            .catch((error) => {
                console.error("Error fetching events:", error);
                setError("Failed to load events. Please try again later.");
            })
            .finally(() => {
                setEventsLoading(false);
            });
    }, []);

    const handleViewEvent = (eventId: number) => {
        const isStudentPage = location.pathname.includes("/student");
        navigate(`${isStudentPage ? "/student" : ""}/event/${eventId}`);
    };


    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "2rem",
                backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
                transition: "all 0.3s ease-in-out",
                overflow: "hidden",
            }}
        >
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <h1
                        style={{
                            color: colours.grey[100],
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            marginBottom: "0.75rem",
                            transition: "color 0.3s",
                        }}
                    >
                        Explore Campus Events
                    </h1>
                    <p
                        style={{
                            color: colours.grey[100],
                            fontSize: "1.125rem",
                            margin: 0,
                            transition: "color 0.3s",
                        }}
                    >
                        Discover upcoming events and activities
                    </p>
                </header>

                {error && (
                    <div
                        style={{
                            color: isLight ? colours.redAccent[400] : colours.redAccent[300],
                            textAlign: "center",
                            fontSize: "1rem",
                            marginBottom: "1.5rem",
                            padding: "0.75rem 1.5rem",
                            backgroundColor: isLight ? "rgba(255, 100, 100, 0.1)" : "rgba(255, 100, 100, 0.2)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                            animation: "slideInDown 0.4s ease-out",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            maxWidth: "600px",
                            margin: "0 auto 1.5rem auto",
                        }}
                    >
                        <span style={{ marginRight: "0.5rem" }}>⚠️</span>
                        {error}
                    </div>
                )}

                {eventsLoading && (
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "3rem"
                    }}>
                        <CircularProgress />
                        <div style={{
                            color: colours.grey[100],
                            fontSize: "1.2rem",
                            marginLeft: "1rem"
                        }}>
                            Loading events...
                        </div>
                    </div>
                )}

                {!eventsLoading && events.length > 0 && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: "1.25rem",
                            perspective: "1000px",
                            maxWidth: "100%"
                        }}
                    >
                        {events.map((event) => {
                            let followingsAttending: Attendee[] = [];
                            if (
                                !userLoading &&
                                currentUser &&
                                currentUser.following &&
                                event.currentAttendees
                            ) {
                                followingsAttending = event.currentAttendees.filter((attendee) =>
                                    currentUser.following!.includes(attendee.id)
                                );
                            }

                            return (
                                <EventCard
                                    key={event.eventId}
                                    event={event}
                                    followingsAttending={followingsAttending}
                                    isLight={isLight}
                                    colors={colours}
                                    onViewEvent={handleViewEvent}
                                />
                            );
                        })}
                    </div>
                )}

                {!eventsLoading && events.length === 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "3rem",
                            backgroundColor: isLight ? colours.primary[400] : colours.primary[700],
                            borderRadius: "1rem",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "3rem",
                                marginBottom: "1rem",
                            }}
                        >
                            🗓️
                        </div>
                        <p
                            style={{
                                color: isLight ? colours.grey[200] : colours.grey[300],
                                fontSize: "1.25rem",
                                fontWeight: "500",
                                textAlign: "center",
                            }}
                        >
                            No events available at the moment.
                        </p>
                        <p
                            style={{
                                color: isLight ? colours.grey[300] : colours.grey[400],
                                fontSize: "1rem",
                                textAlign: "center",
                                maxWidth: "400px",
                                marginTop: "0.5rem",
                            }}
                        >
                            Please check back later for updates.
                        </p>
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes slideInDown {
                        from {
                            transform: translateY(-20px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
        </div>
    );
}