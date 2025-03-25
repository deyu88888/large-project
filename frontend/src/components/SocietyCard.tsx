import React from "react";
import { Box, Typography } from "@mui/material";
import { StyledButton } from "./home/StyledButton";
import { Society } from "../types"; // Adjust the path as needed

interface SocietyCardProps {
  society: Society;
  isLight: boolean;
  colors: {
    primary: Record<number, string>;
    grey: Record<number, string>;
    blueAccent: Record<number, string>;
    greenAccent: Record<number, string>;
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
    <Box
      id={`society-card-${society.id}`}
      key={society.id}
      sx={{
        backgroundColor: isLight ? colors.primary[400] : colors.primary[700],
        borderRadius: "0.75rem",
        padding: "1.25rem",
        border: `1px solid ${isLight ? colors.grey[300] : colors.grey[800]}`,
        boxShadow: isLight
          ? "0 4px 12px rgba(0, 0, 0, 0.05)"
          : "0 4px 12px rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: colors.grey[100],
          fontSize: "1.25rem",
          fontWeight: 600,
          mb: 1.5,
          minHeight: "3rem",
        }}
      >
        {society.name}
      </Typography>

      <Box
        sx={{
          height: "120px",
          backgroundColor: isLight ? colors.grey[300] : colors.grey[700],
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0.5rem",
        }}
      >
        {society.icon ? (
          <img
          src={society.icon || undefined}
          alt={`${society.name} icon`}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            verticalAlign: "middle",
          }}
          />
        ) : (
          <Typography sx={{ color: isLight ? colors.grey[800] : colors.grey[100] }}>
            Society Image
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1.5,
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            backgroundColor: isLight ? colors.blueAccent[400] : colors.blueAccent[700],
            color: "white",
            padding: "0.2rem 0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {society.category || "General"}
        </span>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            color: colors.grey[200],
            fontSize: "0.875rem",
            lineHeight: 1.5,
            mb: 2,
          }}
        >
          {society.description?.substring(0, 120)}
          {society.description && society.description.length > 120 ? "..." : ""}
        </Typography>
      </Box>

      {society.tags && society.tags.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            mb: 2,
          }}
        >
          {society.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              style={{
                backgroundColor: isLight ? colors.greenAccent[400] : colors.greenAccent[700],
                color: "white",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
        <StyledButton
          onClick={() => onViewSociety(society.id)}
          sx={{
            "& .MuiButtonBase-root, & .MuiButton-root": {
              color: isLight ? "black !important" : "white !important"
            }
          }}
        >
          <span style={{ position: "relative", zIndex: 10 }}>View Society</span>
        </StyledButton>
      </Box>
    </Box>
  );
};

export default SocietyCard;