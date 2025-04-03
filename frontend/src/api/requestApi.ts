import { apiClient } from "../api";

export const updateRequestStatus = async (id: number, status: "Approved" | "Rejected", endpointPath: string) => {
  try {
    const approved = status === "Approved";
    const url = `${endpointPath}/${id}`;
    await apiClient.put(url, { approved });
  } catch (error) {
    const urlForError = `${endpointPath}/${id}`;
    console.error(`Error updating request ${id} at ${urlForError} to ${status}:`, error);
    throw error;
  }
};