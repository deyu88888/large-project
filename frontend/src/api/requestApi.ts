import { apiClient } from "../api";

export const updateRequestStatus = async (id: number, status: "Approved" | "Rejected", endpointPath: string, reason?: string) => {
  try {
    const url = `${endpointPath}/${id}`;
    
    const payload = status === "Approved" 
      ? { approved: true }
      : { approved: false, rejection_reason: reason || "Request rejected" };
    
    await apiClient.put(url, payload);
  } catch (error) {
    const urlForError = `${endpointPath}/${id}`;
    console.error(`Error updating request ${id} at ${urlForError} to ${status}:`, error);
    throw error;
  }
};