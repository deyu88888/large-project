import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api";
import { CircularProgress, Typography, Card, CardContent } from "@mui/material";
import { format } from "date-fns";
import { CommentSection } from "../components/CommentSection";

function isUserAuthenticated(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
}

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
  const { eventId } = useParams();
  const numericEventId = eventId ? parseInt(eventId, 10) : undefined;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated] = useState<boolean>(isUserAuthenticated());
  // const isAuthenticated = Boolean(localStorage.getItem("token"));
  const [, setComments] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!numericEventId) return;
      setLoading(true);
      try {
        const eventRes = await apiClient.get(`/api/event/${numericEventId}`);
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

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <Typography variant="h4" align="center" gutterBottom>
        {event.title}
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            <strong>Description:</strong> {event.description}
          </Typography>
          <Typography variant="body1">
            <strong>Date:</strong> {format(new Date(event.date), "yyyy-MM-dd")}
          </Typography>
          <Typography variant="body1">
            <strong>Time:</strong> {event.start_time}
          </Typography>
          <Typography variant="body1">
            <strong>Location:</strong> {event.location || "TBA"}
          </Typography>
        </CardContent>
      </Card>

      <CommentsSectionWrapper isAuthenticated={isAuthenticated}>
        <CommentSection eventId={numericEventId as number} />
      </CommentsSectionWrapper>
    </div>
  );
};

export default EventDetailPage;
