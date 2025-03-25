import { Box, Typography } from "@mui/material";
import { StyledButton } from "./home/StyledButton";
import { EventCardProps } from "../types/shared/event";

const EventCard = ({
  event,
  isLight,
  colors,
  onViewEvent,
  followingsAttending = [],
}: EventCardProps) => {
  return (
    <Box
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
      {/* Title */}
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
        {event.title}
      </Typography>

      {/* Cover image */}
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
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "0.5rem",
            }}
          />
        ) : (
          <Typography
            sx={{ color: isLight ? colors.grey[800] : colors.grey[100] }}
          >
            Event Image
          </Typography>
        )}
      </Box>

      {/* Date and location */}
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
            backgroundColor: isLight
              ? colors.blueAccent[400]
              : colors.blueAccent[700],
            color: "white",
            padding: "0.2rem 0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {new Date(event.date).toLocaleDateString()}
        </span>
        {event.location && (
          <span
            style={{
              backgroundColor: isLight
                ? colors.greenAccent[400]
                : colors.greenAccent[700],
              color: "white",
              padding: "0.2rem 0.5rem",
              borderRadius: "0.25rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            {event.location}
          </span>
        )}
      </Box>

      {/* Main description */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            color: colors.grey[200],
            fontSize: "0.875rem",
            lineHeight: 1.5,
            mb: 2,
          }}
        >
          {event.main_description?.substring(0, 120)}
          {event.main_description && event.main_description.length > 120
            ? "..."
            : ""}
        </Typography>
      </Box>

      {/* Followings Attending (Avatar and Description) */}
      {followingsAttending.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            mt: 1,
            mb: 1.5,
            flexWrap: "wrap"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {followingsAttending.slice(0, 3).map((att, index) => (
              <Box
                key={att.id}
                sx={{
                  width: index === 0 ? 36 : 28,
                  height: index === 0 ? 36 : 28,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${isLight ? "#fff" : colors.primary[600]}`,
                  marginLeft: index > 0 ? "-10px" : 0,
                  zIndex: 10 - index,
                  position: "relative",
                }}
              >
                <img
                  src={att.icon || "/default-avatar.png"}
                  alt={att.first_name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            ))}
            {followingsAttending.length > 3 && (
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: colors.grey[300],
                  marginLeft: "0.5rem",
                }}
              >
                +{followingsAttending.length - 3}
              </Typography>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: colors.grey[300],
              fontSize: "0.8rem",
              whiteSpace: "normal",
              wordBreak: "break-word",
              flex: 1
            }}
          >
            {followingsAttending[0].first_name}
            {followingsAttending.length > 1
              ? ` and ${followingsAttending.length - 1} more following`
              : ""}{" "}
            also attending this event
          </Typography>
        </Box>
      )}

      {/* View Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
        <StyledButton
          onClick={() => onViewEvent(event.id)}
          sx={{
            "& .MuiButtonBase-root, & .MuiButton-root": {
              color: isLight ? "black !important" : "white !important",
            },
          }}
        >
          <span style={{ position: "relative", zIndex: 10 }}>View Event</span>
        </StyledButton>
      </Box>
    </Box>
  );
};

export default EventCard;
