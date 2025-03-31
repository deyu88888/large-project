import { apiClient, apiPaths } from "../../api";
import { ApiResponse, DescriptionRequest } from "../../types/admin/PendingDescriptions";

const handleApiError = (error: unknown, context: string): void => {
  console.error(`Error ${context}:`, error);
};

const makeGetRequest = async <T>(endpoint: string): Promise<ApiResponse<T> | undefined> => {
  try {
    return await apiClient.get(endpoint);
  } catch (error) {
    handleApiError(error, `making GET request to ${endpoint}`);
    return undefined;
  }
};

const fetchPendingDescriptions = async (): Promise<DescriptionRequest[] | undefined> => {
  const response = await makeGetRequest<DescriptionRequest[]>(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
  return response?.data;
};

export { fetchPendingDescriptions };
export type { DescriptionRequest };