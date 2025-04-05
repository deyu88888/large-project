import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  useTheme,
  alpha,
  Grid,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";

const APP_VERSION = import.meta.env.VITE_API_URL || "1.0.0";

export const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor:
          theme.palette.mode === "dark" ? "secondary.dark" : "secondary.light",
        color: "white",
        pt: 8,
        pb: 4,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.light})`,
        },
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid
            size={{
              xs: 12,
              md: 6,
              lg: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {/* Infinity Logo */}
              <Box
                sx={{
                  mr: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 8px ${alpha(
                    theme.palette.common.black,
                    0.25
                  )}`,
                  width: 40,
                  height: 40,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    d="M18.6,6.62C17.16,6.62 15.8,7.18 14.83,8.15L7.8,14.39C7.16,15.03 6.31,15.38 5.4,15.38C3.53,15.38 2,13.87 2,12C2,10.13 3.53,8.62 5.4,8.62C6.31,8.62 7.16,8.97 7.84,9.65L8.97,10.65L10.5,9.31L9.22,8.2C8.2,7.18 6.84,6.62 5.4,6.62C2.42,6.62 0,9.04 0,12C0,14.96 2.42,17.38 5.4,17.38C6.84,17.38 8.2,16.82 9.17,15.85L16.2,9.61C16.84,8.97 17.69,8.62 18.6,8.62C20.47,8.62 22,10.13 22,12C22,13.87 20.47,15.38 18.6,15.38C17.7,15.38 16.84,15.03 16.16,14.35L15,13.34L13.5,14.68L14.78,15.8C15.8,16.81 17.15,17.37 18.6,17.37C21.58,17.37 24,14.96 24,12C24,9.04 21.58,6.62 18.6,6.62Z"
                    fill="white"
                  />
                </svg>
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, letterSpacing: 0.5 }}
              >
                Infinite Loop Innovators
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                opacity: 0.85,
                maxWidth: "90%",
                lineHeight: 1.6,
              }}
            >
              Driving innovation through collaborative solutions and
              cutting-edge technology.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                color="inherit"
                aria-label="Email"
                onClick={() => {
                  window.location.href = "mailto:infiniteloop@gmail.com";
                }}
                sx={{
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    transform: "translateY(-2px)",
                    transition: "transform 0.2s ease-in-out",
                  },
                }}
              >
                <EmailIcon />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="LinkedIn"
                onClick={() =>
                  window.open(
                    "https://uk.linkedin.com",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                sx={{
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    transform: "translateY(-2px)",
                    transition: "transform 0.2s ease-in-out",
                  },
                }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="GitHub"
                onClick={() =>
                  window.open(
                    "https://github.com/deyu88888/large-project",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                sx={{
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    transform: "translateY(-2px)",
                    transition: "transform 0.2s ease-in-out",
                  },
                }}
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Links Section */}
          <Grid
            size={{
              xs: 12,
              md: 6,
              lg: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 500,
                position: "relative",
                display: "inline-block",
              }}
            >
              Quick Links
              <Box
                sx={{
                  position: "absolute",
                  bottom: -4,
                  left: 0,
                  width: 40,
                  height: 2,
                  backgroundColor: theme.palette.primary.main,
                }}
              />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {["Home", "Discover", "Societies", "Events", "Contact"].map(
                (item) => (
                  <Link
                    key={item}
                    href="#"
                    color="inherit"
                    underline="none"
                    sx={{
                      mb: 1.5,
                      opacity: 0.9,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        opacity: 1,
                        pl: 0.5,
                        color: theme.palette.primary.light,
                      },
                    }}
                  >
                    {item}
                  </Link>
                )
              )}
            </Box>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
              lg: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 500,
                position: "relative",
                display: "inline-block",
              }}
            >
              Resources
              <Box
                sx={{
                  position: "absolute",
                  bottom: -4,
                  left: 0,
                  width: 40,
                  height: 2,
                  backgroundColor: theme.palette.primary.main,
                }}
              />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {["FAQ", "Support", "Privacy Policy", "Terms of Service"].map(
                (item) => (
                  <Link
                    key={item}
                    href="#"
                    color="inherit"
                    underline="none"
                    sx={{
                      mb: 1.5,
                      opacity: 0.9,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        opacity: 1,
                        pl: 0.5,
                        color: theme.palette.primary.light,
                      },
                    }}
                  >
                    {item}
                  </Link>
                )
              )}
            </Box>
          </Grid>

          {/* Contact Section */}
          <Grid
            size={{
              xs: 12,
              md: 6,
              lg: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 500,
                position: "relative",
                display: "inline-block",
              }}
            >
              Contact Us
              <Box
                sx={{
                  position: "absolute",
                  bottom: -4,
                  left: 0,
                  width: 40,
                  height: 2,
                  backgroundColor: theme.palette.primary.main,
                }}
              />
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.common.white, 0.05),
                backdropFilter: "blur(8px)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ mb: 1.5, display: "flex", alignItems: "flex-start" }}
              >
                <LocationOnIcon
                  sx={{ mr: 1, opacity: 0.7, fontSize: "1.2rem", mt: 0.2 }}
                />
                <span>
                  King's College London
                  <br />
                  Strand Campus
                  <br />
                  Strand, London WC2R 2LS
                  <br />
                  United Kingdom
                </span>
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 1.5, display: "flex", alignItems: "center" }}
              >
                <EmailIcon sx={{ mr: 1, opacity: 0.7, fontSize: "1.2rem" }} />
                <Link
                  href="mailto:infiniteloop@gmail.com"
                  color="inherit"
                  underline="hover"
                  sx={{
                    transition: "color 0.2s ease",
                    "&:hover": { color: theme.palette.primary.light },
                  }}
                >
                  infiniteloop@gmail.com
                </Link>
              </Typography>
              <Typography
                variant="body2"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <PhoneIcon sx={{ mr: 1, opacity: 0.7, fontSize: "1.2rem" }} />
                <Link
                  href="tel:+44-20-7836-5454"
                  color="inherit"
                  underline="hover"
                  sx={{
                    transition: "color 0.2s ease",
                    "&:hover": { color: theme.palette.primary.light },
                  }}
                >
                  +44 746 667 1117
                </Link>
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright Section */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{ opacity: 0.7, fontSize: "0.875rem" }}
          >
            © {currentYear} Infinite Loop Innovators. All rights reserved. {APP_VERSION}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
