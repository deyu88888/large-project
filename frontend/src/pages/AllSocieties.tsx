import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, apiPaths } from "../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";
import { Society } from "../types";
import SocietyCard from "../components/SocietyCard";

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

        const response = await apiClient.get(apiPaths.SOCIETY.All);
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
    navigate(`/view-society/${societyId}`);
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
                  ? isLight ? colours.accent2[400] : colours.accent2[600]
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
                  ? isLight ? colours.accent2[400] : colours.accent2[600]
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
              color: isLight ? colours.accent3[400] : colours.accent3[300],
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
            {societies.map((society) => (
              <SocietyCard 
                key={society.id}
                society={society}
                isLight={isLight}
                colors={colours}
                onViewSociety={handleViewSociety}
              />
            ))}
          </div>
        )}

        {!loading && societies.length > 0 && viewByCategory && getCategoryCount() > 1 && (
          <div>
            {Object.entries(groupSocietiesByCategory()).map(([category, categoryList]) => (
              <div key={category} style={{ marginBottom: "2rem" }}>
                <h2
                  style={{ 
                    color: colours.grey[100], 
                    fontSize: "1.5rem", 
                    marginBottom: "1rem",
                    paddingBottom: "0.5rem",
                    borderBottom: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`
                  }}
                >
                  {category}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "1.25rem"
                  }}
                >
                  {categoryList.map((society) => (
                    <SocietyCard 
                      key={society.id}
                      society={society}
                      isLight={isLight}
                      colors={colours}
                      onViewSociety={handleViewSociety}
                    />
                  ))}
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