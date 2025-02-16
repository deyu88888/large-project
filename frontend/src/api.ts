import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// Define base API URL properly
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Axios instance
export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization token for every request (only if it exists)
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
    LOGIN: "/api/user/login/",  // TODO: DONT ADD BACKSLASH
    REGISTER: "/api/user/register",   // TODO: DONT ADD BACKSLASH
    REFRESH: "/api/user/token/refresh", // TODO: DONT ADD BACKSLASH
    CURRENT: "/api/user/current", // TODO: DONT ADD BACKSLASH
    SOCIETY: "/api/admin-panel/society",  // TODO: DONT ADD BACKSLASH
    REJECTEDSOCIETY: "/api/admin-panel/rejected-society", // TODO: DONT ADD BACKSLASH
    STUDENTS: "/api/user/student",  // TODO: DONT ADD BACKSLASH
    ADMIN: "/api/user/admin", // TODO: DONT ADD BACKSLASH
    PENDINGSOCIETYREQUEST: "/api/society/request/pending",  // TODO: DONT ADD BACKSLASH
    PENDINGEVENTREQUEST: "/api/event/request/pending",  // TODO: DONT ADD BACKSLASH
    PROFILE: "/api/user/profile", // TODO: DONT ADD BACKSLASH
    REJECTEDEVENT: "/api/admin-panel/rejected-event", // TODO: DONT ADD BACKSLASH
  },
  SOCIETY: {
    POPULAR_SOCIETIES: "/api/popular-societies",  // TODO: DONT ADD BACKSLASH
    MANAGE_DETAILS: (id: number) => `/api/manage-society-details/${id}`,  // TODO: DONT ADD BACKSLASH
  },
  EVENTS: {
    ALL: "/api/events", // TODO: DONT ADD BACKSLASH
  },
};

// Fetch Most Popular Societies
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

// Fetch All Events (Public Access)
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