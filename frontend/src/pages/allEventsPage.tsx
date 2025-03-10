import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import {
    CircularProgress,
    Card,
    CardContent,
    Typography,
    Avatar,
} from "@mui/material";
import { format } from "date-fns";
import { useAuthStore } from "../stores/auth-store";

interface Attendee {
    id: number;
    first_name: string;
    icon?: string | null;
}

interface EventData {
    id: number;
    title: string;
    date: string;
    location: string;
    current_attendees?: Attendee[];
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    following?: number[];
}

export default function AllEventsPage() {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();

    const [currentUser, setCurrentUser] = useState<User | null>(user);
    const [events, setEvents] = useState<EventData[]>([]);
    const [userLoading, setUserLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);

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
        apiClient
            .get("/api/all-events")
            .then((res) => {
                console.log("Fetched Events:", res.data);
                setEvents(res.data || []);
            })
            .catch((error) => {
                console.error("Error fetching events:", error);
            })
            .finally(() => {
                setEventsLoading(false);
            });
    }, []);

    if (eventsLoading) {
        return (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
                <CircularProgress />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
                <Typography variant="h4" align="center" gutterBottom>
                    All Events
                </Typography>
                <Typography variant="h6" align="center" color="textSecondary">
                    No events available at the moment.
                </Typography>
            </div>
        );
    }

    return (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
            <Typography variant="h4" align="center" gutterBottom>
                All Events
            </Typography>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "20px",
                }}
            >
                {events.map((event) => {
                    let followingsAttending: Attendee[] = [];
                    if (
                        !userLoading &&
                        currentUser &&
                        currentUser.following &&
                        event.current_attendees
                    ) {
                        followingsAttending = event.current_attendees.filter((attendee) =>
                            currentUser.following!.includes(attendee.id)
                        );
                    }

                    return (
                        <Card
                            key={event.id}
                            style={{ padding: "20px", cursor: "pointer", width: "100%" }}
                            onClick={() => navigate(`/event/${event.id}`)}
                        >
                            <CardContent>
                                <Typography variant="h6">{event.title}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Date: {format(new Date(event.date), "dd/MM/yyyy")}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Location: {event.location || "TBA"}
                                </Typography>

                                {followingsAttending.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginTop: "10px",
                                            gap: "8px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            {followingsAttending.slice(0, 3).map((att, index) => (
                                                <Avatar
                                                    key={att.id}
                                                    src={att.icon || ""}
                                                    alt={att.first_name}
                                                    sx={{
                                                        width: index === 0 ? 40 : 25,
                                                        height: index === 0 ? 40 : 25,
                                                        marginLeft: index > 0 ? -1 : 0,
                                                        border: "2px solid white",
                                                        zIndex: followingsAttending.length - index,
                                                    }}
                                                />
                                            ))}
                                            {followingsAttending.length > 3 && (
                                                <span style={{ marginLeft: 4 }}>
                                                    +{followingsAttending.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        <Typography variant="body2" color="textSecondary">
                                            {followingsAttending[0].first_name + " "}
                                            {followingsAttending.length > 1 &&
                                                ` and ${followingsAttending.length - 1} more following `}
                                            also attended this event
                                        </Typography>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
