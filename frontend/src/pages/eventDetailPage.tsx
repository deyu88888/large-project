import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api";
import { CircularProgress, Typography, Card, CardContent } from "@mui/material";
import { format } from "date-fns";
import CommentSection from "../components/CommentSection";
import { Link } from "react-router-dom";

function CommentsSectionWrapper({ isAuthenticated, children }: {
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  if (!isAuthenticated) {
    return (
      <Typography variant="body2" color="text.primary">
        Please{" "}
        <Link to="/login" style={{ textDecoration: "underline", color: "blue" }}>
          login
        </Link>{" "}
        to view the comments (don&apos;t have an account? click{" "}
        <Link to="/register" style={{ textDecoration: "underline", color: "blue" }}>
          here
        </Link>
        )
      </Typography>
    );
  }
  return <>{children}</>;
}

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // get the event detail
  useEffect(() => {
    const fetchEvent = async () => {
      setLoadingEvent(true);
      try {
        const response = await apiClient.get(`/api/event/${eventId}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoadingEvent(false);
      }
    };
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // get all the comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const response = await apiClient.get(`/api/event/${eventId}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };
    if (eventId) {
      fetchComments();
    }
  }, [eventId]);

  // check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get("/api/user/current");
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!eventId) return;
    const wsUrl = `ws://127.0.0.1:8000/ws/event/${eventId}/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "NEW_COMMENT") {
        console.log("Received new comment:", data.payload);
        setComments((prevComments) => [data.payload, ...prevComments]);
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
  }, [eventId]);

  if (loadingEvent) {
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
        <CommentSection
          eventId={eventId}
          comments={comments}
          setComments={setComments}
          loading={loadingComments}
        />
      </CommentsSectionWrapper>
    </div>
  );
};

export default EventDetailPage;
