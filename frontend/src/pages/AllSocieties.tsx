import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, apiPaths } from "../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";
import { Society } from "../types";

const AllSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewByCategory, setViewByCategory] = useState<boolean>(true);

  useEffect(() => {
    const fetchAllSocieties = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(apiPaths.SOCIETY.ALL);
        console.log("Fetched societies:", response.data);
        setSocieties(response.data);
      } catch (err) {
        console.error("Error fetching societies:", err);
        setError("Failed to load societies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSocieties();
  }, []);

  const handleViewSociety = (societyId: number) => {
    console.log("Viewing society:", societyId);
    navigate(`/all-societies/${societyId}`);
  };
  
  const groupSocietiesByCategory = () => {
    const groups: { [key: string]: Society[] } = {};
    
    societies.forEach(society => {
      const category = society.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(society);
    });
    
    return groups;
  };

  const getCategoryCount = () => {
    const categories = new Set(societies.map(society => society.category || "Uncategorized"));
    return categories.size;
  };

  const renderSocietyCard = (society: Society) => {
    return (
      <div
        id={`society-card-${society.id}`}
        key={society.id}
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
          height: "100%",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-8px) translateZ(10px)";
          e.currentTarget.style.boxShadow = isLight 
            ? "0 12px 24px rgba(0, 0, 0, 0.1)" 
            : "0 12px 24px rgba(0, 0, 0, 0.3)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0) translateZ(0)";
          e.currentTarget.style.boxShadow = isLight
            ? "0 4px 12px rgba(0, 0, 0, 0.05)"
            : "0 4px 12px rgba(0, 0, 0, 0.2)";
        }}
      >
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
          {society.name}
        </h3>

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
            {society.category || "General"}
          </span>
        </div>

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
          {society.description || "No description available."}
        </p>

        {society.tags && society.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "1rem",
              minHeight: "2rem",
            }}
          >
            {society.tags.slice(0, 3).map((tag, idx) => (
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

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
          <button
            onClick={() => handleViewSociety(society.id)}
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
              transition: "all 0.2s ease",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
            }}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

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
            Explore Campus Societies
          </h1>
          <p
            style={{
              color: colours.grey[100],
              fontSize: "1.125rem",
              margin: 0,
              transition: "color 0.3s",
            }}
          >
            Discover a wide range of student societies and their activities
          </p>
        </header>

        {!loading && societies.length > 0 && getCategoryCount() > 1 && (
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

        {loading && (
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
              Loading societies...
            </div>
          </div>
        )}

        {!loading && societies.length > 0 && (!viewByCategory || getCategoryCount() <= 1) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "1.25rem",
              perspective: "1000px",
              maxWidth: "100%"
            }}
          >
            {societies.map(society => renderSocietyCard(society))}
          </div>
        )}

        {!loading && societies.length > 0 && viewByCategory && getCategoryCount() > 1 && (
          <div>
            {Object.entries(groupSocietiesByCategory()).map(([category, categoryList]) => (
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
                  {categoryList.map(society => renderSocietyCard(society))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && societies.length === 0 && (
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
              No societies available at the moment.
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
              Please check back later for updates.
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideInDown {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AllSocieties;