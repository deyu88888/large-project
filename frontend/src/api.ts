import axios from "axios";
import { ACCESS_TOKEN } from "./constants";
// Define base API URL properly
const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
// Update your apiClient creation:
export const apiClient = axios.create({
baseURL: apiUrl,
headers: {
"Content-Type": "application/json",
 },
// Add this to prevent trailing slashes
paramsSerializer: {
indexes: null
 }
});
// Attach Authorization token for every request (only if it exists)
apiClient.interceptors.request.use(
 (config) => {
const token = localStorage.getItem(ACCESS_TOKEN);
console.log("Request URL:", config.url);
console.log("Full URL:", apiUrl + config.url);
console.log("Authorization Token:", token);
if (token) {
config.headers.Authorization = `Bearer ${token}`;
 }
return config;
 },
 (error) => Promise.reject(error)
);
export const apiPaths = {
USER: {
LOGIN: "/api/user/login", // TODO: DONT ADD BACKSLASH
REGISTER: "/api/user/register", // TODO: DONT ADD BACKSLASH
REQUEST_OTP: "/api/request-otp",
VERIFY_OTP: "/api/verify-otp",
REFRESH: "/api/user/token/refresh", // TODO: DONT ADD BACKSLASH
CURRENT: "/api/user/current", // TODO: DONT ADD BACKSLASH
SOCIETY: "/api/society/request/approved", // TODO: DONT ADD BACKSLASH
REJECTEDSOCIETY: "/api/society/request/rejected", // TODO: DONT ADD BACKSLASH
STUDENTS: "/api/user/student", // TODO: DONT ADD BACKSLASH
ADMIN: "/api/user/admin", // TODO: DONT ADD BACKSLASH
PENDINGSOCIETYREQUEST: "/api/society/request/pending", // TODO: DONT ADD BACKSLASH
PROFILE: "/api/user/profile", // TODO: DONT ADD BACKSLASH
REPORT: "/api/report-to-admin", // TODO: DONT ADD BACKSLASH
PENDINGEVENTREQUEST: "/api/event/request/pending", // TODO: DONT ADD BACKSLASH
REJECTEDEVENT: "/api/admin-panel/rejected-event", // TODO: DONT ADD BACKSLASH
PENDINGDESCRIPTIONREQUEST: "/api/description/request/pending",
BASE: "/api/users",
 },
SOCIETY: {
POPULAR_SOCIETIES: "/api/popular-societies", // TODO: DONT ADD BACKSLASH
RECOMMENDED_SOCIETIES: "/api/recommended-societies", // New endpoint for recommendations
RECOMMENDATION_EXPLANATION: (id: number) => `/api/society-recommendation/${id}/explanation/`,
RECOMMENDATION_FEEDBACK: (id: number) => `/api/society-recommendation/${id}/feedback/`,
RECOMMENDATION_FEEDBACK_LIST: "/api/society-recommendation/feedback/",
RECOMMENDATION_FEEDBACK_ANALYTICS: "/api/recommendation-feedback/analytics/",
MANAGE_DETAILS: (id: number) => `/api/manage-society-details/${id}`, // TODO: DONT ADD BACKSLASH
 },
EVENTS: {
ALL: "/api/events", // TODO: DONT ADD BACKSLASH
PENDINGEVENTREQUEST: "api/society/event/pending", // TODO: DONT ADD BACKSLASH
UPDATEENEVENTREQUEST: "api/society/event/request", // TODO: DONT ADD BACKSLASH
APPROVEDEVENTLIST: "api/society/event/approved", // TODO: DONT ADD BACKSLASH
REJECTEDEVENTLIST: "api/society/event/rejected", // TODO: DONT ADD BACKSLASH
 },
};

// Enhanced Society interface with category
export interface Society {
  id: number;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  status?: string;
  create_date?: string;
  member_count?: number;
  event_count?: number;
  // Any other society fields you have
}

// Enhanced types for recommendation responses with all explanation types
export interface RecommendationExplanation {
  type: "popular" | "category" | "tags" | "content" | "semantic" | "general";
  message: string;
}

export interface SocietyRecommendation {
  society: Society;  // Now using the proper Society interface
  explanation: RecommendationExplanation;
}

// Types for recommendation feedback
export interface RecommendationFeedback {
  id?: number;
  society_id: number;
  rating: number;
  relevance: number;
  comment?: string;
  is_joined: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackAnalytics {
  total_feedback: number;
  average_rating: number;
  join_count: number;
  conversion_rate: number;
}

// Fetch Most Popular Societies
export const getPopularSocieties = async () => {
try {
const response = await apiClient.get(apiPaths.SOCIETY.POPULAR_SOCIETIES);
return response.data;
 } catch (error: any) {
console.error(
"Error fetching popular societies:",
error.response?.data || error.message
 );
throw error;
 }
};

// Fetch Recommended Societies with enhanced type safety
export const getRecommendedSocieties = async (limit: number = 5) => {
  try {
    const response = await apiClient.get(`${apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=${limit}`);
    return response.data as SocietyRecommendation[];
  } catch (error: any) {
    console.error(
      "Error fetching recommended societies:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Fetch explanation for a specific society recommendation
export const getRecommendationExplanation = async (societyId: number) => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_EXPLANATION(societyId));
    return response.data as RecommendationExplanation;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation explanation:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Submit feedback for a society recommendation
export const submitRecommendationFeedback = async (societyId: number, feedback: RecommendationFeedback) => {
  try {
    const response = await apiClient.post(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId), feedback);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error submitting recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update feedback for a society recommendation
export const updateRecommendationFeedback = async (societyId: number, feedback: Partial<RecommendationFeedback>) => {
  try {
    const response = await apiClient.put(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId), feedback);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error updating recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get feedback for a specific society recommendation
export const getRecommendationFeedback = async (societyId: number) => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId));
    return response.data as RecommendationFeedback;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get all feedback from the student
export const getAllRecommendationFeedback = async () => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST);
    return response.data as RecommendationFeedback[];
  } catch (error: any) {
    console.error(
      "Error fetching all recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get feedback analytics (admin only)
export const getRecommendationFeedbackAnalytics = async () => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_ANALYTICS);
    return response.data as FeedbackAnalytics;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation feedback analytics:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Fetch All Events (Public Access)
export const getAllEvents = async () => {
try {
const response = await apiClient.get(apiPaths.EVENTS.ALL);
return response.data;
 } catch (error: any) {
console.error(
"Error fetching events:",
error.response?.data || error.message
 );
throw error;
 }
};