import axios from "axios";

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api/";

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// API Paths
export const apiPaths = {
  login: "user/login",
  register: "user/register",
  dashboardStats: "dashboard/stats/",
  recentActivities: "dashboard/recent-activities/",
  notifications: "dashboard/notifications/",
  societySpotlight: "dashboard/society-spotlight/",
  eventCalendar: "dashboard/events-calendar/",
};

// API Endpoints
export const getDashboardStats = async () => {
  const response = await apiClient.get(apiPaths.dashboardStats);
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await apiClient.get(apiPaths.recentActivities);
  return response.data;
};

export const getNotifications = async () => {
  const response = await apiClient.get(apiPaths.notifications);
  return response.data;
};

export const getSocietySpotlight = async () => {
  const response = await apiClient.get(apiPaths.societySpotlight);
  return response.data;
};

export const getEventCalendar = async () => {
  const response = await apiClient.get(apiPaths.eventCalendar);
  return response.data;
};

export default apiClient;