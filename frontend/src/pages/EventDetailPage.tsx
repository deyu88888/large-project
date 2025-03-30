import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api";
import { CircularProgress, Typography } from "@mui/material";
import { CommentSection } from "../components/CommentSection";
import useAuthCheck from "../hooks/useAuthCheck";
import { EventDetailLayout } from "../components/EventDetailLayout";
import { ExtraModule } from "../components/SortableItem";

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
        to view the comments (don’t have an account? click{" "}
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
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthCheck();
  const [, setComments] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/api/user/current/");
        setUserId(res.data.id);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!numericEventId) return;
      setLoading(true);
      try {
        const eventRes = await apiClient.get(`/api/events/${numericEventId}`);
        setEvent(eventRes.data);
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [numericEventId]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!numericEventId || !isAuthenticated) return;
      try {
        const commentsRes = await apiClient.get(`/api/comments/?event_id=${numericEventId}`);
        setComments(commentsRes.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [numericEventId, isAuthenticated]);

  useEffect(() => {
    if (!numericEventId || !isAuthenticated) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/event/${numericEventId}/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "NEW_COMMENT") {
        setComments((prev) => [data.payload, ...prev]);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [numericEventId, isAuthenticated]);

  if (loading) {
    return <CircularProgress style={{ display: "block", margin: "20px auto" }} />;
  }

  if (!event) {
    return (
      <Typography variant="h6" align="center">
        Event not found.
      </Typography>
    );
  }

  const mapModule = (mod: any): ExtraModule => ({
    id: mod.id,
    type: mod.type,
    textValue: mod.text_value,
    fileValue: mod.file_value,
  });

  const is_participant =
    userId !== null &&
    event.current_attendees &&
    event.current_attendees.some((attendee: any) => attendee.id === userId);

  const is_member = event.is_member;

  const eventData = {
    title: event.title,
    main_description: event.main_description,
    date: event.date,
    start_time: event.start_time,
    duration: event.duration,
    location: event.location || "TBA",
    max_capacity: event.max_capacity,
    cover_image_url: event.cover_image,
    cover_image_file: null,
    extra_modules: (event.extra_modules || []).map(mapModule),
    participant_modules: (event.participant_modules || []).map(mapModule),
    is_participant,
    is_member,
    event_id: event.id,
    hosted_by: event.hosted_by,
    current_attendees: event.current_attendees
  };

  console.log("userId:", userId);
  console.log("event.current_attendees:", event.current_attendees);
  console.log("isParticipant:", is_participant);

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <EventDetailLayout eventData={eventData as any} />
      <CommentsSectionWrapper isAuthenticated={!!isAuthenticated}>
        <CommentSection eventId={numericEventId as number} />
      </CommentsSectionWrapper>
    </div>
  );
};

export default EventDetailPage;