import { apiClient } from "../api";
export const updateRequestStatus = async (id, status, apiPath) => {
    try {
        await apiClient.put(`${apiPath}/${id}`, { status });
    }
    catch (error) {
        console.error(`Error updating request ${id} to ${status}:`, error);
        throw error;
    }
};
