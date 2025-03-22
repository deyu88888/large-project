import {
  Box,
  Container,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { StyledButton } from "../components/dashboard/StyledButton";
import { tokens } from "../theme/theme";

export default function Dashboard() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

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
          height: 600,
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
              color: isLight ? colors.blueAccent[400] : colors.blueAccent[500],
            },
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            return (
              <Box 
                key={i} 
                width={1} 
                height={580} 
                sx={{
                  backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Container maxWidth="xl">
                  <Stack padding={2}>
                    <Typography color={colors.grey[100]} variant="h2" align="center">
                      Featured Content {i+1}
                    </Typography>
                    <Typography color={colors.grey[200]} variant="h5" align="center" sx={{ mt: 2 }}>
                      Explore our selection of highlighted events and societies
                    </Typography>
                  </Stack>
                </Container>
              </Box>
            );
          })}
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
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "1rem" }}>
          <Typography
            variant="h1"
            sx={{
              color: colors.grey[100],
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
              transition: "color 0.3s",
            }}
          >
            Welcome to Infinite Loop Innovators
          </Typography>
          <Typography
            sx={{
              color: colors.grey[100],
              fontSize: "1.125rem",
              margin: 0,
              transition: "color 0.3s",
            }}
          >
            Discover societies, events, and latest news all in one place
          </Typography>
        </header>

        {/* Events */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              color: colors.grey[100], 
              fontSize: "1.75rem", 
              fontWeight: 600,
              mb: 3,
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`
            }}
          >
            Upcoming Events
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 3,
            }}
          >
            {[0, 1, 2, 3].map((i) => {
              function handleView(id: any): void {
                throw new Error("Function not implemented.");
              }

              return (
                <Box
                  key={i}
                  sx={{
                    backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
                    boxShadow: isLight ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "0 4px 12px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: isLight ? "0 12px 24px rgba(0, 0, 0, 0.1)" : "0 12px 24px rgba(0, 0, 0, 0.3)",
                    }
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
                    Event Title {i+1}
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
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography 
                    sx={{ 
                      color: colors.grey[200],
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      mb: 2,
                      flexGrow: 1,
                    }}
                  >
                    This is a description of the upcoming event. Join us for an exciting opportunity to network and learn.
                  </Typography>
                  
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
                    <StyledButton onClick={() => handleView(i)}>
                      View
                    </StyledButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Societies */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              color: colors.grey[100], 
              fontSize: "1.75rem", 
              fontWeight: 600,
              mb: 3,
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`
            }}
          >
            Popular Societies
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 3,
            }}
          >
            {[0, 1, 2, 3].map((i) => {
              function handleView(id: any): void {
                throw new Error("Function not implemented.");
              }

              return (
                <Box
                  key={i}
                  sx={{
                    backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
                    boxShadow: isLight ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "0 4px 12px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: isLight ? "0 12px 24px rgba(0, 0, 0, 0.1)" : "0 12px 24px rgba(0, 0, 0, 0.3)",
                    }
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
                    Society Name {i+1}
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
                      Society Image
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    mb: 1.5, 
                    gap: "0.5rem"
                  }}>
                    <span style={{
                      backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
                      color: isLight ? colors.grey[800] : colors.grey[100],
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      display: "inline-block",
                    }}>
                      Category {i+1}
                    </span>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography 
                    sx={{ 
                      color: colors.grey[200],
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      mb: 2,
                      flexGrow: 1,
                    }}
                  >
                    This society is dedicated to providing students with opportunities to explore and develop their interests.
                  </Typography>
                  
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
                    <StyledButton onClick={() => handleView(i)}>
                      View
                    </StyledButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* News */}
        <Box>
          <Typography 
            variant="h2" 
            sx={{ 
              color: colors.grey[100], 
              fontSize: "1.75rem", 
              fontWeight: 600,
              mb: 3,
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`
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
            {[0, 1, 2, 3].map((i) => {
              return (
                <Box
                  key={i}
                  sx={{
                    backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
                    boxShadow: isLight ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "0 4px 12px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: isLight ? "0 12px 24px rgba(0, 0, 0, 0.1)" : "0 12px 24px rgba(0, 0, 0, 0.3)",
                    }
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
                    News Article {i+1}
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
                  
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    mb: 1.5, 
                    gap: "0.5rem"
                  }}>
                    <span style={{
                      backgroundColor: isLight ? colors.blueAccent[400] : colors.blueAccent[700],
                      color: "white",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      display: "inline-block",
                    }}>
                      {new Date().toLocaleDateString()}
                    </span>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography 
                    sx={{ 
                      color: colors.grey[200],
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      mb: 2,
                      flexGrow: 1,
                    }}
                  >
                    Stay updated with the latest campus news and developments. Important announcements and updates for all students.
                  </Typography>
                  
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
                    <StyledButton>
                      View
                    </StyledButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Container>
    </div>
  );
}