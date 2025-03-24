import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { EventForm, EventFormInitialData } from "../../components/EventForm";
import { CircularProgress, Box } from "@mui/material";
import * as console from "node:console";
import {ExtraModule} from "../../components/SortableItem";

interface RouteParams extends Record<string, string | undefined> {
  society_id?: string;
  event_id?: string;
}

export default function EditEventDetails() {
  const { eventId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<EventFormInitialData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await apiClient.get(`/api/event/${eventId}/manage/`);
        const data = response.data;

        const mapModule = (mod: any): ExtraModule => ({
          id: mod.id.toString(),
          type: mod.type,
          textValue: mod.text_value || mod.file_value,
          fileValue: undefined,
        });

        setInitialData({
          title: data.title,
          mainDescription: data.main_description,
          date: data.date,
          startTime: data.start_time,
          duration: data.duration,
          location: data.location,
          maxCapacity: data.max_capacity || 0,
          coverImageFile: null,
          coverImageUrl: data.cover_image,
          extraModules: data.extra_modules
            .filter((mod: any) => !mod.is_participant_only)
            .map(mapModule),
          participantModules: data.participant_modules
            .filter((mod: any) => mod.is_participant_only)
            .map(mapModule),
          adminReason: "",
        });
      } catch (error: any) {
        console.error("Failed to fetch event data:", error);
        alert("Failed to load event data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await apiClient.patch(`/api/event/${eventId}/manage/`, formData);
      if (response.status === 200) {
        alert("Event update submitted. Awaiting admin approval.");
        navigate(-1);
      } else {
        throw new Error(`Server error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error updating event:", error);
      alert("Failed to update event.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return <EventForm onSubmit={handleSubmit} initialData={initialData!} isEditMode={true} />;
}
