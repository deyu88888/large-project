// src/pages/Student/JoinSocieties.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getRecommendedSocieties, SocietyRecommendation } from "../../api";
import RecommendationFeedback from "../../components/RecommendationFeedback";

// Material UI theme
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

/**
 * An improved, professional, and modern version of the JoinSocieties component.
 * This code uses industry-standard design principles:
 * - Card-based layout with hover effects and consistent spacing.
 * - Clear typography, structured headings.
 * - Minimal, consistent use of color tokens.
 * - Responsive grid.
 */
const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  // State:
  const [recommendations, setRecommendations] = useState<SocietyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recommended societies on mount
  useEffect(() => {
    const fetchRecommendedSocieties = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primary: get recommended societies
        const data = await getRecommendedSocieties(5);
        setRecommendations(data);
      } catch (err) {
        console.error("Error fetching society recommendations:", err);
        setError("Failed to load recommendations. Using available societies instead.");

        // Fallback: get from original endpoint
        try {
          const response = await apiClient.get("/api/join-society");
          const fallbackData = response.data.map((society: any) => ({
            society,
            explanation: {
              type: "popular",
              message: "Suggested society for new members",
            },
          }));
          setRecommendations(fallbackData);
        } catch (fallbackErr) {
          console.error("Fallback fetch failed:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendedSocieties();
  }, []);

  // Handler to join society
  const handleJoinSociety = async (societyId: number) => {
    try {
      // Make the POST request to join
      await apiClient.post(`/api/join-society/${societyId}/`);
      alert("Successfully joined the society!");

      // Remove from the recommended list after joining
      setRecommendations(prev => prev.filter(item => item.society.id !== societyId));
    } catch (err) {
      console.error("Error joining society:", err);
      alert("Failed to join the society. Please try again.");
    }
  };

  // Handler to view society
  const handleViewSociety = (societyId: number) => {
    navigate(`/student/view-society/${societyId}`);
  };

  // Badge color for explanation
  const getExplanationBadgeColor = (type: string) => {
    switch (type) {
      case "popular":
        return isLight ? colours.redAccent[500] : colours.redAccent[400];
      case "category":
        return isLight ? colours.greenAccent[500] : colours.greenAccent[400];
      case "tags":
        return isLight ? colours.blueAccent[500] : colours.blueAccent[400];
      default:
        return isLight ? colours.grey[500] : colours.grey[400];
    }
  };

  // Determine heading based on recommendation type
  const getSectionTitle = () => {
    if (recommendations.length === 0) return "Join a Society";

    const allPopular = recommendations.every(
      rec => rec.explanation.type === "popular"
    );
    return allPopular ? "Popular Societies" : "Recommended Societies For You";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[600],
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page Header */}
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              color: colours.grey[100],
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
              transition: "color 0.3s",
            }}
          >
            {getSectionTitle()}
          </h1>
          <p
            style={{
              color: colours.grey[100],
              fontSize: "1.125rem",
              margin: 0,
              transition: "color 0.3s",
            }}
          >
            {recommendations.some(rec => rec.explanation.type !== "popular")
              ? "Societies tailored to your interests and activities!"
              : "Discover new societies and connect with your peers!"}
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <p
            style={{
              color: isLight ? colours.redAccent[400] : colours.redAccent[300],
              textAlign: "center",
              fontSize: "1rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <p
            style={{
              color: isLight ? colours.grey[700] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.25rem",
            }}
          >
            Loading recommended societies...
          </p>
        )}

        {/* Societies Grid */}
        {!loading && recommendations.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {recommendations.map(recommendation => (
              <div
                key={recommendation.society.id}
                style={{
                  backgroundColor: isLight
                    ? colours.primary[400]
                    : colours.primary[700],
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                  border: `1px solid ${
                    isLight ? colours.grey[300] : colours.grey[800]
                  }`,
                  boxShadow: isLight
                    ? "0 2px 8px rgba(0, 0, 0, 0.05)"
                    : "0 2px 8px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                }}
                // Optional hover effect
                onMouseEnter={e =>
                  (e.currentTarget.style.transform = "translateY(-4px)")
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                {/* Society Title */}
                <h3
                  style={{
                    color: colours.grey[100],
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {recommendation.society.name}
                </h3>

                {/* Explanation Badge */}
                <div
                  style={{
                    backgroundColor: getExplanationBadgeColor(
                      recommendation.explanation.type
                    ),
                    color: "#fff",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "inline-block",
                    marginBottom: "0.75rem",
                  }}
                >
                  {recommendation.explanation.message}
                </div>

                {/* Society Description */}
                <p
                  style={{
                    color: colours.grey[200],
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    marginBottom: "1rem",
                  }}
                >
                  {recommendation.society.description ||
                    "No description available."}
                </p>

                {/* Tags */}
                {recommendation.society.tags &&
                  recommendation.society.tags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      {recommendation.society.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                  <button
                    onClick={() => handleJoinSociety(recommendation.society.id)}
                    style={{
                      backgroundColor: isLight
                        ? colours.blueAccent[400]
                        : colours.blueAccent[500],
                      color: "#ffffff",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      flex: 1,
                      transition: "background-color 0.2s",
                    }}
                  >
                    Join Society
                  </button>
                  <button
                    onClick={() => handleViewSociety(recommendation.society.id)}
                    style={{
                      backgroundColor: isLight
                        ? colours.blueAccent[400]
                        : colours.blueAccent[500],
                      color: "#ffffff",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      flex: 1,
                      transition: "background-color 0.2s",
                    }}
                  >
                    View Society
                  </button>
                </div>

                {/* Feedback Component */}
                <div style={{ marginTop: "1rem" }}>
                  <RecommendationFeedback
                    societyId={recommendation.society.id}
                    isLight={isLight}
                    colours={colours}
                    onFeedbackSubmitted={() =>
                      console.log(
                        `Feedback submitted for society ${recommendation.society.id}`
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Societies */}
        {!loading && recommendations.length === 0 && (
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