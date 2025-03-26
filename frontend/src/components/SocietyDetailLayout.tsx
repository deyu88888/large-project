import React from "react";
import { keyframes, useTheme } from "@mui/material/styles";
import Link from "@mui/material/Link";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import { tokens } from "../theme/theme";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useSettingsStore } from "../stores/settings-store";

interface SocietyDetailLayoutProps {
  society: any;
  loading: boolean;
  joined: number | boolean;
  onJoinSociety: (societyId: number) => void;
}

const SocietyDetailLayout: React.FC<SocietyDetailLayoutProps> = ({
  society,
  loading,
  joined,
  onJoinSociety,
}) => {
  const theme = useTheme();
  const { drawer } = useSettingsStore();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const scrollAnimation = keyframes`
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-10%);
    }
  `;

  if (loading) {
    return (
      <p
        style={{
          textAlign: "center",
          fontSize: "1.125rem",
        }}
      >
        Loading society...
      </p>
    );
  }

  let iconSrc: string | undefined;
  if (society?.icon) {
    if (typeof society.icon === "string") {
      iconSrc = society.icon;
    } else if (society.icon instanceof File) {
      iconSrc = URL.createObjectURL(society.icon);
    }
  }

  return (
    <Box
      sx={{
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "30px 50px",
        backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
        maxWidth: drawer ? `calc(90vw - 125px)` : "90vw",
        marginLeft: "auto",
        marginRight: "auto", 
      }}
    >
      <Box
        sx={{
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "0rem" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
            {society?.icon && (
              <img
                src={iconSrc}
                alt={`${society.name} icon`}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  verticalAlign: "middle",
                  marginBottom: "1rem",
                }}
              />
            )}
            
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                fontFamily: "monaco",
              }}
            >
              {society?.name}
            </h1>
          </div>
        </header>

        <p
          style={{
            fontSize: "1rem",
            fontWeight: 400,
            marginBottom: "4rem",
            marginTop: "-1.5rem",
            textAlign: "center",
          }}
        >
          {society?.category}
        </p>
        
        <div
          style={{
            display: "flex",
            gap: "3rem",
          }}
        >
          <div style={{ flex: 1.5 }}>
            <p
              style={{
                fontSize: 20,
                whiteSpace: "pre-wrap",
                marginBottom: "1.5rem",
              }}
            >
              {society?.description}
            </p>
          </div>

          <div style={{ flex: 0.5, fontFamily: "monaco" }}>
            <Box
              sx={{
                border: 3,
                borderColor: "secondary.main",
                borderRadius: 2,
                position: "relative",
                pt: 3,
                px: 2,
                pb: 2,
                mb: 3,
                backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -12,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
                    color: "secondary.main",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  SOCIETY ROLES
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  <strong>President: </strong>
                  <a href={"/student/profile/"+society.president.id}>
                    {society?.president.first_name} {society?.president.last_name}
                  </a>
                </Typography>
                {society?.vice_president && (
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    <strong>Vice President: </strong> 
                    <a href={"/student/profile/"+society.vice_president.id}>
                      {society.vice_president.first_name} {society.vice_president.last_name}
                    </a>
                  </Typography>
                )}
                {society?.event_manager && (
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    <strong>Event Manager: </strong> 
                    <a href={"/student/profile/"+society.event_manager.id}>
                      {society.event_manager.first_name} {society.event_manager.last_name}
                    </a>
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              {joined === 0 && (
                <button
                  onClick={() => onJoinSociety(society.id)}
                  style={{
                    backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
                    color: isLight ? "#ffffff" : colours.grey[100],
                    padding: "0.5rem 1.5rem",
                    borderRadius: "0.5rem",
                    transition: "all 0.2s ease",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Join Society
                </button>
              )}
              {joined === 1 && (
                <button
                  disabled
                  style={{
                    backgroundColor: isLight ? colours.grey[900] : colours.grey[300],
                    color: isLight ? colours.grey[0] : "#ffffff",
                    padding: "0.5rem 1.5rem",
                    borderRadius: "0.5rem",
                    transition: "all 0.2s ease",
                    border: "none",
                    cursor: "not-allowed",
                  }}
                >
                  Request Pending
                </button>
              )}
            </Box>
          </div>
        </div>

        {/* Showreel Images Section */}
        {society?.showreel_images && society.showreel_images.length > 0 && (
          <Box
            sx={{
              overflow: "hidden",
              width: "100%",
              position: "relative",
              mt: 4,
              p: 6,
            }}
          >
            <Typography variant="h3" gutterBottom textAlign="center" padding={2} sx={{ fontWeight: "bold", fontFamily: "monaco" }}>
              Our Society Moments!
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                animation: `${scrollAnimation} 20s linear infinite`,
                width: "max-content",
                gap: 2,
                "&:hover": {
                  animationPlayState: "paused",
                },
              }}
            >
              {[...Array(6).keys()].map((_, index) => (
                <Box key={index} sx={{ display: "inline-flex", gap: 2 }}>
                  {society.showreel_images.map((showreel: any, showreelIndex: number) => (
                    <Paper
                      key={showreelIndex}
                      elevation={2}
                      sx={{
                        p: 1,
                        textAlign: "center",
                        minWidth: 200,
                        transition: "transform 0.3s",
                        backgroundColor: isLight ? colours.primary[500] : colours.primary[500],
                        "&:hover": {
                          transform: "scale(1.05)",
                          zIndex: 10,
                        },
                      }}
                    >
                      <img
                        src={showreel.photo}
                        alt={`Showreel ${showreelIndex + 1}`}
                        style={{
                          width: 200,
                          height: 150,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        {showreel.caption}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Tags and Contact Information */}
        <Divider/>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1.0 }}>
            <p style={{ marginBottom: "1.5rem", fontFamily: "monaco", fontSize: 15 }}>
              {society?.tags?.map((tag: string) => "#" + tag || "No society tags!").join(", ")}
            </p>
            <p style={{ fontSize: 18 }}>
              Contact us:{" "}
              <Link
                href={"mailto:" + society?.president.email}
                style={{
                  color: isLight ? colours.primary[600] : colours.primary[100],
                  textDecoration: "none",
                }}
              >
                {society?.president.email}
              </Link>
            </p>
          </div>
          <div style={{ flex: 1.0 }}>
            {society?.social_media_links["Facebook"] && (
              <Link
                href={society?.social_media_links["Facebook"]}
                target="_blank"
              >
                <FacebookIcon
                  style={{ fontSize: 70, color: isLight ? "black" : "white" }}
                />
              </Link>
            )}
            {society?.social_media_links["Instagram"] && (
              <Link
                href={society?.social_media_links["Instagram"]}
                target="_blank"
              >
                <InstagramIcon
                  style={{ fontSize: 70, color: isLight ? "black" : "white" }}
                />
              </Link>
            )}
            {society?.social_media_links["X"] && (
              <Link href={society?.social_media_links["X"]} target="_blank">
                <XIcon
                  style={{ fontSize: 70, color: isLight ? "black" : "white" }}
                />
              </Link>
            )}
            {society?.social_media_links["WhatsApp"] && (
              <Link href={society?.social_media_links["WhatsApp"]} target="_blank">
                <WhatsAppIcon
                  style={{ fontSize: 70, color: isLight ? "black" : "white" }}
                />
              </Link>
            )}
            {society?.social_media_links["Other"] && (
              <Link href={society?.social_media_links["Other"]} target="_blank">
              <StarOutlineRoundedIcon
                style={{ fontSize: 70, color: isLight ? "black" : "white" }}
              />
            </Link>
            )}
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default SocietyDetailLayout;