import { Box, Breadcrumbs, Container, Link, Typography, useTheme } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { tokens } from "../../theme/theme";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export default function HeroSection({ showCarousel = false, title, subtitle, breadcrumbs }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  
  const renderContent = (customTitle: any, customSubtitle: any) => (
    <Box padding={2} sx={{ textAlign: "left", pl: { xs: 2, md: 4 } }}>
      <Typography 
        color={theme.palette.mode === "dark" ? "greenAccent.main" : "greenAccent.dark"} 
        variant="h1" 
        align="left" 
        sx={{ 
          fontWeight: 700,
          fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
          maxWidth: "800px"
        }}
      >
        {customTitle}
      </Typography>
      <Typography
        color={ colors.grey[100] }
        variant="h6"
        align="left"
        sx={{ 
          mt: 2,
          fontSize: { xs: "1.0rem", sm: "1.0rem", md: "1.0rem" },
          maxWidth: "700px"
        }}
      >
        {customSubtitle}
      </Typography>
    </Box>
  );
  
  return (
    <Box
      sx={{
        overflow: "hidden",
        position: "relative",
        backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
        height: 400,
        marginBottom: 4,
      }}
    >
      {showCarousel ? (
        <Carousel
          NextIcon={<div>{">"}</div>}
          PrevIcon={<div>{"<"}</div>}
          navButtonsProps={{
            style: {
              backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
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
              height={400}
              sx={{
                backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Container maxWidth="xl">
              {i === 0 &&
                renderContent(
                  "Welcome to Infinite Loop Innovators",
                  "Explore a hub of vibrant student societies, exciting events, and real-time campus happenings."
                )}
              {i === 1 &&
                renderContent(
                  "Find Your People, Join Their Societies",
                  "See what your friends are part of and jump into the events and communities they love!"
                )}
              {i === 2 &&
                renderContent(
                  "Upcoming Events You Can’t Miss",
                  "Mark your calendar! Keynotes, hackathons, and game nights are just around the corner."
                )}
              {i === 3 &&
                renderContent(
                  "Start Your Own Society",
                  "Got an idea? Launch your own student society in just a few clicks. We’ll help you grow it."
                )}
              </Container>
            </Box>
          ))}
        </Carousel>
      ) : (
        <Box
          width={1}
          height="100%"
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Container maxWidth="xl">
            {breadcrumbs && (
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mb: 2, color: colors.grey[200] , ml:4}}
              >
                {breadcrumbs.map((item, index) =>
                  item.href ? (
                    <Link key={index} underline="hover" color="inherit" href={item.href}>
                      {item.label}
                    </Link>
                  ) : (
                    <Typography key={index} color="text.primary">
                      {item.label}
                    </Typography>
                  )
                )}
              </Breadcrumbs>
            )}
            {renderContent(title, subtitle)}
          </Container>
        </Box>
      )}
    </Box>
  );
}