import { useState } from "react";
import { apiClient } from "../../api";

export const fetchPendingRequests = async (path: string, ) => {
  try {
    const res = await apiClient.get(path);
    return res.data;
  } catch (error) {
    console.error(`Error from ${path}:`, error);
  }
};
