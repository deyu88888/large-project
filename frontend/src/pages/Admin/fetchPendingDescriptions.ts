import { apiClient, apiPaths } from "../../api";

export const fetchPendingDescriptions = async () => {
    try {
      const res = await apiClient.get(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
      return res.data;
    } catch (error) {
      console.error("Error fetching pending descriptions:", error);
    }
  };