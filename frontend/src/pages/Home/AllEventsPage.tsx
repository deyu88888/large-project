// Refactored
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api.ts";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme.ts";
import { CircularProgress, Pagination } from "@mui/material";
import EventCard from "../../components/EventCard.tsx";
import { useAuthStore } from "../../stores/auth-store.ts";
import { User } from "../../types/user/user.ts";
import { EventData, Attendee } from "../../types/event/event.ts";
import { mapToEventData } from "../../utils/mapper.ts";
import useAuthCheck from "../../hooks/useAuthCheck.ts";

export default function AllEventsPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";
    const { user } = useAuthStore();
    
    // Use the useAuthCheck hook instead of direct API calls
    const { isAuthenticated, isLoading: authLoading } = useAuthCheck();

    const [events, setEvents] = useState<EventData[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [page, setPage] = useState(1);
    const EVENTS_PER_PAGE = 36;

    // Load events data
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
                // Only log non-401 errors
                if (error.response?.status !== 401) {
                    console.error("Error fetching events:", error);
                    setError("Failed to load events. Please try again later.");
                }
            })
            .finally(() => {
                setEventsLoading(false);
            });
    }, []);

    const handleViewEvent = (eventId: number) => {
        const isStudentPage = location.pathname.includes("/student");
        navigate(`${isStudentPage ? "/student" : ""}/event/${eventId}`);
    };

    const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
    
    const currentEvents = events.slice(
        (page - 1) * EVENTS_PER_PAGE,
        page * EVENTS_PER_PAGE
    );

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Determine if we're in a loading state
    const isLoading = authLoading || eventsLoading;

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

                {isLoading && (
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

                {!isLoading && currentEvents.length > 0 && (
                    <>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: "1.25rem",
                                perspective: "1000px",
                                maxWidth: "100%",
                                marginBottom: "2rem"
                            }}
                        >
                            {currentEvents.map((event) => {
                                let followingsAttending: Attendee[] = [];
                                if (
                                    isAuthenticated &&
                                    user &&
                                    user.following &&
                                    event.currentAttendees
                                ) {
                                    followingsAttending = event.currentAttendees.filter((attendee) =>
                                        user.following!.includes(attendee.id)
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
                        
                        {totalPages > 1 && (
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                marginTop: "2rem",
                                marginBottom: "2rem"
                            }}>
                                <Pagination 
                                    count={totalPages} 
                                    page={page} 
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="large"
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            color: colours.grey[100],
                                        },
                                        '& .MuiPaginationItem-page.Mui-selected': {
                                            backgroundColor: isLight ? colours.greenAccent[400] : colours.greenAccent[700],
                                            color: isLight ? colours.primary[900] : colours.primary[100],
                                            fontWeight: 'bold',
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}

                {!isLoading && events.length === 0 && (
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