import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);
export const setAccessToken = (token: string) => localStorage.setItem(ACCESS_TOKEN, token);
export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_TOKEN, token);
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};

export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch (err) {
    clearTokens();
    return false;
  }
};