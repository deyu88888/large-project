import { apiClient, apiPaths } from "../../api";
import { ReportReply } from '../../types';

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const res = await apiClient.get(apiPaths.USER.REPORT);
    console.log(res.data); 
    return res.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

export const fetchReportDetails = async (reportId: string) => {
  try {
    const res = await apiClient.get(`/api/reports/to-admin/${reportId}/`);
    return res.data;
  } catch (error) {
    console.error("Error fetching report details:", error);
    throw error;
  }
};

export const fetchReportThread = async (reportId: string) => {
  try {
    const res = await apiClient.get(`/api/report-thread/${reportId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching report thread:", error);
    throw error;
  }
};

export const submitReply = async (data: { report: string | number; parent_reply?: number | null; content: string }) => {
  try {
    const res = await apiClient.post("/api/report-replies", data);
    return res.data;
  } catch (error) {
    console.error("Error submitting reply:", error);
    throw error;
  }
};

export const fetchMyReports = async () => {
  try {
    const res = await apiClient.get("/api/my-reports");
    return res.data;
  } catch (error) {
    console.error("Error fetching my reports:", error);
    throw error;
  }
};

export const fetchMyReportsWithReplies = async () => {
  try {
    const res = await apiClient.get("/api/admin/my-reports-with-replies");
    return res.data;
  } catch (error) {
    console.error("Error fetching my reports with replies:", error);
    throw error;
  }
};

export const fetchReportsWithReplies = async () => {
  try {
    const res = await apiClient.get("/api/admin/reports-with-replies");
    return res.data;
  } catch (error) {
    console.error("Error fetching reports with replies:", error);
    throw error;
  }
};

export const fetchReportReplies = async (): Promise<ReportReply[]> => {
  try {
    const response = await apiClient.get('/api/admin/reports-replied');
    return response.data;
  } catch (error) {
    console.error('Error fetching report replies:', error);
    throw error;
  }
};