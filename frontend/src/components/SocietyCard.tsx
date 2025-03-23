// SocietyCard.tsx
import React from "react";
import { Society } from "../types"; // Adjust the path as needed

interface SocietyCardProps {
  society: Society;
  isLight: boolean;
  colors: {
    primary: Record<number, string>;
    grey: Record<number, string>;
    blueAccent: Record<number, string>;
  };
  onViewSociety: (id: number) => void;
}

const SocietyCard: React.FC<SocietyCardProps> = ({
  society,
  isLight,
  colors,
  onViewSociety,
}) => {
  return (
    <div
      id={`society-card-${society.id}`}
      key={society.id}
      style={{
        backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
        borderRadius: "0.75rem",
        padding: "1.25rem",
        border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
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
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px) translateZ(10px)";
        e.currentTarget.style.boxShadow = isLight
          ? "0 12px 24px rgba(0, 0, 0, 0.1)"
          : "0 12px 24px rgba(0, 0, 0, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) translateZ(0)";
        e.currentTarget.style.boxShadow = isLight
          ? "0 4px 12px rgba(0, 0, 0, 0.05)"
          : "0 4px 12px rgba(0, 0, 0, 0.2)";
      }}
    >
      <h3
        style={{
          color: colors.grey[100],
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "0.5rem",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
            color: isLight ? colors.grey[800] : colors.grey[100],
            padding: "0.2rem 0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {society.category || "General"}
        </span>
      </div>

      <p
        style={{
          color: colors.grey[200],
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
          onClick={() => onViewSociety(society.id)}
          style={{
            backgroundColor: isLight
              ? colors.blueAccent[400]
              : colors.blueAccent[500],
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

export default SocietyCard;
