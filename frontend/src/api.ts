import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const apiUrl = "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiPaths = {
  USER: {
    LOGIN: "/api/user/login",
    REGISTER: "/api/user/register",
    REFRESH: "/api/user/token/refresh",
    CURRENT: "/api/user/current",
  },
};
