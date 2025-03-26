import { apiClient, apiPaths } from "../../api";
import { ReportReply } from '../../types';

// Interfaces
interface Report {
  id: string;
  // Add other properties as needed
}

interface ReportDetails {
  id: string;
  // Add other properties as needed
}

interface ReportThread {
  id: string;
  // Add other properties as needed
}

interface ReportReplyRequest {
  report: string | number;
  parent_reply?: number | null;
  content: string;
}

interface ApiResponse<T> {
  data: T;
}

// Error handling
const logError = (message: string, error: unknown): void => {
  console.error(message, error);
};

// Generic request function
const makeGetRequest = async <T>(endpoint: string, errorMessage: string): Promise<T> => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    logError(errorMessage, error);
    throw error;
  }
};

const makePostRequest = async <T, R>(endpoint: string, data: T, errorMessage: string): Promise<R> => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    logError(errorMessage, error);
    throw error;
  }
};

// Specific domain functions
const fetchReports = async (): Promise<Report[]> => {
  // Fixed: Using the correct path found in your urls.py
  const data = await makeGetRequest<Report[]>(
    "/api/admin/report-to-admin",
    "Error fetching reports:"
  );
  console.log(data);
  return data;
};

const fetchReportDetails = async (reportId: string): Promise<ReportDetails> => {
  // Fixed: Using the correct path for report detail
  return await makeGetRequest<ReportDetails>(
    `/api/admin/report-to-admin/${reportId}`,
    "Error fetching report details:"
  );
};

const fetchReportThread = async (reportId: string): Promise<ReportThread> => {
  // Fixed: Using the correct path in admin patterns
  return await makeGetRequest<ReportThread>(
    `/api/admin/report-thread/${reportId}`,
    "Error fetching report thread:"
  );
};

const submitReply = async (data: ReportReplyRequest): Promise<ReportReply> => {
  // Fixed: Using the correct path in admin patterns
  return await makePostRequest<ReportReplyRequest, ReportReply>(
    "/api/admin/report-replies",
    data,
    "Error submitting reply:"
  );
};

const fetchMyReports = async (): Promise<Report[]> => {
  // Fixed: Using the correct path in admin patterns
  return await makeGetRequest<Report[]>(
    "/api/admin/my-reports",
    "Error fetching my reports:"
  );
};

const fetchMyReportsWithReplies = async (): Promise<Report[]> => {
  // This path looks correct based on your URLs
  return await makeGetRequest<Report[]>(
    "/api/admin/my-reports-with-replies",
    "Error fetching my reports with replies:"
  );
};

const fetchReportsWithReplies = async (): Promise<Report[]> => {
  // This path looks correct based on your URLs
  return await makeGetRequest<Report[]>(
    "/api/admin/reports-with-replies",
    "Error fetching reports with replies:"
  );
};

const fetchReportReplies = async (): Promise<ReportReply[]> => {
  // This path looks correct based on your URLs
  return await makeGetRequest<ReportReply[]>(
    '/api/admin/reports-replied',
    'Error fetching report replies:'
  );
};

// Exports
export {
  fetchReports,
  fetchReportDetails,
  fetchReportThread,
  submitReply,
  fetchMyReports,
  fetchMyReportsWithReplies,
  fetchReportsWithReplies,
  fetchReportReplies
};

export type {
  Report,
  ReportDetails,
  ReportThread,
  ReportReplyRequest
};