import { Box, Typography, Card, CardContent, Button, Snackbar } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { ExtraModule } from "./SortableItem";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

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
  isParticipant: boolean;
  isMember: boolean;
  eventId: number;
  hostedBy: number;
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
    coverImageFile,
    coverImageUrl,
    extraModules,
    participantModules,
    isParticipant,
    isMember,
    eventId,
    hostedBy,
  } = eventData;

  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const coverImageSrc = coverImageFile
    ? URL.createObjectURL(coverImageFile)
    : coverImageUrl;

  const handleJoinEvent = async () => {
    try {
      await apiClient.post("/api/events/rsvp/", { event_id: eventId });
      setSnackbarMsg("Successfully joined the event!");
      setSnackbarOpen(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setSnackbarMsg("Failed to join event.");
      setSnackbarOpen(true);
    }
  };

  const handleCancelRSVP = async () => {
    try {
      await apiClient.delete("/api/events/rsvp/", { data: { event_id: eventId } });
      setSnackbarMsg("Canceled RSVP.");
      setSnackbarOpen(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setSnackbarMsg("Failed to cancel RSVP.");
      setSnackbarOpen(true);
    }
  };

  const handleJoinSociety = () => {
    setSnackbarMsg("Please join the society to RSVP.");
    setSnackbarOpen(true);
    setTimeout(() => {
      navigate(`/student/view-society/${hostedBy}`);
    }, 1500);
  };

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
        let imageSrc = "";

        if (mod.fileValue instanceof File) {
          imageSrc = URL.createObjectURL(mod.fileValue);
        } else if (typeof mod.fileValue === "string" && mod.fileValue !== "") {
          imageSrc = mod.fileValue;
        } else if (mod.textValue) {
          imageSrc = mod.textValue;
        }

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
                borderRadius: 2,
              }}
            />
          </Box>
        ) : null;
      }
      case "file":
        let fileUrl = "";
        let fileName = "Download File";

        if (mod.fileValue instanceof File) {
          fileUrl = URL.createObjectURL(mod.fileValue);
          fileName = mod.fileValue.name;
        } else if (typeof mod.fileValue === "string" && mod.fileValue !== "") {
          fileUrl = mod.fileValue;
          fileName = (mod.fileValue as string).split("/").pop() || "Download File";
        }

        return fileUrl ? (
          <Box key={mod.id} sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              href={fileUrl}
              download={fileName}
              startIcon={<InsertDriveFileIcon />}
              sx={{
                textTransform: "none",
                border: "2px solid #ccc",
                color: "black",
                padding: "8px 12px",
              }}
            >
              {fileName}
            </Button>
          </Box>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ textAlign: "center" }}>
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
              borderRadius: 2,
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          px: { xs: 2, md: 6 },
          py: 4,
        }}
      >
        <Box
          flex="1 1 20%"
          minWidth={200}
          sx={{ order: { xs: 1, md: 2 } }}
        >
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 4,
              overflow: "hidden",
              backgroundColor: "#fafafa",
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

          <Box sx={{ mt: 2 }}>
            {!isMember ? (
              <Button variant="outlined"
                      onClick={handleJoinSociety}
                      sx={{
                        color: "white",
                        backgroundColor: "green",
                        border: "1px auto",
                      }}
              >
                Join Society to RSVP
              </Button>
            ) : isParticipant ? (
              <Button variant="contained" color="error" onClick={handleCancelRSVP}>
                Cancel RSVP
              </Button>
            ) : (
              <Button variant="contained"
                      onClick={handleJoinEvent}
                      sx={{
                          color: "white",
                          backgroundColor: "green",
                          border: "1px auto"
                      }}
              >
                Join Event
              </Button>
            )}
          </Box>
        </Box>

        <Box
          flex="1 1"
          pr={{ md: 2 }}
          sx={{ order: { xs: 2, md: 1 } }}
          minWidth="70%"
        >
          <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
            Overview
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 3 }}>
            {mainDescription || "No description provided."}
          </Typography>

          {extraModules.map(renderModule)}

          {participantModules.length > 0 && (
            isParticipant ? (
              <>
                <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
                  Participants Only Content
                </Typography>
                {participantModules.map(renderModule)}
              </>
            ) : (
              <>
                <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
                  Participants Only Content
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: "italic", color: "gray" }}>
                  Join the event and see the hidden information.
                </Typography>
              </>
            )
          )}
        </Box>
      </Box>

      <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%' }} elevation={6} variant="filled">
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
