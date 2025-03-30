import { useState } from "react";
import { apiClient } from "../../api";

interface ApiResponse<T> {
  data: T;
}

interface ApiError {
  message: string;
  path: string;
  error: unknown;
}

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

const makeGetRequest = async <T>(path: string): Promise<ApiResponse<T>> => {
  return await apiClient.get(path);
};

export const fetchPendingRequests = async <T extends any[]>(path: string): Promise<T> => {
  try {
    const response = await makeGetRequest<T>(path);
    return response.data;
  } catch (error) {
    const apiError = createApiError(path, error);
    logApiError(apiError);
    
    throw new Error(apiError.message);
  }
};