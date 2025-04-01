import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api";
import { CircularProgress, Typography } from "@mui/material";
import { CommentSection } from "../components/CommentSection";
import useAuthCheck from "../hooks/useAuthCheck";
import { EventDetailLayout } from "../components/EventDetailLayout";
import { ExtraModule, Event, EventData } from "../types/event/event";

const mapModule = (mod: any): ExtraModule => ({
  id: mod.id,
  type: mod.type,
  textValue: mod.text_value,
  fileValue: mod.file_value,
});

const mapToEventData = (event: Event): EventData => ({
  eventId: event.id,
  title: event.title || "",
  mainDescription: event.main_description || "",
  coverImageUrl: event.cover_image || "",
  coverImageFile: null,
  date: event.date || "",
  startTime: event.start_time || "",
  duration: event.duration || "",
  hostedBy: event.hosted_by || 0,
  location: event.location || "TBA",
  maxCapacity: event.max_capacity || 0,
  currentAttendees: event.current_attendees || [],
  extraModules: Array.isArray(event.extra_modules)
    ? event.extra_modules.map(mapModule)
    : [],
  participantModules: Array.isArray(event.participant_modules)
    ? event.participant_modules.map(mapModule)
    : [],
  isParticipant: event.is_participant,
  isMember: event.is_member,
});

const CommentsSectionWrapper: React.FC<{ isAuthenticated: boolean; children: React.ReactNode }> = ({
  isAuthenticated,
  children,
}) => {
  if (!isAuthenticated) {
    return (
      <Typography
        variant="body2"
        color="text.primary"
        align="center"
        marginTop="20px"
        fontSize="14px"
      >
        Please{" "}
        <Link to="/login" style={{ textDecoration: "underline", color: "blue" }}>
          login
        </Link>{" "}
        to view the comments (don't have an account? click{" "}
        <Link to="/register" style={{ textDecoration: "underline", color: "blue" }}>
          here
        </Link>
        )
      </Typography>
    );
  }
  return <>{children}</>;
};

const EventDetailPage: React.FC = () => {
  const { event_id } = useParams();
  const numericEventId = event_id ? parseInt(event_id, 10) : undefined;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthCheck();

  useEffect(() => {
    if (!numericEventId) return;
    setLoading(true);
    apiClient
      .get(`/api/events/${numericEventId}`)
      .then((res) => setEvent(res.data))
      .catch((error) => console.error("Error fetching event:", error))
      .finally(() => setLoading(false));
  }, [numericEventId]);

  const eventData = useMemo(() => {
    return event ? mapToEventData(event) : null;
  }, [event]);

  if (loading) {
    return <CircularProgress style={{ display: "block", margin: "20px auto" }} />;
  }
  if (!eventData) {
    return (
      <Typography variant="h6" align="center">
        Event not found.
      </Typography>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <EventDetailLayout eventData={eventData} />
      <CommentsSectionWrapper isAuthenticated={!!isAuthenticated}>
        <CommentSection eventId={numericEventId as number} />
      </CommentsSectionWrapper>
    </div>
  );
};

export default EventDetailPage;