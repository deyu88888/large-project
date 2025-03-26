import { apiClient, apiPaths } from "../../api";
const handleApiError = (error, context) => {
    console.error(`Error ${context}:`, error);
};
const makeGetRequest = async (endpoint) => {
    try {
        return await apiClient.get(endpoint);
    }
    catch (error) {
        handleApiError(error, `making GET request to ${endpoint}`);
        return undefined;
    }
};
const fetchPendingDescriptions = async () => {
    const response = await makeGetRequest(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
    return response?.data;
};
export { fetchPendingDescriptions };
