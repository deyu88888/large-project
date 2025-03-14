import React, { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

const MySocieties: React.FC = () => {
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/student-societies");
        setSocieties(response.data || []);
      } catch (error) {
        console.error("Error fetching societies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSocieties();
  }, []);

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
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "2.25rem",
              fontWeight: 800,
              margin: 0,
            }}
          >
            My Societies
          </h1>
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
        ) : societies.length === 0 ? (
          <p
            style={{
              color: isLight ? colours.grey[600] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            You haven't joined any societies yet.
          </p>
        ) : (
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
                  backgroundColor: isLight
                    ? colours.primary[400]
                    : colours.primary[400],
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: `1px solid ${
                    isLight ? colours.grey[300] : colours.grey[700]
                  }`,
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
              >
                <h3
                  style={{
                    color: isLight ? colours.grey[100] : colours.grey[100],
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {society.name}
                </h3>
                <p
                  style={{
                    color: isLight ? colours.grey[300] : colours.grey[300],
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                  }}
                >
                  {society.description || "No description available."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySocieties;
