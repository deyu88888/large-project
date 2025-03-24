// EventDetailLayout.tsx
import { Box, Typography, Card, CardContent } from "@mui/material";
import { ExtraModule } from "./SortableItem";

export interface EventData {
  title: string;
  mainDescription: string;
  date: string;
  startTime: string;
  duration: string;
  location: string;
  maxCapacity: number;
  coverImageUrl?: string;
  coverImageFile?: File | null;
  extraModules: ExtraModule[];
  participantModules: ExtraModule[];
}

export function EventDetailLayout({ eventData }: { eventData: EventData }) {
  const {
    title,
    mainDescription,
    date,
    startTime,
    duration,
    location,
    maxCapacity,
      extraModules,
    participantModules
  } = eventData;

  const coverImageSrc = eventData.coverImageFile
    ? URL.createObjectURL(eventData.coverImageFile)
    : eventData.coverImageUrl;

  const renderModule = (mod: ExtraModule) => {
    switch (mod.type) {
      case "subtitle":
        return (
          <Box key={mod.id} sx={{ my: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: "bold" }}>
              {mod.textValue || "Subtitle"}
            </Typography>
          </Box>
        );
      case "description":
        return (
          <Box key={mod.id} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {mod.textValue}
            </Typography>
          </Box>
        );
      case "image": {
        const imageSrc = mod.fileValue
          ? URL.createObjectURL(mod.fileValue)
          : mod.textValue;
        return imageSrc ? (
          <Box key={mod.id} sx={{ mb: 3 }}>
            <Box
              component="img"
              src={imageSrc}
              alt="Image preview"
              sx={{
                width: "100%",
                maxHeight: 400,
                objectFit: "cover",
                borderRadius: 2
              }}
            />
          </Box>
        ) : null;
      }
      case "file":
        if (mod.fileValue) {
          return (
            <Box key={mod.id} sx={{ mb: 3 }}>
              <Typography variant="body2">
                File: {mod.fileValue.name}
              </Typography>
            </Box>
          );
        } else if (mod.textValue) {
          const fileName = mod.textValue.split("/").pop() || "Existing File";
          return (
            <Box key={mod.id} sx={{ mb: 3 }}>
              <Typography variant="body2">
                Existing File: {fileName}
              </Typography>
            </Box>
          );
        } else {
          return null;
        }
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          {title || "Event Title"}
        </Typography>
      </Box>

      {coverImageSrc && (
        <Box sx={{ textAlign: "center", my: 2 }}>
          <Box
            component="img"
            src={coverImageSrc}
            alt="Cover"
            sx={{
              display: "inline-block",
              maxWidth: "80%",
              width: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: 2
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          px: { xs: 2, md: 6 },
          py: 4
        }}
      >
        <Box flex="1 1 60%" pr={2}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
            Overview
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 3 }}>
            {mainDescription || "No description provided."}
          </Typography>

          {extraModules.map(renderModule)}

          <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
            Participants Only Content
          </Typography>
          {participantModules.map(renderModule)}
        </Box>

        <Box flex="1 1 20%" minWidth={250}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 4,
              overflow: "hidden",
              backgroundColor: "#fafafa"
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Event Details
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Date:</strong> {date}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Time:</strong> {startTime}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Duration:</strong> {duration}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Location:</strong> {location}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Max Capacity:</strong> {maxCapacity}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
