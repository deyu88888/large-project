import { apiClient, apiPaths } from "../../api";

export const fetchPendingEvents = async () => {
    try {
      const res = await apiClient.get(apiPaths.EVENTS.PENDINGEVENTREQUEST);
      return res.data;
    } catch (error) {
      console.error("Error fetching pending events:", error);
    }
  };