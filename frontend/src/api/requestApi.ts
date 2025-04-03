import { apiClient } from "../api";

// export const updateRequestStatus = async (id: number, status: "Approved" | "Rejected", endpoint?: string
// ) => {
//   try {
//     // Convert status string to approved boolean value
//     const approved = status === "Approved";
    
//     // The URL should match your backend structure
//     // Django URLs: path("society/request/pending/<int:society_id>", AdminSocietyRequestView.as_view())
//     // This gets prefixed with "api/" from your main urls.py
//     const baseEndpoint = endpoint || "/api/admin/society/request/pending";
//     await apiClient.put(`/api/admin/society/request/pending/${id}`, { approved });
//   } catch (error) {
//     console.error(`Error updating request ${id} to ${status}:`, error);
//     throw error; 
//   }
// };
export const updateRequestStatus = async (
  id: number, 
  status: "Approved" | "Rejected",
  endpoint?: string
) => {
  try {
    // Convert status string to approved boolean value
    const approved = status === "Approved";
    
    // Use the provided endpoint or fall back to the default one
    const baseEndpoint = endpoint || "/api/admin/society/request/pending";
    
    await apiClient.put(`${baseEndpoint}/${id}`, { approved });
  } catch (error) {
    console.error(`Error updating request ${id} to ${status}:`, error);
    throw error; 
  }
};