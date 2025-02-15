import { apiClient, apiPaths } from "../../api";

export const fetchPendingSocieties = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
      // setSocieties(res.data);
      return res.data;
    } catch (error) {
      console.error("Error fetching pending societies:", error);
    }
  };