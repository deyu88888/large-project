import { apiClient, apiPaths } from "../../api";

export const fetchPendingSocieties = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
      return res.data;
    } catch (error) {
      console.error("Error fetching pending societies:", error);
    }
  };