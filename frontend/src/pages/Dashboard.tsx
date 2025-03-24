import React from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { StyledButton } from "../components/home/StyledButton";
import { tokens } from "../theme/theme";
import { useWebSocketChannel } from "../hooks/useWebSocketChannel";
import { getPopularSocieties, getUpcomingEvents } from "../api";
import  SocietyCard  from "../components/SocietyCard";
import  EventCard  from "../components/EventCard";
import { Society, Event } from "../types";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const {
    data: popularSocieties,
    loading: societiesLoading,
    error: societiesError,
    refresh: refreshSocieties,
  } = useWebSocketChannel("dashboard/popular-societies", getPopularSocieties);

  const {
    data: upcomingEvents,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents,
  } = useWebSocketChannel("dashboard/upcoming-events", getUpcomingEvents);

  const isLoading = societiesLoading ;

  const handleViewSociety = (id: number) => {
    navigate(`/view-society/${id}`);
  };

  const handleViewEvent = (id: number) => {
    navigate(`/event/${id}`);
  };
  
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        transition: "all 0.3s ease-in-out",
        overflow: "hidden",
      }}
    >
      {/* Slider */}
      <Box
        sx={{
          overflow: "hidden",
          position: "relative",
          backgroundColor: "transparent",
          height: 500,
          marginBottom: 4,
        }}
      >
        <Carousel
          NextIcon={<div>{">"}</div>}
          PrevIcon={<div>{"<"}</div>}
          navButtonsProps={{
            style: {
              backgroundColor: isLight ? colors.blueAccent[400] : colors.blueAccent[500],
              color: "#ffffff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
            },
          }}
          indicatorContainerProps={{
            style: {
              marginTop: 0,
              position: "absolute",
              bottom: "20px",
              zIndex: 1,
            },
          }}
          activeIndicatorIconButtonProps={{
            style: {
              color: isLight ? colors.greenAccent[400] : colors.greenAccent[400],
            },
          }}
          animation="slide"
          duration={600}
        >
          {[0, 1, 2, 3].map((i) => (
  <Box
    key={i}
    width={1}
    height={500}
    sx={{
      backgroundColor: isLight
        ? theme.palette.primary.main
        : theme.palette.primary.dark,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Container maxWidth="xl">
      <Box padding={2}>
        {i === 0 ? (
          <>
            <Typography color={colors.grey[100]} variant="h1" align="center" sx={{ fontWeight: 700 }}>
              Welcome to Infinite Loop Innovators
            </Typography>
            <Typography
              color={colors.grey[200]}
              variant="h5"
              align="center"
              sx={{ mt: 2 }}
            >
              Discover societies, events, and latest news all in one place
            </Typography>
          </>
        ) : (
          // Original content for other slides
          <>
            <Typography color={colors.grey[100]} variant="h2" align="center">
              Featured Content {i}
            </Typography>
            <Typography
              color={colors.grey[200]}
              variant="h5"
              align="center"
              sx={{ mt: 2 }}
            >
              Explore our selection of highlighted events and societies
            </Typography>
          </>
        )}
      </Box>
    </Container>
  </Box>
))}
        </Carousel>
      </Box>

      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          paddingBottom: 6,
        }}
      >

<Container maxWidth="xl" style={{ padding: "2rem" }}>
          <Typography 
            variant="h2" 
            sx={{
              color: colors.grey[100],
              fontSize: "1.75rem",
              fontWeight: 600,
              mb: 3,
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`,
            }}
          >
            Upcoming Events
          </Typography>
          {eventsLoading && <p>Loading upcoming events...</p>}
          {eventsError && <p>Error: {eventsError}</p>}
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 4).map((event: Event) => (
                <EventCard 
                  key={event.id}
                  event={event}
                  isLight={isLight}
                  colors={colors}
                  onViewEvent={handleViewEvent} followingsAttending={[]}                />
              ))
            ) : (
              <Box sx={{ gridColumn: "1 / -1", textAlign: "center", p: 3 }}>
                <Typography color={colors.grey[300]}>
                  No upcoming events available
                </Typography>
              </Box>
            )}
            </Box>
        </Container>


        {/* Popular Societies Section */}
        <Container maxWidth="xl" style={{ padding: "2rem" }}>
            <Typography variant="h2" style={{ marginBottom: "1rem" }}>
                Popular Societies
            </Typography>
            {isLoading && <p>Loading popular societies...</p>}
            {societiesError && <p>Error: {societiesError}</p>}
            <Box
                style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "1rem",
                }}
            >
                {popularSocieties &&
                popularSocieties.slice(0,4).map((society: Society) => (
                    <SocietyCard
                    key={society.id}
                    society={society}
                    isLight={isLight}
                    colors={colors}
                    onViewSociety={handleViewSociety}
                    />
                ))}
            </Box>
            </Container>
      </Container>
    </div>
  );
}
