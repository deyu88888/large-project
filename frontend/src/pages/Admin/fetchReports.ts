import { apiClient, apiPaths } from "../../api";

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