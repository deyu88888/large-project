import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { EventForm, EventFormInitialData } from "../../components/EventForm";
import { CircularProgress, Box } from "@mui/material";
import { ExtraModule } from "../../components/SortableItem";
import { RouteParams } from "../../types/president/event";

export default function EditEventDetails() {
  const { eventId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<EventFormInitialData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      alert("Failed to load event data.");
    } finally {
      setLoading(false);
    }
  };

  const formatInitialData = (data: any): EventFormInitialData => {
    return {
      title: data.title || "",
      mainDescription: data.main_description || "",
      date: data.date || "",
      startTime: data.start_time || "",
      duration: data.duration || "",
      location: data.location || "",
      maxCapacity: data.max_capacity || 0,
      coverImageFile: null,
      coverImageUrl: data.cover_image || "",
      extraModules: extractModules(data.extra_modules || [], false),
      participantModules: extractModules(data.participant_modules || [], true),
      adminReason: "",
    };
  };

  const extractModules = (modules: unknown[], isParticipantOnly: boolean): ExtraModule[] => {
    if (!Array.isArray(modules)) return [];
    
    return (modules as any[])
      .filter((mod) => mod && mod.is_participant_only === isParticipantOnly)
      .map(mapModule);
  };

  const mapModule = (mod: any): ExtraModule => {
    if (!mod) return { id: '0', type: 'text', textValue: '' };
    
    const fileUrl = mod.file_value || mod.text_value || "";
    return {
      id: mod.id?.toString() || '0',
      type: mod.type || 'text',
      textValue: mod.text_value || mod.file_value || "",
      fileValue: mod.type === "file" && fileUrl ? fileUrl : undefined,
    };
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/events/${eventId}/manage/`, formData);

      if (response.status === 200) {
        alert("Event update submitted. Awaiting admin approval.");
        navigate(-1);
        return;
      }

      throw new Error(`Server error: ${response.statusText}`);
    } catch (error: unknown) {
      console.error("Error updating event:", error);
      alert("Failed to update event.");
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
    <EventForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialData={initialData}
      isEditMode={true}
    />
  );
}