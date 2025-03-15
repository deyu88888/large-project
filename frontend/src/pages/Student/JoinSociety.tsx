// src/pages/Student/JoinSocieties.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getRecommendedSocieties, SocietyRecommendation } from "../../api";
import RecommendationFeedback from "../../components/RecommendationFeedback";

// Material UI theme
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

/**
 * Enhanced JoinSocieties component that showcases our advanced NLP-powered recommendations.
 * This component now:
 * - Groups recommendations by category
 * - Highlights category information
 * - Supports all explanation types from our enhanced recommendation system
 * - Provides a more informative and engaging recommendation display
 */
const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  // Add purpleAccent and orangeAccent if they don't exist in your theme
  const purpleAccent = {
    100: "#f4e7ff",
    200: "#d9beff",
    300: "#b894ff",
    400: "#9a6dff",
    500: "#8047FF",
    600: "#6635cc",
    700: "#4d2599",
    800: "#331766",
    900: "#1a0833"
  };

  const orangeAccent = {
    100: "#fff2e6",
    200: "#ffe0cc",
    300: "#ffcdb3",
    400: "#ffb999",
    500: "#FF8C52",
    600: "#cc7042",
    700: "#995431",
    800: "#663821",
    900: "#331c10"
  };

  // State:
  const [recommendations, setRecommendations] = useState<SocietyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<number | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false);
  const [viewByCategory, setViewByCategory] = useState<boolean>(true);

  // Fetch recommended societies on mount
  useEffect(() => {
    const fetchRecommendedSocieties = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primary: get recommended societies - now fetching 10 instead of 5
        const data = await getRecommendedSocieties(10);
        console.log("Fetched recommendations:", data);
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

  // Handler to view society
  const handleViewSociety = (societyId: number) => {
    navigate(`/student/view-society/${societyId}`);
  };

  // Group recommendations by category
  const groupRecommendationsByCategory = () => {
    const groups: { [key: string]: SocietyRecommendation[] } = {};
    
    recommendations.forEach(rec => {
      const category = rec.society.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rec);
    });
    
    return groups;
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
      case "content":
        return isLight ? purpleAccent[500] : purpleAccent[400];
      case "semantic":
        return isLight ? orangeAccent[500] : orangeAccent[400];
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
    return allPopular ? "Most Popular Societies" : "Recommended Societies For You";
  };

  // Get count of unique categories
  const getCategoryCount = () => {
    const categories = new Set(recommendations.map(rec => rec.society.category || "Uncategorized"));
    return categories.size;
  };

  // Render society card
  const renderSocietyCard = (recommendation: SocietyRecommendation) => {
    return (
      <div
        id={`society-card-${recommendation.society.id}`}
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
            ? "0 4px 12px rgba(0, 0, 0, 0.05)"
            : "0 4px 12px rgba(0, 0, 0, 0.2)",
          transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          willChange: "transform, opacity, box-shadow",
          position: "relative",
          overflow: "hidden",
          height: "100%", // Ensure equal height cards
        }}
        // Enhanced hover effect with shadow and subtle lift
        onMouseEnter={e => {
          if (joining !== recommendation.society.id) {
            e.currentTarget.style.transform = "translateY(-8px) translateZ(10px)";
            e.currentTarget.style.boxShadow = isLight 
              ? "0 12px 24px rgba(0, 0, 0, 0.1)" 
              : "0 12px 24px rgba(0, 0, 0, 0.3)";
          }
        }}
        onMouseLeave={e => {
          if (joining !== recommendation.society.id) {
            e.currentTarget.style.transform = "translateY(0) translateZ(0)";
            e.currentTarget.style.boxShadow = isLight
              ? "0 4px 12px rgba(0, 0, 0, 0.05)"
              : "0 4px 12px rgba(0, 0, 0, 0.2)";
          }
        }}
      >
        {/* Success indicator (appears briefly when successfully joining) */}
        {joining === recommendation.society.id && joinSuccess && (
          <div 
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: colours.greenAccent[500],
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              animation: "successPulse 0.5s ease-in-out",
              zIndex: 5,
            }}
          >
            Joined!
          </div>
        )}

        {/* Society Title */}
        <h3
          style={{
            color: colours.grey[100],
            fontSize: "1.25rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "3rem", // Keep consistent space for title
          }}
        >
          {recommendation.society.name}
        </h3>

        {/* Category Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "0.5rem",
          gap: "0.5rem"
        }}>
          <span style={{
            backgroundColor: isLight ? colours.grey[300] : colours.grey[700],
            color: isLight ? colours.grey[800] : colours.grey[100],
            padding: "0.2rem 0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            display: "inline-block",
          }}>
            {recommendation.society.category || "General"}
          </span>
        </div>

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
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "4rem", // Keep consistent height for description
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
                minHeight: "2rem", // Consistent space for tags
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
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
            onClick={() => handleViewSociety(recommendation.society.id)}
            disabled={joining === recommendation.society.id}
            style={{
              backgroundColor: isLight
                ? colours.blueAccent[400]
                : colours.blueAccent[500],
              color: "#ffffff",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: joining === recommendation.society.id ? "default" : "pointer",
              fontSize: "0.875rem",
              flex: 1,
              transition: "all 0.2s ease",
              opacity: joining === recommendation.society.id ? 0.7 : 1,
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
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
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[600],
        transition: "all 0.3s ease-in-out",
        overflow: "hidden", // Prevent layout shifts during animations
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Page Header */}
        <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
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

        {/* View Toggle - Only show if we have multiple categories */}
        {!loading && recommendations.length > 0 && getCategoryCount() > 1 && (
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            marginBottom: "2rem",
            gap: "1rem"
          }}>
            <button
              onClick={() => setViewByCategory(true)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: viewByCategory 
                  ? isLight ? colours.greenAccent[400] : colours.greenAccent[600]
                  : isLight ? colours.grey[300] : colours.grey[700],
                color: viewByCategory 
                  ? "#ffffff" 
                  : isLight ? colours.grey[800] : colours.grey[100],
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: viewByCategory ? 600 : 400,
                transition: "all 0.2s ease",
              }}
            >
              Group by Category
            </button>
            <button
              onClick={() => setViewByCategory(false)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: !viewByCategory 
                  ? isLight ? colours.greenAccent[400] : colours.greenAccent[600]
                  : isLight ? colours.grey[300] : colours.grey[700],
                color: !viewByCategory 
                  ? "#ffffff" 
                  : isLight ? colours.grey[800] : colours.grey[100],
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: !viewByCategory ? 600 : 400,
                transition: "all 0.2s ease",
              }}
            >
              View All
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              color: isLight ? colours.redAccent[400] : colours.redAccent[300],
              textAlign: "center",
              fontSize: "1rem",
              marginBottom: "1.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: isLight ? "rgba(255, 100, 100, 0.1)" : "rgba(255, 100, 100, 0.2)",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              animation: "slideInDown 0.4s ease-out",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "600px",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <span style={{ marginRight: "0.5rem" }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: `3px solid ${isLight ? colours.grey[300] : colours.grey[600]}`,
                borderTop: `3px solid ${colours.blueAccent[400]}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            />
            <p
              style={{
                color: isLight ? colours.grey[700] : colours.grey[300],
                fontSize: "1.125rem",
              }}
            >
              Loading recommended societies...
            </p>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes slideInDown {
                  from { transform: translateY(-20px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                @keyframes zoomOut {
                  from { transform: scale(1); opacity: 1; }
                  to { transform: scale(0.8); opacity: 0; }
                }
                @keyframes successPulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.05); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}
            </style>
          </div>
        )}

        {/* Societies Grid - Grouped by Category */}
        {!loading && recommendations.length > 0 && viewByCategory && getCategoryCount() > 1 && (
          <div>
            {Object.entries(groupRecommendationsByCategory()).map(([category, categoryRecs]) => (
              <div key={category} style={{ marginBottom: "2.5rem" }}>
                <h2 style={{
                  color: colours.grey[100],
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  borderBottom: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
                  paddingBottom: "0.5rem"
                }}>
                  {category} Societies
                </h2>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "1.25rem",
                  perspective: "1000px",
                  maxWidth: "100%"
                }}>
                  {categoryRecs.map(recommendation => renderSocietyCard(recommendation))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Societies Grid - Regular View (not grouped) */}
        {!loading && recommendations.length > 0 && (!viewByCategory || getCategoryCount() <= 1) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "1.25rem",
              perspective: "1000px",
              maxWidth: "100%"
            }}
          >
            {recommendations.map(recommendation => renderSocietyCard(recommendation))}
          </div>
        )}

        {/* No Societies */}
        {!loading && recommendations.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              backgroundColor: isLight ? colours.primary[400] : colours.primary[700],
              borderRadius: "1rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1rem",
              }}
            >
              🔍
            </div>
            <p
              style={{
                color: isLight ? colours.grey[200] : colours.grey[300],
                fontSize: "1.25rem",
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              No societies available to join.
            </p>
            <p
              style={{
                color: isLight ? colours.grey[300] : colours.grey[400],
                fontSize: "1rem",
                textAlign: "center",
                maxWidth: "400px",
                marginTop: "0.5rem",
              }}
            >
              Check back later or explore other campus activities.
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default JoinSocieties;