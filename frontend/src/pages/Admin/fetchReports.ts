import { apiClient, apiPaths } from "../../api";

// export interface Report {
//   id: number;
//   from_student: string;
//   message: string;
//   created_at: string;
// }

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const res = await apiClient.get(apiPaths.USER.REPORT);
    return res.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};
