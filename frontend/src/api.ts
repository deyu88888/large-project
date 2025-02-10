import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// ✅ Define base API URL properly
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/";

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const apiPaths = {
  USER: {
    LOGIN: "/api/user/login/", // Added trailing slash
    REGISTER: "/api/user/register/", // Added trailing slash
    REFRESH: "/api/user/token/refresh/", // Added trailing slash
    CURRENT: "/api/user/current/", // Added trailing slash
    SOCIETY: "/api/admin-panel/society/", // Added trailing slash
    REJECTEDSOCIETY: "/api/admin-panel/rejected-society/", // Added trailing slash
    STUDENTS: "/api/user/student/", // Added trailing slash
    ADMIN: "/api/user/admin/", // Added trailing slash
    PENDINGSOCIETYREQUEST: "/api/society/request/pending/", // Added trailing slash
  },
  SOCIETY: {
    POPULAR_SOCIETIES: "/api/popular-societies/", // Added trailing slash
  },
  EVENTS: {
    ALL: "/api/events/", // Added trailing slash
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