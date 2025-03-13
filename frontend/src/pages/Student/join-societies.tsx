import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";

// Import the theme
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableSocieties = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/join-society");
        console.log("Response:", response);
        setSocieties(response.data);
      } catch (error) {
        console.error("Error fetching societies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableSocieties();
  }, []);

  const handleViewSociety = async (societyId: number) => {
    try {
      navigate("/student/view-society/"+societyId);
    }
    catch (error) {
      console.error("Error viewing society:", error);
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
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        <header
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            padding: "2rem 0",
          }}
        >
          <h1
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "2.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Join a Society
          </h1>
          <p
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "1.125rem",
              margin: 0,
            }}
          >
            Discover new societies and connect with your peers!
          </p>
        </header>

        {loading ? (
          <p
            style={{
              color: isLight ? colours.grey[700] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            Loading societies...
          </p>
        ) : societies.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "2rem",
              padding: "1rem 0",
            }}
          >
            {societies.map((society) => (
              <div
                key={society.id}
                style={{
                  backgroundColor: isLight ? colours.primary[400] : colours.primary[400],
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
              >
                <h3
                  style={{
                    color: isLight ? colours.grey[100] : colours.grey[100],
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <img
                      src={"http://localhost:8000/api" + society.icon}
                      alt={`${society.name} icon`}
                      style={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%",
                        verticalAlign: "middle",
                      }}
                    />
                    {society.name}
                  </div>
                </h3>
                <p
                  style={{
                    color: isLight ? colours.grey[300] : colours.grey[300],
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    marginBottom: "1.25rem",
                  }}
                >
                  {society.description
                    ? society.description.length > 160
                      ? society.description.slice(0, 160) + "..."
                      : society.description
                    : "No description available."}
                </p>
                <button
                  onClick={() => handleViewSociety(society.id)}
                  style={{
                    backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
                    color: isLight ? "#ffffff" : colours.grey[100],
                    padding: "0.5rem 1.5rem",
                    borderRadius: "0.5rem",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    marginLeft: "5.0rem",
                  }}
                >
                  View Society
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: isLight ? colours.grey[600] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            No societies available to join.
          </p>
        )}
      </div>
    </div>
  );
};

export default JoinSocieties;
