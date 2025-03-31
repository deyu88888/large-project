import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { EventForm } from "../../components/EventForm";
import { CircularProgress, Box, Snackbar } from "@mui/material";
import {
  ExtraModule,
  EventFormInitialData,
  RouteParams,
} from "../../types/event/event";
import {
  EventDataResponse,
  ModuleData,
} from "../../types/president/EditEventDetails";
import { Alert } from "../../components/Alert";

export default function EditEventDetails() {
  const { eventId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<EventFormInitialData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const setSuccessSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const setErrorSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  };

  const closeSnackbarIfNotClickAway = (reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    closeSnackbarIfNotClickAway(reason);
  };

  const navigateBack = () => {
    navigate(-1);
  };

  const navigateBackWithDelay = (delay: number) => {
    setTimeout(navigateBack, delay);
  };

  const isModuleTypeValid = (type: string | undefined): boolean => {
    return Boolean(type && ["description", "image", "file", "subtitle"].includes(type));
  };

  const getValidModuleType = (type: string | undefined): "description" | "image" | "file" | "subtitle" => {
    return isModuleTypeValid(type) 
      ? (type as "description" | "image" | "file" | "subtitle") 
      : "description";
  };

  const createBaseModule = (): ExtraModule => {
    return { id: "0", type: "description", textValue: "" };
  };

  const mapModuleData = (mod: ModuleData): ExtraModule => {
    if (!mod) return createBaseModule();
    
    return {
      id: mod.id?.toString() || "0",
      type: getValidModuleType(mod.type),
      textValue: mod.text_value || "",
      fileValue: mod.file_value || "",
    };
  };

  const filterModulesByParticipantStatus = (modules: ModuleData[], isParticipantOnly: boolean): ModuleData[] => {
    if (!Array.isArray(modules)) return [];
    return modules.filter((mod) => mod && mod.is_participant_only === isParticipantOnly);
  };

  const extractModules = (modules: ModuleData[], isParticipantOnly: boolean): ExtraModule[] => {
    const filteredModules = filterModulesByParticipantStatus(modules, isParticipantOnly);
    return filteredModules.map(mapModuleData);
  };

  const extractEventData = (event: any): any => {
    return event.event || event;
  };

  const formatInitialData = (data: EventDataResponse): EventFormInitialData => {
    const event = extractEventData(data);
    
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

  const processEventDataResponse = (data: EventDataResponse) => {
    const formattedData = formatInitialData(data);
    setInitialData(formattedData);
    setError(null);
  };

  const handleFetchError = (error: unknown) => {
    console.error("Failed to fetch event data:", error);
    setError("Failed to load event data");
    setErrorSnackbar("Failed to load event data.");
  };

  const completeDataFetch = () => {
    setLoading(false);
  };

  const fetchEventData = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/events/${id}/manage/`);
      processEventDataResponse(response.data);
    } catch (error: unknown) {
      handleFetchError(error);
    } finally {
      completeDataFetch();
    }
  };

  const initiateEventDataFetch = () => {
    if (eventId) {
      fetchEventData(eventId);
    }
  };

  useEffect(() => {
    initiateEventDataFetch();
  }, [eventId]);

  const handleSubmitSuccess = () => {
    setSuccessSnackbar("Event update submitted. Awaiting admin approval.");
    navigateBackWithDelay(2000);
  };

  const handleSubmitError = (error: unknown) => {
    console.error("Error updating event:", error);
    setErrorSnackbar("Failed to update event.");
  };

  const sendUpdateRequest = async (formData: FormData) => {
    return await apiClient.patch(`/api/events/${eventId}/manage/`, formData);
  };

  const isSuccessResponse = (status: number): boolean => {
    return status === 200;
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await sendUpdateRequest(formData);

      if (isSuccessResponse(response.status)) {
        handleSubmitSuccess();
        return;
      }

      throw new Error(`Server error: ${response.statusText}`);
    } catch (error: unknown) {
      handleSubmitError(error);
    }
  };

  const handleCancel = () => {
    navigateBack();
  };

  const createLoadingView = () => (
    <Box display="flex" justifyContent="center" mt={4}>
      <CircularProgress color="secondary" />
    </Box>
  );

  const createErrorView = () => (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <p>{error || "Event not found."}</p>
      <button onClick={navigateBack}>Go Back</button>
    </Box>
  );

  const createAlertComponent = () => (
    <Alert
      onClose={handleSnackbarClose}
      severity={snackbarSeverity}
      sx={{ width: "100%" }}
    >
      {snackbarMessage}
    </Alert>
  );

  const createSnackbarComponent = () => (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={handleSnackbarClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      {createAlertComponent()}
    </Snackbar>
  );

  const createEventFormComponent = () => (
    <EventForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialData={initialData}
      isEditMode={true}
    />
  );

  const createMainView = () => (
    <>
      {createEventFormComponent()}
      {createSnackbarComponent()}
    </>
  );

  if (loading) {
    return createLoadingView();
  }

  if (error || !initialData) {
    return createErrorView();
  }

  return createMainView();
}