import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// ✅ Define base API URL properly
const apiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : "http://localhost:8000/";

// ✅ Axios instance
export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach Authorization token for every request
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

// ✅ API Endpoints (Ensure all paths end with `/`)
export const apiPaths = {
  USER: {
    LOGIN: "/api/user/login/",
    REGISTER: "/api/user/register/",
    REFRESH: "/api/user/token/refresh/",
    CURRENT: "/api/user/current/",
    EVENTS: "/api/society/event/",
    SOCIETY: "/api/admin-panel/society/",
    REJECTEDSOCIETY: "/api/admin-panel/rejected-society/",
    STUDENTS: "/api/user/student/",
    ADMIN: "/api/user/admin/",
    PENDINGSOCIETYREQUEST: "/api/society/request/pending/",
  },
  SOCIETY: {
    POPULAR_SOCIETIES: "/api/popular-societies/", // ✅ Added trailing slash to match Django behavior
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