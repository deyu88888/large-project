import { useState } from "react";
import { apiClient } from "../../api";

// Interfaces
interface ApiResponse<T> {
  data: T;
}

interface ApiError {
  message: string;
  path: string;
  error: unknown;
}

// Error handling
const logApiError = (error: ApiError): void => {
  console.error(`Error from ${error.path}:`, error.error);
};

const createApiError = (path: string, error: unknown): ApiError => {
  return {
    message: `Failed to fetch data from ${path}`,
    path,
    error
  };
};

// API request
const makeGetRequest = async <T>(path: string): Promise<ApiResponse<T> | undefined> => {
  return await apiClient.get(path);
};

// Main exported function
export const fetchPendingRequests = async <T>(path: string): Promise<T | undefined> => {
  try {
    const response = await makeGetRequest<T>(path);
    return response?.data;
  } catch (error) {
    const apiError = createApiError(path, error);
    logApiError(apiError);
    return undefined;
  }
};