import { apiClient } from "../../api";
import { Report, ReportThread, Reply } from "../../types/president/report";


interface ReportDetails {
  id: string;
}

interface ReplyRequest {
  report: string | number;
  parent_reply?: number | null;
  content: string;
}


const logError = (message: string, error: unknown): void => {
  console.error(message, error);
};


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


const fetchReports = async (): Promise<Report[]> => {
  
  const data = await makeGetRequest<Report[]>(
    "/api/admin/report-to-admin",
    "Error fetching reports:"
  );
  console.log(data);
  return data;
};


const fetchReportDetails = async (reportId: string): Promise<ReportDetails> => {
  
  return await makeGetRequest<ReportDetails>(
    `/api/admin/report-to-admin/${reportId}`,
    "Error fetching report details:"
  );
};


const fetchReportThread = async (reportId: string): Promise<ReportThread> => {
  
  return await makeGetRequest<ReportThread>(
    `/api/admin/report-thread/${reportId}`,
    "Error fetching report thread:"
  );
};


const submitReply = async (data: ReplyRequest): Promise<Reply> => {
  return await makePostRequest<ReplyRequest, Reply>(
    "/api/admin/report-replies",
    data,
    "Error submitting reply:"
  );
};


const fetchMyReports = async (): Promise<Report[]> => {
  
  return await makeGetRequest<Report[]>(
    "/api/admin/my-reports",
    "Error fetching my reports:"
  );
};


const fetchMyReportsWithReplies = async (): Promise<Report[]> => {
  
  return await makeGetRequest<Report[]>(
    "/api/admin/my-reports-with-replies",
    "Error fetching my reports with replies:"
  );
};


const fetchReportsWithReplies = async (): Promise<Report[]> => {
  
  return await makeGetRequest<Report[]>(
    "/api/admin/reports-with-replies",
    "Error fetching reports with replies:"
  );
};


const fetchReportReplies = async (): Promise<Reply[]> => {
  
  return await makeGetRequest<Reply[]>(
    '/api/admin/reports-replied',
    'Error fetching report replies:'
  );
};


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
  ReplyRequest
};