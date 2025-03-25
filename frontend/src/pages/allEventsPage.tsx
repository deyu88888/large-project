// TODO: come back to separate the interfaces
// TODO: one error remaining

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";
import { CircularProgress } from "@mui/material";
import EventCard from "../components/EventCard";
import { useAuthStore } from "../stores/auth-store";
import { User } from "../types/user/user";
import { AxiosResponse } from "axios";
import { Attendee, EventData } from "../types/student/event";
import { ApiError } from "../types/api/apierror";

// interface Attendee {
//     id: number;
//     first_name: string;
//     icon?: string | null;
// }

// interface EventData {
//     id: number;
//     title: string;
//     date: string;
//     location: string;
//     description: string;
//     startTime: string;
//     duration: number;
//     hostedBy: string;
//     current_attendees?: Attendee[];
// }

// interface User {
//     id: number;
//     first_name: string;
//     last_name: string;
//     username: string;
//     email: string;
//     role: string;
//     is_active: boolean;
//     following?: number[];
// }

// interface ApiResponse<T> {
//     data: T;
//     status: number;
//     statusText: string;
//     headers: Record<string, string>;
//     config: Record<string, unknown>;
// }

// interface ApiError {
//     response?: {
//         status: number;
//         data: unknown;
//     };
//     message: string;
// }

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

    const fetchCurrentUser = async (): Promise<void> => {
        try {
          const user = await apiClient.get<User>("/api/user/current");
          handleUserFetchSuccess(user);
        } catch (error) {
          handleUserFetchError(error as ApiError);
        } finally {
          completeUserLoading();
        }
      };

    const handleUserFetchSuccess = (res: AxiosResponse<User>): void => {
        setCurrentUser(res.data);
        if (setUser) {
            setUser(res.data);
        }
    };

    const handleUserFetchError = (err: ApiError): void => {
        if (err.response?.status === 401) {
            console.log("User not logged in, that's okay.");
            return;
        }
        
        console.error("Error fetching current user:", err);
        setError("Failed to fetch user information.");
    };

    const completeUserLoading = (): void => {
        setUserLoading(false);
    };

    const setUserFromStore = (): void => {
        setCurrentUser(user);
        setUserLoading(false);
    };

    // User effect
    useEffect(() => {
        if (!user) {
            fetchCurrentUser();
            return;
        }
        
        setUserFromStore();
    },[fetchCurrentUser, setUserFromStore, user]);

    // const fetchAllEvents = (): void => {
    //     setEventsLoading(true);
    //     setError(null);
        
    //     apiClient
    //         .get<EventData[]>("/api/events/all/")
    //         .then(handleEventsFetchSuccess)
    //         .catch(handleEventsFetchError)
    //         .finally(completeEventsLoading);
    // };
    const fetchAllEvents = async (): Promise<void> => {
        setEventsLoading(true);
        setError(null);
        
        try {
            const events = await apiClient.get<EventData[]>("/api/events/all/");
            handleEventsFetchSuccess(events);
        } catch (error) {
            handleEventsFetchError(error as ApiError);
        } finally {
            completeEventsLoading();
        }
    };

    const handleEventsFetchSuccess = (res: AxiosResponse<EventData[]>): void => {
        console.log("Fetched Events:", res.data);
        setEvents(res.data || []);
    };

    const handleEventsFetchError = (error: ApiError): void => {
        console.error("Error fetching events:", error);
        setError("Failed to load events. Please try again later.");
    };

    const completeEventsLoading = (): void => {
        setEventsLoading(false);
    };

    // Events effect
    useEffect(() => {
        fetchAllEvents();
    }, []);

    const handleViewEvent = (eventId: number): void => {
        console.log("Viewing event:", eventId);
        navigate(`/event/${eventId}`);
    };

    const getFollowingsAttending = (event: EventData): Attendee[] => {
        if (!currentUser?.following || !event.current_attendees || userLoading) {
            return [];
        }
        const followingIds = currentUser.following.map(following => following.id);
        
        return event.current_attendees.filter(
            attendee => followingIds.includes(attendee.id) ?? false
        );
    };

    const renderEventCards = () => (
        events.map(event => {
            const followingsAttending = getFollowingsAttending(event);

            return (
                <EventCard
                    key={event.id}
                    event={event}
                    followingsAttending={followingsAttending}
                    isLight={isLight}
                    colors={colours}
                    onViewEvent={handleViewEvent}
                />
            );
        })
    );

    // Render container styles
    const containerStyle = {
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        transition: "all 0.3s ease-in-out",
        overflow: "hidden",
    };

    // Render content container styles
    const contentContainerStyle = { 
        maxWidth: "1400px", 
        margin: "0 auto" 
    };

    // Render header styles
    const headerStyle: React.CSSProperties = { 
        textAlign: "center", 
        marginBottom: "2.5rem" 
    };

    // Render title styles
    const titleStyle = {
        color: colours.grey[100],
        fontSize: "2.5rem",
        fontWeight: 700,
        marginBottom: "0.75rem",
        transition: "color 0.3s",
    };

    // Render subtitle styles
    const subtitleStyle = {
        color: colours.grey[100],
        fontSize: "1.125rem",
        margin: 0,
        transition: "color 0.3s",
    };

    // Render error styles
    const errorStyle: React.CSSProperties = {
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
    };

    // Render loading styles
    const loadingContainerStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem"
    };

    // Render loading text styles
    const loadingTextStyle = {
        color: colours.grey[100],
        fontSize: "1.2rem",
        marginLeft: "1rem"
    };

    // Render events grid styles
    const eventsGridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.25rem",
        perspective: "1000px",
        maxWidth: "100%"
    };

    // Render no events container styles
    const noEventsContainerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        backgroundColor: isLight ? colours.primary[400] : colours.primary[700],
        borderRadius: "1rem",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    };

    // Render no events icon styles
    const noEventsIconStyle = {
        fontSize: "3rem",
        marginBottom: "1rem",
    };

    // Render no events title styles
    const noEventsTitleStyle = {
        color: isLight ? colours.grey[200] : colours.grey[300],
        fontSize: "1.25rem",
        fontWeight: "500",
        textAlign: "center",
    };

    // Render no events description styles
    const noEventsDescriptionStyle = {
        color: isLight ? colours.grey[300] : colours.grey[400],
        fontSize: "1rem",
        textAlign: "center",
        maxWidth: "400px",
        marginTop: "0.5rem",
    };

    const renderErrorMessage = () => {
        if (!error) return null;
        
        return (
            <div style={errorStyle}>
                <span style={{ marginRight: "0.5rem" }}>⚠️</span>
                {error}
            </div>
        );
    };

    const renderLoadingState = () => {
        if (!eventsLoading) return null;
        
        return (
            <div style={loadingContainerStyle}>
                <CircularProgress />
                <div style={loadingTextStyle}>
                    Loading events...
                </div>
            </div>
        );
    };

    const renderEventsGrid = () => {
        if (eventsLoading || events.length === 0) return null;
        
        return (
            <div style={eventsGridStyle}>
                {renderEventCards()}
            </div>
        );
    };

    const renderEmptyState = () => {
        if (eventsLoading || events.length > 0) return null;
        
        return (
            <div style={noEventsContainerStyle as React.CSSProperties}>
                <div style={noEventsIconStyle}>
                    🗓️
                </div>
                <p style={noEventsTitleStyle as React.CSSProperties}>
                    No events available at the moment.
                </p>
                <p style={noEventsDescriptionStyle as React.CSSProperties}>
                    Please check back later for updates.
                </p>
            </div>
        );
    };

    const renderAnimationKeyframes = () => (
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
    );

    const renderHeader = () => (
        <header style={headerStyle}>
            <h1 style={titleStyle}>
                Explore Campus Events
            </h1>
            <p style={subtitleStyle}>
                Discover upcoming events and activities
            </p>
        </header>
    );

    const renderContent = () => (
        <div style={contentContainerStyle}>
            {renderHeader()}
            {renderErrorMessage()}
            {renderLoadingState()}
            {renderEventsGrid()}
            {renderEmptyState()}
        </div>
    );

    return (
        <div style={containerStyle}>
            {renderContent()}
            {renderAnimationKeyframes()}
        </div>
    );
}