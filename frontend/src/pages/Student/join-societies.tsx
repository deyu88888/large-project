import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getRecommendedSocieties, SocietyRecommendation } from "../../api";
import RecommendationFeedback from "../../components/RecommendationFeedback";

// Import the theme
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";

const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [recommendations, setRecommendations] = useState<SocietyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedSocieties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use our new recommendation endpoint
        const data = await getRecommendedSocieties(5);
        setRecommendations(data);
      } catch (error) {
        console.error("Error fetching society recommendations:", error);
        setError("Failed to load recommendations. Using available societies instead.");
        
        // Fallback to the original join-society endpoint if recommendations fail
        try {
          const response = await apiClient.get("/api/join-society");
          // Convert the standard society format to match our recommendation format
          const fallbackData = response.data.map((society: any) => ({
            society: society,
            explanation: {
              type: "popular",
              message: "Suggested society for new members"
            }
          }));
          setRecommendations(fallbackData);
        } catch (fallbackError) {
          console.error("Fallback fetch failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendedSocieties();
  }, []);

  const handleJoinSociety = async (societyId: number) => {
    try {
      await apiClient.post(`/api/join-society/${societyId}/`);
      alert("Successfully joined the society!");
      
      // Remove the joined society from the recommendations
      setRecommendations((prev) => prev.filter((item) => item.society.id !== societyId));
    } catch (error) {
      console.error("Error joining society:", error);
      alert("Failed to join the society. Please try again.");
    }
  };

  const handleViewSociety = async (societyId: number) => {
    navigate("/student/view-society/" + societyId);
  };

  // Helper function to get badge color based on recommendation type
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

  // Get section title based on if recommendations contain popular societies or not
  const getSectionTitle = () => {
    if (recommendations.length === 0) return "Join a Society";
    
    // Check if all recommendations are popular type
    const allPopular = recommendations.every(rec => rec.explanation.type === "popular");
    
    if (allPopular) {
      return "Popular Societies";
    } else {
      return "Recommended Societies For You";
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
            {getSectionTitle()}
          </h1>
          <p
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "1.125rem",
              margin: 0,
            }}
          >
            {recommendations.some(rec => rec.explanation.type !== "popular") 
              ? "Societies tailored to your interests and activities!"
              : "Discover new societies and connect with your peers!"}
          </p>
        </header>

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

        {loading ? (
          <p
            style={{
              color: isLight ? colours.grey[700] : colours.grey[300],
              textAlign: "center",
              fontSize: "1.125rem",
            }}
          >
            Loading recommended societies...
          </p>
        ) : recommendations.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "2rem",
              padding: "1rem 0",
            }}
          >
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.society.id}
                style={{
                  backgroundColor: isLight ? colours.primary[400] : colours.primary[400],
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
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
                  {recommendation.society.name}
                </h3>
                
                {/* Recommendation explanation badge */}
                <div
                  style={{
                    backgroundColor: getExplanationBadgeColor(recommendation.explanation.type),
                    color: "#ffffff",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    display: "inline-block",
                    marginBottom: "0.75rem",
                    alignSelf: "flex-start",
                  }}
                >
                  {recommendation.explanation.message}
                </div>
                
                <p
                  style={{
                    color: isLight ? colours.grey[300] : colours.grey[300],
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    marginBottom: "0.75rem",
                  }}
                >
                  {recommendation.society.description || "No description available."}
                </p>
                
                {/* Tags if available */}
                {recommendation.society.tags && recommendation.society.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {recommendation.society.tags.slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: isLight ? colours.primary[300] : colours.primary[600],
                          color: isLight ? colours.grey[100] : colours.grey[100],
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
                
                <div style={{ display: "flex", gap: "1rem", marginTop: "auto" }}>
                  <button
                    onClick={() => handleJoinSociety(recommendation.society.id)}
                    style={{
                      backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
                      color: isLight ? "#ffffff" : colours.grey[100],
                      padding: "0.5rem 1.5rem",
                      borderRadius: "0.5rem",
                      transition: "all 0.2s ease",
                      border: "none",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Join Society
                  </button>
                  <button
                    onClick={() => handleViewSociety(recommendation.society.id)}
                    style={{
                      backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
                      color: isLight ? "#ffffff" : colours.grey[100],
                      padding: "0.5rem 1.5rem",
                      borderRadius: "0.5rem",
                      transition: "all 0.2s ease",
                      border: "none",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    View Society
                  </button>
                </div>
                
                {/* Add recommendation feedback component */}
                <RecommendationFeedback 
                  societyId={recommendation.society.id}
                  isLight={isLight}
                  colours={colours}
                  onFeedbackSubmitted={() => console.log(`Feedback submitted for society ${recommendation.society.id}`)}
                />
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