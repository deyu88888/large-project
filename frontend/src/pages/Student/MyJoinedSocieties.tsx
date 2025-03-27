import React, { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

// Types and Interfaces
interface Society {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface StyleProps {
  isLight: boolean;
  colours: any;
}

interface HeaderProps {
  styleProps: StyleProps;
}

interface LoadingStateProps {
  styleProps: StyleProps;
}

interface EmptyStateProps {
  styleProps: StyleProps;
}

interface SocietyCardProps {
  society: Society;
  onViewSociety: (societyId: number) => void;
  styleProps: StyleProps;
}

interface SocietyGridProps {
  societies: Society[];
  onViewSociety: (societyId: number) => void;
  styleProps: StyleProps;
}

interface ContainerProps {
  children: React.ReactNode;
  styleProps: StyleProps;
}

// Component Functions
const PageHeader: React.FC<HeaderProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
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
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p
      style={{
        color: isLight ? colours.grey[700] : colours.grey[300],
        textAlign: "center",
        fontSize: "1.125rem",
      }}
    >
      Loading societies...
    </p>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p
      style={{
        color: isLight ? colours.grey[600] : colours.grey[300],
        textAlign: "center",
        fontSize: "1.125rem",
      }}
    >
      You haven't joined any societies yet.
    </p>
  );
};

const SocietyIcon: React.FC<{ name: string, iconUrl: string }> = ({ name, iconUrl }) => {
  return (
    <img
      src={iconUrl}
      alt={`${name} icon`}
      style={{
        width: "35px",
        height: "35px",
        borderRadius: "50%",
        verticalAlign: "middle",
      }}
    />
  );
};

const truncateDescription = (description: string, maxLength: number = 160): string => {
  if (!description) return "No description available.";
  return description.length > maxLength 
    ? description.slice(0, maxLength) + "..." 
    : description;
};

const SocietyCard: React.FC<SocietyCardProps> = ({ society, onViewSociety, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <SocietyIcon name={society.name} iconUrl={society.icon} />
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
        {truncateDescription(society.description)}
      </p>
      <ViewSocietyButton 
        societyId={society.id} 
        onViewSociety={onViewSociety} 
        styleProps={styleProps} 
      />
    </div>
  );
};

const ViewSocietyButton: React.FC<{
  societyId: number;
  onViewSociety: (societyId: number) => void;
  styleProps: StyleProps;
}> = ({ societyId, onViewSociety, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <button
      onClick={() => onViewSociety(societyId)}
      style={{
        backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
        color: isLight ? "#ffffff" : colours.grey[100],
        padding: "0.5rem 1.5rem",
        borderRadius: "0.5rem",
        transition: "all 0.2s ease",
        border: "none",
        cursor: "pointer",
        marginLeft: "5.0rem",
      }}
    >
      View Society
    </button>
  );
};

const SocietyGrid: React.FC<SocietyGridProps> = ({ societies, onViewSociety, styleProps }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "2rem",
        padding: "1rem 0",
      }}
    >
      {societies.map((society) => (
        <SocietyCard 
          key={society.id} 
          society={society} 
          onViewSociety={onViewSociety}
          styleProps={styleProps}
        />
      ))}
    </div>
  );
};

const Container: React.FC<ContainerProps> = ({ children, styleProps }) => {
  const { isLight, colours } = styleProps;
  
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
        {children}
      </div>
    </div>
  );
};

const ContentSwitcher: React.FC<{
  loading: boolean;
  societies: Society[];
  onViewSociety: (societyId: number) => void;
  styleProps: StyleProps;
}> = ({ loading, societies, onViewSociety, styleProps }) => {
  if (loading) {
    return <LoadingState styleProps={styleProps} />;
  }
  
  if (societies.length === 0) {
    return <EmptyState styleProps={styleProps} />;
  }
  
  return (
    <SocietyGrid 
      societies={societies} 
      onViewSociety={onViewSociety} 
      styleProps={styleProps}
    />
  );
};

// Custom Hook for Data Fetching
const useSocieties = () => {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSocieties();
  }, []);
  
  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/society/joined");
      setSocieties(response.data || []);
    } catch (error) {
      console.error("Error fetching societies:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return { societies, loading };
};

// Main Component
const MySocieties: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const styleProps = { isLight, colours };
  
  const { societies, loading } = useSocieties();
  
  const handleViewSociety = async (societyId: number) => {
    try {
      navigate("/student/view-society/" + societyId);
    }
    catch (error) {
      console.error("Error viewing society:", error);
    }
  };
  
  return (
    <Container styleProps={styleProps}>
      <PageHeader styleProps={styleProps} />
      <ContentSwitcher
        loading={loading}
        societies={societies}
        onViewSociety={handleViewSociety}
        styleProps={styleProps}
      />
    </Container>
  );
};

export default MySocieties;