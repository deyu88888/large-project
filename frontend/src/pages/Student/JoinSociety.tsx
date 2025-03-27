import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getRecommendedSocieties, SocietyRecommendation } from "../../api";
import RecommendationFeedback from "../../components/RecommendationFeedback";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

// Types and Interfaces
interface StyleProps {
  isLight: boolean;
  colours: any;
}

interface CategoryGroup {
  [key: string]: SocietyRecommendation[];
}

interface CardStyleProps extends StyleProps {
  joining: number | null;
}

interface SocietyCardProps {
  recommendation: SocietyRecommendation;
  handleViewSociety: (societyId: number) => void;
  joining: number | null;
  joinSuccess: boolean;
  isLight: boolean;
  colours: any;
}

interface CategoryViewProps {
  recommendations: SocietyRecommendation[];
  handleViewSociety: (societyId: number) => void;
  joining: number | null;
  joinSuccess: boolean;
  styleProps: StyleProps;
}

interface AllSocietiesViewProps {
  recommendations: SocietyRecommendation[];
  handleViewSociety: (societyId: number) => void;
  joining: number | null;
  joinSuccess: boolean;
  styleProps: StyleProps;
}

// Style Helper Functions
const getExplanationBadgeColor = (type: string, styleProps: StyleProps): string => {
  const { isLight, colours } = styleProps;
  
  switch (type) {
    case "popular":
      return isLight ? colours.redAccent[500] : colours.redAccent[400];
    case "category":
      return isLight ? colours.greenAccent[500] : colours.greenAccent[400];
    case "tags":
      return isLight ? colours.blueAccent[500] : colours.blueAccent[400];
    case "content":
      return isLight ? colours.purpleAccent[500] : colours.purpleAccent[400];
    case "semantic":
      return isLight ? colours.orangeAccent[500] : colours.orangeAccent[400];
    default:
      return isLight ? colours.grey[500] : colours.grey[400];
  }
};

const getCardBaseStyle = (styleProps: CardStyleProps) => {
  const { isLight, colours } = styleProps;
  
  return {
    backgroundColor: isLight ? colours.primary[400] : colours.primary[700],
    borderRadius: "0.75rem",
    padding: "1.25rem",
    border: `1px solid ${isLight ? colours.grey[300] : colours.grey[800]}`,
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
    height: "100%",
  };
};

// Component Helper Functions
const getSectionTitle = (recommendations: SocietyRecommendation[]): string => {
  if (recommendations.length === 0) return "Join a Society";

  const allPopular = recommendations.every(
    rec => rec.explanation.type === "popular"
  );
  return allPopular ? "Most Popular Societies" : "Recommended Societies For You";
};

const getCategoryCount = (recommendations: SocietyRecommendation[]): number => {
  const categories = new Set(recommendations.map(rec => rec.society.category || "Uncategorized"));
  return categories.size;
};

const groupRecommendationsByCategory = (recommendations: SocietyRecommendation[]): CategoryGroup => {
  const groups: CategoryGroup = {};
  
  recommendations.forEach(rec => {
    const category = rec.society.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(rec);
  });
  
  return groups;
};

// Sub-Components
const SocietyCard: React.FC<SocietyCardProps> = ({
  recommendation,
  handleViewSociety,
  joining,
  joinSuccess,
  isLight,
  colours
}) => {
  const styleProps: CardStyleProps = { isLight, colours, joining };
  const baseStyle = getCardBaseStyle(styleProps);
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (joining !== recommendation.society.id) {
      e.currentTarget.style.transform = "translateY(-8px) translateZ(10px)";
      e.currentTarget.style.boxShadow = isLight 
        ? "0 12px 24px rgba(0, 0, 0, 0.1)" 
        : "0 12px 24px rgba(0, 0, 0, 0.3)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (joining !== recommendation.society.id) {
      e.currentTarget.style.transform = "translateY(0) translateZ(0)";
      e.currentTarget.style.boxShadow = isLight
        ? "0 4px 12px rgba(0, 0, 0, 0.05)"
        : "0 4px 12px rgba(0, 0, 0, 0.2)";
    }
  };

  return (
    <div
      id={`society-card-${recommendation.society.id}`}
      key={recommendation.society.id}
      style={baseStyle as any}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderJoinSuccessIndicator(recommendation, joining, joinSuccess, colours)}
      {renderSocietyTitle(recommendation, colours)}
      {renderSocietyCategory(recommendation, isLight, colours)}
      {renderExplanationBadge(recommendation, { isLight, colours })}
      {renderSocietyDescription(recommendation, colours)}
      {renderSocietyTags(recommendation)}
      {renderCardButtons(recommendation, handleViewSociety, joining, isLight, colours)}
      {renderFeedbackSection(recommendation, isLight, colours)}
    </div>
  );
};

const renderJoinSuccessIndicator = (
  recommendation: SocietyRecommendation,
  joining: number | null,
  joinSuccess: boolean,
  colours: any
) => {
  if (joining !== recommendation.society.id || !joinSuccess) return null;

  return (
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
  );
};

const renderSocietyTitle = (recommendation: SocietyRecommendation, colours: any) => {
  return (
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
        minHeight: "3rem",
      }}
    >
      {recommendation.society.name}
    </h3>
  );
};

const renderSocietyCategory = (
  recommendation: SocietyRecommendation,
  isLight: boolean,
  colours: any
) => {
  return (
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
  );
};

const renderExplanationBadge = (
  recommendation: SocietyRecommendation,
  styleProps: StyleProps
) => {
  return (
    <div
      style={{
        backgroundColor: getExplanationBadgeColor(recommendation.explanation.type, styleProps),
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
  );
};

const renderSocietyDescription = (recommendation: SocietyRecommendation, colours: any) => {
  return (
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
        minHeight: "4rem",
      }}
    >
      {recommendation.society.description || "No description available."}
    </p>
  );
};

const renderSocietyTags = (recommendation: SocietyRecommendation) => {
  if (!recommendation.society.tags || recommendation.society.tags.length === 0) {
    return null;
  }
  
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginBottom: "1rem",
        minHeight: "2rem",
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
  );
};

const renderCardButtons = (
  recommendation: SocietyRecommendation,
  handleViewSociety: (societyId: number) => void,
  joining: number | null,
  isLight: boolean,
  colours: any
) => {
  return (
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
  );
};

const renderFeedbackSection = (
  recommendation: SocietyRecommendation,
  isLight: boolean,
  colours: any
) => {
  return (
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
  );
};

const CategoryView: React.FC<CategoryViewProps> = ({
  recommendations,
  handleViewSociety,
  joining,
  joinSuccess,
  styleProps
}) => {
  const { isLight, colours } = styleProps;
  const groups = groupRecommendationsByCategory(recommendations);
  
  return (
    <div>
      {Object.entries(groups).map(([category, recs]) => (
        <div key={category} style={{ marginBottom: "2rem" }}>
          <h2 style={{ 
            color: colours.grey[100], 
            fontSize: "1.5rem", 
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`
          }}>
            {category}
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.25rem"
          }}>
            {recs.map(recommendation => (
              <SocietyCard
                key={recommendation.society.id}
                recommendation={recommendation}
                handleViewSociety={handleViewSociety}
                joining={joining}
                joinSuccess={joinSuccess}
                isLight={isLight}
                colours={colours}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AllSocietiesView: React.FC<AllSocietiesViewProps> = ({
  recommendations,
  handleViewSociety,
  joining,
  joinSuccess,
  styleProps
}) => {
  const { isLight, colours } = styleProps;
  
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1.25rem",
        perspective: "1000px",
        maxWidth: "100%"
      }}
    >
      {recommendations.map(recommendation => (
        <SocietyCard
          key={recommendation.society.id}
          recommendation={recommendation}
          handleViewSociety={handleViewSociety}
          joining={joining}
          joinSuccess={joinSuccess}
          isLight={isLight}
          colours={colours}
        />
      ))}
    </div>
  );
};

const ViewToggleButtons: React.FC<{
  viewByCategory: boolean;
  setViewByCategory: (value: boolean) => void;
  isLight: boolean;
  colours: any;
}> = ({ viewByCategory, setViewByCategory, isLight, colours }) => {
  return (
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
  );
};

const PageHeader: React.FC<{
  title: string;
  subtitle: string;
  colours: any;
}> = ({ title, subtitle, colours }) => {
  return (
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
        {title}
      </h1>
      <p
        style={{
          color: colours.grey[100],
          fontSize: "1.125rem",
          margin: 0,
          transition: "color 0.3s",
        }}
      >
        {subtitle}
      </p>
    </header>
  );
};

const ErrorMessage: React.FC<{
  error: string;
  isLight: boolean;
  colours: any;
}> = ({ error, isLight, colours }) => {
  return (
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
  );
};

const LoadingState: React.FC<{
  colours: any;
}> = ({ colours }) => {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "3rem"
    }}>
      <div style={{
        color: colours.grey[100],
        fontSize: "1.2rem"
      }}>
        Loading recommendations...
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  isLight: boolean;
  colours: any;
}> = ({ isLight, colours }) => {
  return (
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
  );
};

// Main Component
const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const styleProps = { isLight, colours };

  const [recommendations, setRecommendations] = useState<SocietyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining] = useState<number | null>(null);
  const [joinSuccess] = useState<boolean>(false);
  const [viewByCategory, setViewByCategory] = useState<boolean>(true);

  // Event Handlers
  const handleViewSociety = (societyId: number) => {
    console.log("Viewing society:", societyId);
    navigate(`/student/view-society/${societyId}`);
  };

  // Data Fetching
  useEffect(() => {
    fetchRecommendedSocieties();
  }, []);

  const fetchRecommendedSocieties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendedSocieties(10);
      console.log("Fetched recommendations:", data);
      setRecommendations(data);
    } catch (err) {
      console.error("Error fetching society recommendations:", err);
      setError("Failed to load recommendations. Using available societies instead.");
      fetchFallbackSocieties();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackSocieties = async () => {
    try {
      const response = await apiClient.get("/api/society/join");
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
  };

  // Content Helper Functions
  const getSubtitleText = () => {
    return recommendations.some(rec => rec.explanation.type !== "popular")
      ? "Societies tailored to your interests and activities!"
      : "Discover new societies and connect with your peers!";
  };

  const shouldShowCategoryToggle = !loading && recommendations.length > 0 && getCategoryCount(recommendations) > 1;

  const shouldShowCategoryView = viewByCategory && getCategoryCount(recommendations) > 1;

  // Render
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        transition: "all 0.3s ease-in-out",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <PageHeader 
          title={getSectionTitle(recommendations)} 
          subtitle={getSubtitleText()}
          colours={colours}
        />

        {shouldShowCategoryToggle && (
          <ViewToggleButtons 
            viewByCategory={viewByCategory}
            setViewByCategory={setViewByCategory}
            isLight={isLight}
            colours={colours}
          />
        )}

        {error && <ErrorMessage error={error} isLight={isLight} colours={colours} />}

        {loading && <LoadingState colours={colours} />}

        {!loading && recommendations.length > 0 && !shouldShowCategoryView && (
          <AllSocietiesView 
            recommendations={recommendations}
            handleViewSociety={handleViewSociety}
            joining={joining}
            joinSuccess={joinSuccess}
            styleProps={styleProps}
          />
        )}

        {!loading && recommendations.length > 0 && shouldShowCategoryView && (
          <CategoryView 
            recommendations={recommendations}
            handleViewSociety={handleViewSociety}
            joining={joining}
            joinSuccess={joinSuccess}
            styleProps={styleProps}
          />
        )}

        {!loading && recommendations.length === 0 && (
          <EmptyState isLight={isLight} colours={colours} />
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