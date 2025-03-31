// Refactored
import React, { useEffect, useState, forwardRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { EventForm } from "../../components/EventForm";
import { CircularProgress, Box, Snackbar } from "@mui/material";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import {
  ExtraModule,
  EventFormInitialData,
  RouteParams,
} from "../../types/event/event.ts";

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function EditEventDetails() {
  const { eventId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<EventFormInitialData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData(eventId);
    }
  }, [eventId]);

  const fetchEventData = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/events/${id}/manage/`);
      const data = response.data;
      const formattedData = formatInitialData(data);
      setInitialData(formattedData);
      setError(null);
    } catch (error: unknown) {
      console.error("Failed to fetch event data:", error);
      setError("Failed to load event data");
      showSnackbar("Failed to load event data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatInitialData = (data: any): EventFormInitialData => {
    const event = data.event || data;
    return {
      title: event.title ?? "",
      mainDescription: event.main_description ?? "",
      date: event.date ?? "",
      startTime: event.start_time ?? "",
      duration: event.duration ?? "",
      location: event.location ?? "",
      maxCapacity: event.max_capacity ?? 0,
      coverImageFile: null,
      coverImageUrl: event.cover_image ?? "",
      extraModules: extractModules(event.extra_modules ?? [], false),
      participantModules: extractModules(event.participant_modules ?? [], true),
      adminReason: data.admin_reason ?? "",
    };
  };

  const extractModules = (modules: unknown[], isParticipantOnly: boolean): ExtraModule[] => {
    if (!Array.isArray(modules)) return [];

    return (modules as any[])
      .filter((mod) => mod && mod.is_participant_only === isParticipantOnly)
      .map(mapModule);
  };

  const mapModule = (mod: any): ExtraModule => {
    if (!mod) return { id: "0", type: "text" as any, textValue: "" };
    return {
      id: mod.id?.toString() || "0",
      type: mod.type || "text",
      textValue: mod.text_value || "",
      fileValue: mod.file_value || "",
    };
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/events/${eventId}/manage/`, formData);

      if (response.status === 200) {
        showSnackbar("Event update submitted. Awaiting admin approval.", "success");
        setTimeout(() => {
          navigate(-1);
        }, 2000);
        return;
      }

      throw new Error(`Server error: ${response.statusText}`);
    } catch (error: unknown) {
      console.error("Error updating event:", error);
      showSnackbar("Failed to update event.", "error");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error || !initialData) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <p>{error || "Event not found."}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </Box>
    );
  }

  return (
    <>
      <EventForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={initialData}
        isEditMode={true}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}