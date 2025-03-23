import React from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { StyledButton } from "../components/home/StyledButton";
import { tokens } from "../theme/theme";
import { useWebSocketChannel } from "../hooks/useWebSocketChannel";
import { getPopularSocieties } from "../api";
import  SocietyCard  from "../components/SocietyCard";
import {Society} from "../types";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  // WebSocket channel for popular societies
  const {
    data: popularSocieties,
    loading: societiesLoading,
    error: societiesError,
    refresh: refreshSocieties,
  } = useWebSocketChannel("dashboard/popular-societies", getPopularSocieties);

  // WebSocket channel for upcoming events
//   const {
//     data: upcomingEvents,
//     loading: eventsLoading,
//     error: eventsError,
//     refresh: refreshUpcomingEvents,
//   } = useWebSocketChannel("dashboard/upcoming-events", getUpcomingEvents);

  const isLoading = societiesLoading ;

  const handleViewSociety = (id: number) => {
    navigate(`/view-society/${id}`);
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
          // Welcome message in the first slide
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

        {/* Upcoming Events Section
        <Box sx={{ mb: 4 }}>
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
          {isLoading ? (
            <Typography color={colors.grey[100]}>Loading events...</Typography>
          ) : eventsError ? (
            <Typography color="error">{eventsError}</Typography>
          ) : upcomingEvents && upcomingEvents.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 3,
              }}
            >
              {upcomingEvents.map((event: any) => (
                <Box
                  key={event.id}
                  sx={{
                    backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
                    boxShadow: isLight
                      ? "0 4px 12px rgba(0, 0, 0, 0.05)"
                      : "0 4px 12px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: isLight
                        ? "0 12px 24px rgba(0, 0, 0, 0.1)"
                        : "0 12px 24px rgba(0, 0, 0, 0.3)",
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: colors.grey[100],
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      mb: 1.5,
                      minHeight: "3rem",
                    }}
                  >
                    {event.title}
                  </Typography>
                  <Box
                    sx={{
                      height: "120px",
                      backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <Typography sx={{ color: isLight ? colors.grey[800] : colors.grey[100] }}>
                      Event Image
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: colors.grey[200],
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      mb: 2,
                      flexGrow: 1,
                    }}
                  >
                    {event.description || "Join us for an exciting event."}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
                    <StyledButton onClick={() => {/* view event handler */}
                      {/* View
                    </StyledButton>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color={colors.grey[100]}>No upcoming events available.</Typography>
          )}
        </Box> */}

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

        {/* Latest News Section (remains unchanged) */}
        <Box>
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
            Latest News
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 3,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                  border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
                  boxShadow: isLight
                    ? "0 4px 12px rgba(0, 0, 0, 0.05)"
                    : "0 4px 12px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: isLight
                      ? "0 12px 24px rgba(0, 0, 0, 0.1)"
                      : "0 12px 24px rgba(0, 0, 0, 0.3)",
                  },
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: colors.grey[100],
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    mb: 1.5,
                    minHeight: "3rem",
                  }}
                >
                  News Article {i + 1}
                </Typography>
                <Box
                  sx={{
                    height: "120px",
                    backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.5rem",
                  }}
                >
                  <Typography sx={{ color: isLight ? colors.grey[800] : colors.grey[100] }}>
                    News Image
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1.5,
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: isLight ? colors.blueAccent[400] : colors.blueAccent[700],
                      color: "white",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    {new Date().toLocaleDateString()}
                  </span>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      color: colors.grey[200],
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      mb: 2,
                    }}
                  >
                    Stay updated with the latest campus news and developments.
                    Important announcements and updates for all students.
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
                  <StyledButton>View</StyledButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </div>
  );
}
