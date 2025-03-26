import { Box, Container, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme/theme";
import { useWebSocketChannel } from "../hooks/useWebSocketChannel";
import { getPopularSocieties, getUpcomingEvents } from "../api";
import SocietyCard from "../components/SocietyCard";
import EventCard from "../components/EventCard";
import { Society, Event } from "../types";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useWebSocketManager, CONNECTION_STATES } from "../hooks/useWebSocketManager";

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  // Get WebSocket connection status
  const { status, connect } = useWebSocketManager();
  const prevStatus = useRef(status);

  // Society data from WebSocket
  const {
    data: popularSocieties,
    loading: societiesLoading,
    error: societiesError,
    refresh: refreshSocieties,
  } = useWebSocketChannel("dashboard/popular-societies", getPopularSocieties);

  // Upcoming events data from WebSocket
  const {
    data: upcomingEvents,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents,
  } = useWebSocketChannel("dashboard/upcoming-events", getUpcomingEvents);

  const isLoading = societiesLoading;

  // Initialize WebSocket connection on mount
  useEffect(() => {
    // On mount, if disconnected, connect once
    if (status === CONNECTION_STATES.DISCONNECTED) {
      connect();
    }
    
    // On the first transition to AUTHENTICATED, refresh data
    if (status === CONNECTION_STATES.AUTHENTICATED && prevStatus.current !== CONNECTION_STATES.AUTHENTICATED) {
      refreshSocieties();
      refreshEvents();
    }
    
    prevStatus.current = status;
  }, [status, connect, refreshSocieties, refreshEvents]);

  const handleViewSociety = (id: number): void => {
    navigate(`/view-society/${id}`);
  };

  const handleViewEvent = (id: number): void => {
    navigate(`/event/${id}`);
  };

  const renderEvents = (events: Event[]) => {
    if (!events || events.length === 0) {
      return (
        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", p: 3 }}>
          <Typography color={colors.grey[300]}>
            No upcoming events available
          </Typography>
        </Box>
      );
    }

    return events.map((event: Event) => (
      <EventCard
        key={event.id}
        event={event}
        isLight={isLight}
        colors={colors}
        onViewEvent={handleViewEvent}
        followingsAttending={[]} 
      />
    ));
  };

  const renderSocieties = (societies: Society[]) => {
    if (!societies || societies.length === 0) {
      return (
        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", p: 3 }}>
          <Typography color={colors.grey[300]}>
            No popular societies available
          </Typography>
        </Box>
      );
    }

    return societies.map((society: Society) => (
      <SocietyCard
        key={society.id}
        society={society}
        isLight={isLight}
        colors={colors}
        onViewSociety={handleViewSociety}
      />
    ));
  };

  const renderSectionHeading = (title: string) => (
    <Typography
      variant="h2"
      sx={{
        color: colors.grey[100],
        fontSize: "1.75rem",
        fontWeight: 600,
        paddingBottom: "0.5rem",
        borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`,
        mb: 2,
      }}
    >
      {title}
    </Typography>
  );

  const renderSectionText = (text: string) => (
    <Typography
      variant="body1"
      sx={{
        color: colors.grey[300],
        fontSize: "0.9rem",
        lineHeight: 1.6,
      }}
    >
      {text}
    </Typography>
  );

  const renderEventsSection = () => (
    <Container maxWidth="xl" style={{ padding: "2rem" }}>
      <Box sx={{ mb: 3 }}>
        {renderSectionHeading("Check Our Upcoming Events!")}
        {renderSectionText(
          `Join us for exciting gatherings, workshops, social mixers, and networking opportunities. 
           Our events are designed to connect you with like-minded students and industry professionals.
           Don't miss out on these valuable experiences to enhance your university journey!`
        )}
      </Box>
      {eventsLoading && <p>Loading upcoming events...</p>}
      {eventsError && <p>Error: {eventsError}</p>}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {renderEvents(upcomingEvents)}
      </Box>
    </Container>
  );

  const renderSocietiesSection = () => (
    <Container maxWidth="xl" style={{ padding: "2rem" }}>
      <Box sx={{ mb: 3 }}>
        {renderSectionHeading("Latest Trending Societies!")}
        {renderSectionText(
          `Discover our diverse range of student societies catering to various interests and passions.
           These popular groups offer regular activities, valuable connections, and opportunities to develop new skills.
           Find the perfect community to enhance your university experience and make lasting friendships!`
        )}
      </Box>
      {isLoading && <p>Loading popular societies...</p>}
      {societiesError && <p>Error: {societiesError}</p>}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {renderSocieties(popularSocieties)}
      </Box>
    </Container>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        transition: "all 0.3s ease-in-out",
        overflow: "hidden",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          paddingBottom: 6,
        }}
      >
        {renderEventsSection()}
        {renderSocietiesSection()}
      </Container>
    </div>
  );
}