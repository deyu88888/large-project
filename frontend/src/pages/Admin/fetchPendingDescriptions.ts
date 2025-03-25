import { apiClient, apiPaths } from "../../api";

// Types
interface ApiResponse<T> {
  data: T;
}

interface DescriptionRequest {
  id: string;
  // Add other properties as needed
}

// API error handling
const handleApiError = (error: unknown, context: string): void => {
  console.error(`Error ${context}:`, error);
};

// Raw API request function
const makeGetRequest = async <T>(endpoint: string): Promise<ApiResponse<T> | undefined> => {
  try {
    return await apiClient.get(endpoint);
  } catch (error) {
    handleApiError(error, `making GET request to ${endpoint}`);
    return undefined;
  }
};

// Specific domain function
const fetchPendingDescriptions = async (): Promise<DescriptionRequest[] | undefined> => {
  const response = await makeGetRequest<DescriptionRequest[]>(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
  return response?.data;
};

// Export public functions
export { fetchPendingDescriptions };

// Also export types for consumers
export type { DescriptionRequest };