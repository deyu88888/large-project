import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { CircularProgress } from "@mui/material";
import EventCard from "../../components/EventCard";
import {EventData} from "../../types/event/event.ts";
import {mapToEventData} from "../../utils/mapper.ts";

// Interfaces and Types
interface StyleProps {
  isLight: boolean;
  colours: any;
}

interface HeaderProps {
  styleProps: StyleProps;
}

interface LoadingStateProps {
  styleProps: StyleProps;
}

interface EmptyStateProps {
  styleProps: StyleProps;
}

interface EventsGridProps {
  events: EventData[];
  handleViewEvent: (eventId: number) => void;
  styleProps: StyleProps;
}

// Header Component
const Header: React.FC<HeaderProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <header style={{ textAlign: "center", marginBottom: "2rem" }}>
      <h1
        style={{
          color: colours.grey[100],
          fontSize: "2.25rem",
          fontWeight: 700,
        }}
      >
        My Events
      </h1>
      <p style={{ color: colours.grey[300], fontSize: "1.125rem" }}>
        Events you've RSVP'd to
      </p>
    </header>
  );
};

// Loading State Component
const LoadingState: React.FC<LoadingStateProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <CircularProgress />
      <p style={{ color: colours.grey[300], marginTop: "1rem" }}>
        Loading events...
      </p>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<EmptyStateProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <p style={{ color: colours.grey[300] }}>
        You haven't joined any events yet.
      </p>
    </div>
  );
};

// Events Grid Component
const EventsGrid: React.FC<EventsGridProps> = ({ events, handleViewEvent, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {events.map((event) => (
        <EventCard
          key={event.eventId}
          event={event}
          followingsAttending={[]}
          isLight={isLight}
          colors={colours}
          onViewEvent={handleViewEvent}
        />
      ))}
    </div>
  );
};

// Main Container Component
const MainContainer: React.FC<{
  children: React.ReactNode;
  styleProps: StyleProps;
}> = ({ children, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: isLight ? "#fcfcfc" : colours.primary[500],
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
};

// Content Switcher Component
const ContentSwitcher: React.FC<{
  loading: boolean;
  events: EventData[];
  handleViewEvent: (eventId: number) => void;
  styleProps: StyleProps;
}> = ({ loading, events, handleViewEvent, styleProps }) => {
  if (loading) {
    return <LoadingState styleProps={styleProps} />;
  }
  
  if (events.length === 0) {
    return <EmptyState styleProps={styleProps} />;
  }
  
  return <EventsGrid events={events} handleViewEvent={handleViewEvent} styleProps={styleProps} />;
};

// Data Fetching Function
const useFetchEvents = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      const response = await apiClient.get("/api/events/joined/");
      const mappedEvents = (response.data || []).map(mapToEventData);
      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error fetching joined events:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return { events, loading };
};

// Main Component
const MyJoinedEvents: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const navigate = useNavigate();
  const styleProps = { isLight, colours };
  
  const { events, loading } = useFetchEvents();
  
  const handleViewEvent = (eventId: number) => {
    navigate(`/student/event/${eventId}`);
  };
  
  return (
    <MainContainer styleProps={styleProps}>
      <Header styleProps={styleProps} />
      <ContentSwitcher
        loading={loading}
        events={events}
        handleViewEvent={handleViewEvent}
        styleProps={styleProps}
      />
    </MainContainer>
  );
};

export default MyJoinedEvents;