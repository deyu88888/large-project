import { useNavigate, useParams } from "react-router-dom";
import { EventForm } from "../../components/EventForm";
import { apiClient } from "../../api";

export default function CreateEvent() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await apiClient.post(`/api/events/requests/${societyId}/`, formData);
      if (response.status === 201) {
        alert("Event created successfully!");
        navigate(-1);
      } else {
        throw new Error(`Server error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  return <EventForm onSubmit={handleSubmit} />;
}
