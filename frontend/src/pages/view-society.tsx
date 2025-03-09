import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api";


// Import the theme
import { useTheme } from "@mui/material/styles";
import Link from "@mui/material/Link";
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import { tokens } from "../theme/theme";

const ViewSociety: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [society, setSociety] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(true)

  const { society_id } = useParams<{ society_id: string }>();

  useEffect(() => {
    const fetchSocietyData = async (societyId : number) => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/society-view/" + societyId);
        setSociety(response.data);
        setJoined(response.data.is_member)
        /*console.log("Society data: ", response);*/
      } catch (error) {
        console.error("Error retrieving society:", error);
        alert("Failed to load society. Please try again.");
      } finally {
        setLoading(false);
      }
    };  
  fetchSocietyData(Number(society_id));
  }, [society_id]);

  const handleJoinSociety = async (societyId: number) => {
    try {
      await apiClient.post("/api/join-society/" + societyId);
      setJoined(true)
      alert("Successfully joined the society!");
    } catch (error) {
      console.error("Error joining society:", error);
      alert("Failed to join the society. Please try again.");
    }
  };

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
        {loading ? (
          <p
            style={{
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            Loading society...
          </p>
        ) : (
          <>
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
          {society.icon && (
            <img
            src={"http://localhost:8000/api" + society.icon}
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
            {society.name}
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
            {society.category}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            maxWidth: "100%",
            minHeight: "45.0rem"
          }}
        >
        <div style={{flex: 2.5}}>
          <p 
            style={{
              fontSize: 20,
              whiteSpace: "pre-wrap",
              marginBottom: "2.5rem"
            }}
          >
            {society.description}
          </p>
          <p style={{fontSize: 18}}>
            <b>Society Roles</b>
          </p>
          {society.vice_president && (
            <p>
              Vice President: {society.vice_president.first_name} {society.vice_president.last_name}
            </p>
          )}
          {society.event_manager && (
            <p>
              Event Manager: {society.event_manager.first_name} {society.event_manager.last_name}
            </p>
          )}
          {society.treasurer && (
            <p>
              Treasurer: {society.treasurer.first_name} {society.treasurer.last_name}
            </p>
          )}
          {!joined && (<button
            onClick={() => handleJoinSociety(society.id)}
            style={{
              backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
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
          </button>)}
        </div>
        <div style={{flex: 1.5}}>
          {society.showreel_images && society.showreel_images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
              {society.showreel_images.map((showreel: any, index: number) => (
                <div key={index} style={{ textAlign: "center" }}>
                  <img
                    src={"http://localhost:8000/api" + showreel.photo}
                    alt={"Showreel " + (index + 1)}
                    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
                  />
                  <p style={{ fontSize: "0.9rem", color: "grey" }}>{showreel.caption}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        <div style={{display: "flex"}}>
          <div style={{flex: 3.0}}>
            <p style={{marginBottom: "1.5rem", color: isLight ? colours.grey[600] : colours.grey[300]}}>
              {society.tags?.map((tag: string) => "#" + tag || "No society tags!").join(", ")}
            </p>
            <p>Contact us: <Link 
              href={"mailto:" + society.leader.email}
              style={{color: isLight ? "black" : "white"}}
            >
              {society.leader.email}
            </Link></p>
          </div>
          <div style={{flex: 1.0}}>
            <Link 
              href={society.social_media_links["facebook"]}
              target="_blank"
            >
              <FacebookIcon style={{fontSize: 70, color: isLight ? "black" : "white"}}/>
            </Link>
            <Link 
              href={society.social_media_links["instagram"]}
              target="_blank"
            >
              <InstagramIcon style={{fontSize: 70, color: isLight ? "black" : "white"}}/>
            </Link>
            <Link 
              href={society.social_media_links["x"]}
              target="_blank"
            >
              <XIcon style={{fontSize: 70, color: isLight ? "black" : "white"}}/>
            </Link>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ViewSociety;