import { useNavigate, useParams } from "react-router-dom";
import { EventForm } from "../../components/EventForm";
import { apiClient } from "../../api";

export default function CreateEvent() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();

  const isSuccessful = (status: number): boolean => status === 201;

  const showSuccessAndNavigateBack = () => {
    alert("Event created successfully!");
    navigate(-1);
  };

  const showError = (error: unknown) => {
    console.error("Error creating event:", error);
    alert("Failed to create event.");
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await apiClient.post(`/api/events/requests/${societyId}/`, formData);

      if (isSuccessful(response.status)) {
        showSuccessAndNavigateBack();
        return;
      }

      throw new Error(`Server error: ${response.statusText}`);
    } catch (error: unknown) {
      showError(error);
    }
  };

  return <EventForm onSubmit={handleSubmit} />;
}