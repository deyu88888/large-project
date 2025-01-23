import axios from "axios";

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ACCESS_TOKEN"); // Fetch token from local storage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // Attach token if available
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Handle request errors
  }
);

// API Paths
export const apiPaths = {
  user: {
    login: "user/login",
    register: "user/register",
    refresh: "user/token/refresh",
    current: "user/current",
  },
  dashboard: {
    stats: "dashboard/stats/",
    recentActivities: "dashboard/recent-activities/",
    notifications: "dashboard/notifications/",
    societySpotlight: "dashboard/society-spotlight/",
    eventCalendar: "dashboard/events-calendar/",
  },
};

// API Endpoints
export const getDashboardStats = async () => {
  const response = await apiClient.get(apiPaths.dashboard.stats);
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await apiClient.get(apiPaths.dashboard.recentActivities);
  return response.data;
};

export const getNotifications = async () => {
  const response = await apiClient.get(apiPaths.dashboard.notifications);
  return response.data;
};

export const getSocietySpotlight = async () => {
  const response = await apiClient.get(apiPaths.dashboard.societySpotlight);
  return response.data;
};

export const getEventCalendar = async () => {
  const response = await apiClient.get(apiPaths.dashboard.eventCalendar);
  return response.data;
};

export default apiClient;
