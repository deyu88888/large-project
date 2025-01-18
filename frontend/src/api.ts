import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const apiUrl = "http://localhost:8000";

// for testing loading screens on api calls
const delay = (ms: number | undefined = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    await delay();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// add a response interceptor if needed (with delay)
apiClient.interceptors.response.use(
  async (response) => {
    await delay();
    return response;
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
