import React, { useState, useEffect, JSX } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, apiPaths } from "../../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { Society } from "../../types";
import SocietyCard from "../../components/SocietyCard";

interface CategoryGroups {
  [key: string]: Society[];
}

const containerStyles = (isLight: boolean) => ({
  minHeight: "100vh",
  padding: "2rem",
  backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
  transition: "all 0.3s ease-in-out",
  overflow: "hidden",
});

const headerStyles = {
  textAlign: "center" as const,
  marginBottom: "2.5rem",
};

const titleStyles = (colors: ReturnType<typeof tokens>) => ({
  color: colors.grey[100],
  fontSize: "2.5rem",
  fontWeight: 700,
  marginBottom: "0.75rem",
  transition: "color 0.3s",
});

const subtitleStyles = (colors: ReturnType<typeof tokens>) => ({
  color: colors.grey[100],
  fontSize: "1.125rem",
  margin: 0,
  transition: "color 0.3s",
});

const buttonGroupStyles = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "2rem",
  gap: "1rem",
};

const buttonStyles = (isActive: boolean, isLight: boolean, colors: ReturnType<typeof tokens>) => ({
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  border: "none",
  backgroundColor: isActive
    ? isLight ? colors.greenAccent[400] : colors.greenAccent[600]
    : isLight ? colors.grey[300] : colors.grey[700],
  color: isActive
    ? "#ffffff"
    : isLight ? colors.grey[800] : colors.grey[100],
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: isActive ? 600 : 400,
  transition: "all 0.2s ease",
});

const errorStyles = (isLight: boolean, colors: ReturnType<typeof tokens>) => ({
  color: isLight ? colors.redAccent[400] : colors.redAccent[300],
  textAlign: "center" as const,
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
});

const loadingStyles = (colors: ReturnType<typeof tokens>) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "3rem",
  color: colors.grey[100],
  fontSize: "1.2rem",
});

const gridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.25rem",
  perspective: "1000px",
  maxWidth: "100%",
};

const categoryTitleStyles = (isLight: boolean, colors: ReturnType<typeof tokens>) => ({
  color: colors.grey[100],
  fontSize: "1.5rem",
  marginBottom: "1rem",
  paddingBottom: "0.5rem",
  borderBottom: `1px solid ${isLight ? colors.grey[300] : colors.grey[700]}`,
});

const emptyStateStyles = (isLight: boolean, colors: ReturnType<typeof tokens>) => ({
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "3rem",
  backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
  borderRadius: "1rem",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
});

const emptyStateTitleStyles = (isLight: boolean, colors: ReturnType<typeof tokens>) => ({
  color: isLight ? colors.grey[200] : colors.grey[300],
  fontSize: "1.25rem",
  fontWeight: "500",
  textAlign: "center" as const,
});

const emptyStateSubtitleStyles = (isLight: boolean, colors: ReturnType<typeof tokens>) => ({
  color: isLight ? colors.grey[300] : colors.grey[400],
  fontSize: "1rem",
  textAlign: "center" as const,
  maxWidth: "400px",
  marginTop: "0.5rem",
});

const AllSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewByCategory, setViewByCategory] = useState<boolean>(true);

  useEffect(() => {
    fetchAllSocieties();
  }, []);

  const fetchAllSocieties = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<Society[]>(apiPaths.SOCIETY.All);
      // console.log("Fetched societies:", response.data);
      setSocieties(response.data);
    } catch (err) {
      console.error("Error fetching societies:", err);
      setError("Failed to load societies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSociety = (societyId: number): void => {
    // console.log("Viewing society:", societyId);
    navigate(`/view-society/${societyId}`);
  };
  
  const handleToggleViewMode = (byCategory: boolean): void => {
    setViewByCategory(byCategory);
  };

  const groupSocietiesByCategory = (): CategoryGroups => {
    const groups: CategoryGroups = {};
    
    societies.forEach(society => {
      const category = society.category || "Uncategorized";
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push(society);
    });
    
    return groups;
  };

  const getCategoryCount = (): number => {
    const categories = new Set(
      societies.map(society => society.category || "Uncategorized")
    );
    return categories.size;
  };

  const renderHeader = (): JSX.Element => (
    <header style={headerStyles}>
      <h1 style={titleStyles(colors)}>
        Explore Campus Societies
      </h1>
      <p style={subtitleStyles(colors)}>
        Discover a wide range of student societies and their activities
      </p>
    </header>
  );

  const renderViewToggle = (): JSX.Element | null => {
    if (loading || societies.length === 0 || getCategoryCount() <= 1) {
      return null;
    }

    return (
      <div style={buttonGroupStyles}>
        <button
          onClick={() => handleToggleViewMode(true)}
          style={buttonStyles(viewByCategory, isLight, colors)}
        >
          Group by Category
        </button>
        <button
          onClick={() => handleToggleViewMode(false)}
          style={buttonStyles(!viewByCategory, isLight, colors)}
        >
          View All
        </button>
      </div>
    );
  };

  const renderErrorMessage = (): JSX.Element | null => {
    if (!error) return null;

    return (
      <div style={errorStyles(isLight, colors)}>
        <span style={{ marginRight: "0.5rem" }}>⚠️</span>
        {error}
      </div>
    );
  };

  const renderLoadingState = (): JSX.Element | null => {
    if (!loading) return null;

    return (
      <div style={loadingStyles(colors)}>
        Loading societies...
      </div>
    );
  };

  const renderSocietyGrid = (societiesList: Society[]): JSX.Element => (
    <div style={gridStyles}>
      {societiesList.map((society) => (
        <SocietyCard 
          key={society.id}
          society={society}
          isLight={isLight}
          colors={colors}
          onViewSociety={handleViewSociety}
        />
      ))}
    </div>
  );

  const renderCategorizedSocieties = (): JSX.Element => {
    const groups = groupSocietiesByCategory();
    
    return (
      <div>
        {Object.entries(groups).map(([category, categoryList]) => (
          <div key={category} style={{ marginBottom: "2rem" }}>
            <h2 style={categoryTitleStyles(isLight, colors)}>
              {category}
            </h2>
            {renderSocietyGrid(categoryList)}
          </div>
        ))}
      </div>
    );
  };

  const renderAllSocieties = (): JSX.Element | null => {
    if (loading || societies.length === 0) return null;
    
    if (!viewByCategory || getCategoryCount() <= 1) {
      return renderSocietyGrid(societies);
    }
    
    return renderCategorizedSocieties();
  };

  const renderEmptyState = (): JSX.Element | null => {
    if (loading || societies.length > 0) return null;

    return (
      <div style={emptyStateStyles(isLight, colors)}>
        <p style={emptyStateTitleStyles(isLight, colors)}>
          No societies available at the moment.
        </p>
        <p style={emptyStateSubtitleStyles(isLight, colors)}>
          Please check back later for updates.
        </p>
      </div>
    );
  };

  const renderAnimation = (): JSX.Element => (
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
  );

  return (
    <div style={containerStyles(isLight)}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {renderHeader()}
        {renderViewToggle()}
        {renderErrorMessage()}
        {renderLoadingState()}
        {renderAllSocieties()}
        {renderEmptyState()}
      </div>
      {renderAnimation()}
    </div>
  );
};

export default AllSocieties;