import { apiClient } from "../api";

export const updateRequestStatus = async (id: number, status: "Approved" | "Rejected") => {
  try {
    // Convert status string to approved boolean value
    const approved = status === "Approved";
    
    // The URL should match your backend structure
    // Django URLs: path("society/request/pending/<int:society_id>", AdminSocietyRequestView.as_view())
    // This gets prefixed with "api/" from your main urls.py
    await apiClient.put(`/api/admin/society/request/pending/${id}`, { approved });
  } catch (error) {
    console.error(`Error updating request ${id} to ${status}:`, error);
    throw error; 
  }
};