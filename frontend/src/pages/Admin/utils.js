import { apiClient } from "../../api";
const logApiError = (error) => {
    console.error(`Error from ${error.path}:`, error.error);
};
const createApiError = (path, error) => {
    return {
        message: `Failed to fetch data from ${path}`,
        path,
        error
    };
};
const makeGetRequest = async (path) => {
    return await apiClient.get(path);
};
export const fetchPendingRequests = async (path) => {
    try {
        const response = await makeGetRequest(path);
        return response?.data;
    }
    catch (error) {
        const apiError = createApiError(path, error);
        logApiError(apiError);
        return undefined;
    }
};
