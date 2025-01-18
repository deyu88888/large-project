import axios from "axios";

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api/";

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// API Endpoints
export const getDashboardStats = async () => {
  const response = await apiClient.get("dashboard/stats/");
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await apiClient.get("dashboard/recent-activities/");
  return response.data;
};

export const getNotifications = async () => {
  const response = await apiClient.get("dashboard/notifications/");
  return response.data;
};

export const getSocietySpotlight = async () => {
  const response = await apiClient.get("dashboard/society-spotlight/");
  return response.data;
};

export const getEventCalendar = async () => {
  const response = await apiClient.get("dashboard/events-calendar/");
  return response.data;
};

// Export the Axios client for any custom requests
export default apiClient;
