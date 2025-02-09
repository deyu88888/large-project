import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// import PendingSocietyRequest from "./pages/Admin/PendingSocietyRequest";  // not used


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
    LOGIN: "/api/user/login",   // Remove Trailing slash
    REGISTER: "/api/user/register",   // Remove Trailing slash
    REFRESH: "/api/user/token/refresh",  // Remove Trailing slash
    CURRENT: "/api/user/current",   // Remove Trailing slash
    SOCIETY: "/api/admin-panel/society",  // Remove Trailing slash
    REJECTEDSOCIETY: "/api/admin-panel/rejected-society", // Remove Trailing slash
    STUDENTS: "/api/user/student",  // Remove Trailing slash
    ADMIN: "/api/user/admin", // Remove Trailing slash
    PENDINGSOCIETYREQUEST: "/api/society/request/pending",  // Remove Trailing slash
  },
  SOCIETY: {
    POPULAR_SOCIETIES: "/api/popular-societies", // Remove Trailing slash
  },
  EVENTS: {
    ALL: "/api/events", // Remove Trailing slashe
  },
};

// ✅ Fetch Most Popular Societies
export const getPopularSocieties = async () => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.POPULAR_SOCIETIES);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error fetching popular societies:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Fetch All Events (Public Access)
export const getAllEvents = async () => {
  try {
    // 🟢 If your endpoint doesn't require auth, do NOT force check token
    // If your endpoint does require auth, keep the token logic. But since you made it public, remove or skip this check.
    const response = await apiClient.get(apiPaths.EVENTS.ALL);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error fetching events:", error.response?.data || error.message);
    throw error;
  }
};