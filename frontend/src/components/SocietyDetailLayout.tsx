import React from "react";
import { useTheme } from "@mui/material/styles";
import Link from "@mui/material/Link";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import { tokens } from "../theme/theme";

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
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

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
    <div
      style={{
        marginLeft: "0px",
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "20px 40px",
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        <header
          style={{
            textAlign: "center",
            marginBottom: "0rem",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            gap: "2rem",
          }}
        >
          {society?.icon && (
            <img
              src={iconSrc}
              alt={`${society.name} icon`}
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                verticalAlign: "middle",
              }}
            />
          )}
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              marginBottom: "0rem",
            }}
          >
            {society?.name}
          </h1>
        </header>
        <div
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 400,
              marginBottom: "2.5rem",
            }}
          >
            {society?.category}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            maxWidth: "100%",
            minHeight: "45.0rem",
          }}
        >
          <div style={{ flex: 2.5 }}>
            <p
              style={{
                fontSize: 20,
                whiteSpace: "pre-wrap",
                marginBottom: "2.5rem",
              }}
            >
              {society?.description}
            </p>
            <p style={{ fontSize: 18 }}>
              <b>Society Roles</b>
            </p>
            <p>
              President: {society?.president.first_name}{" "}
              {society?.president.last_name}
            </p>
            {society?.vice_president && (
              <p>
                Vice President: {society.vice_president.first_name}{" "}
                {society.vice_president.last_name}
              </p>
            )}
            {society?.event_manager && (
              <p>
                Event Manager: {society.event_manager.first_name}{" "}
                {society.event_manager.last_name}
              </p>
            )}
            {society?.treasurer && (
              <p>
                Treasurer: {society.treasurer.first_name}{" "}
                {society.treasurer.last_name}
              </p>
            )}
            {joined === 0 && (
              <button
                onClick={() => onJoinSociety(society.id)}
                style={{
                  backgroundColor: isLight
                    ? colours.blueAccent[400]
                    : colours.blueAccent[500],
                  color: isLight ? "#ffffff" : colours.grey[100],
                  padding: "0.5rem 1.5rem",
                  borderRadius: "0.5rem",
                  transition: "all 0.2s ease",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "2.5rem",
                }}
              >
                Join Society
              </button>
            )}
            {joined === 1 && (
              <button
                disabled
                style={{
                  backgroundColor: isLight
                    ? colours.grey[900]
                    : colours.grey[300],
                  color: isLight ? colours.grey[0] : "#ffffff",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "0.5rem",
                  transition: "all 0.2s ease",
                  border: "none",
                  cursor: "not-allowed",
                  marginTop: "2.5rem",
                }}
              >
                Request Pending
              </button>
            )}

          </div>
          <div style={{ flex: 1.5 }}>
            {society?.showreel_images && society.showreel_images.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginTop: "2rem",
                }}
              >
                {society.showreel_images.map((showreel: any, index: number) => (
                  <div key={index} style={{ textAlign: "center" }}>
                    <img
                      src={showreel.photo}
                      alt={"Showreel " + (index + 1)}
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                    <p style={{ fontSize: "0.9rem", color: "grey" }}>
                      {showreel.caption}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 3.0 }}>
            <p
              style={{
                marginBottom: "1.5rem",
                color: isLight ? colours.grey[600] : colours.grey[300],
              }}
            >
              {society?.tags
                ?.map((tag: string) => "#" + tag || "No society tags!")
                .join(", ")}
            </p>
            <p>
              Contact us:{" "}
              <Link
                href={"mailto:" + society?.president.email}
                style={{ color: isLight ? "black" : "white" }}
              >
                {society?.president.email}
              </Link>
            </p>
          </div>
          <div style={{ flex: 1.0 }}>
            <Link
              href={society?.social_media_links["facebook"]}
              target="_blank"
            >
              <FacebookIcon
                style={{ fontSize: 70, color: isLight ? "black" : "white" }}
              />
            </Link>
            <Link
              href={society?.social_media_links["instagram"]}
              target="_blank"
            >
              <InstagramIcon
                style={{ fontSize: 70, color: isLight ? "black" : "white" }}
              />
            </Link>
            <Link href={society?.social_media_links["x"]} target="_blank">
              <XIcon
                style={{ fontSize: 70, color: isLight ? "black" : "white" }}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocietyDetailLayout;
