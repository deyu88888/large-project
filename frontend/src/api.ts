import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// ✅ Define base API URL properly
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ✅ Axios instance
export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach Authorization token for every request (only if it exists)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    console.log("Request URL:", config.url);
    console.log("Full URL:", apiUrl + config.url);
    console.log("Authorization Token:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const apiPaths = {
  USER: {
    LOGIN: "/api/user/login/",
    REGISTER: "/api/user/register/",
    REFRESH: "/api/user/token/refresh/",
    CURRENT: "/api/user/current/",
    SOCIETY: "/api/admin-panel/society/",
    REJECTEDSOCIETY: "/api/admin-panel/rejected-society/",
    STUDENTS: "/api/user/student/",
    ADMIN: "/api/user/admin/",
    PENDINGSOCIETYREQUEST: "/api/society/request/pending/",
    PENDINGEVENTREQUEST: "/api/event/request/pending/",
    PROFILE: "/api/user/profile/",
    REJECTEDEVENT: "/api/admin-panel/rejected-event/",
  },
  SOCIETY: {
    POPULAR_SOCIETIES: "/api/popular-societies/",
    MANAGE_DETAILS: (id: number) => `/api/manage-society-details/${id}/`,
  },
  EVENTS: {
    ALL: "/api/events/",
  },
};

// ✅ Fetch Most Popular Societies
export const getPopularSocieties = async () => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.POPULAR_SOCIETIES);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching popular societies:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ✅ Fetch All Events (Public Access)
export const getAllEvents = async () => {
  try {
    const response = await apiClient.get(apiPaths.EVENTS.ALL);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching events:",
      error.response?.data || error.message
    );
    throw error;
  }
};