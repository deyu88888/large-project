import { apiClient } from "../../api";
const logError = (message, error) => {
    console.error(message, error);
};
const makeGetRequest = async (endpoint, errorMessage) => {
    try {
        const response = await apiClient.get(endpoint);
        return response.data;
    }
    catch (error) {
        logError(errorMessage, error);
        throw error;
    }
};
const makePostRequest = async (endpoint, data, errorMessage) => {
    try {
        const response = await apiClient.post(endpoint, data);
        return response.data;
    }
    catch (error) {
        logError(errorMessage, error);
        throw error;
    }
};
const fetchReports = async () => {
    const data = await makeGetRequest("/api/admin/report-to-admin", "Error fetching reports:");
    console.log(data);
    return data;
};
const fetchReportDetails = async (reportId) => {
    return await makeGetRequest(`/api/admin/report-to-admin/${reportId}`, "Error fetching report details:");
};
const fetchReportThread = async (reportId) => {
    return await makeGetRequest(`/api/admin/report-thread/${reportId}`, "Error fetching report thread:");
};
const submitReply = async (data) => {
    return await makePostRequest("/api/admin/report-replies", data, "Error submitting reply:");
};
const fetchMyReports = async () => {
    return await makeGetRequest("/api/admin/my-reports", "Error fetching my reports:");
};
const fetchMyReportsWithReplies = async () => {
    return await makeGetRequest("/api/admin/my-reports-with-replies", "Error fetching my reports with replies:");
};
const fetchReportsWithReplies = async () => {
    return await makeGetRequest("/api/admin/reports-with-replies", "Error fetching reports with replies:");
};
const fetchReportReplies = async () => {
    return await makeGetRequest('/api/admin/reports-replied', 'Error fetching report replies:');
};
export { fetchReports, fetchReportDetails, fetchReportThread, submitReply, fetchMyReports, fetchMyReportsWithReplies, fetchReportsWithReplies, fetchReportReplies };
