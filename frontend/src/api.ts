/******************************************************************************
 * src/api.ts
 *
 * This file merges your existing code (axios instance, constants, society
 * recommendation, events, etc.) with new News/Comments APIs in one place.
 ******************************************************************************/

import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// ---------------------------------------------------------------------------
// 1) BASE API CONFIGURATION
// ---------------------------------------------------------------------------
const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: {
    indexes: null,
  },
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

// ---------------------------------------------------------------------------
// 2) PATHS & INTERFACES
// ---------------------------------------------------------------------------
export const apiPaths = {
  USER: {
    LOGIN: "/api/user/login",
    REGISTER: "/api/user/register",
    REQUEST_OTP: "/api/request-otp",
    VERIFY_OTP: "/api/verify-otp",
    REFRESH: "/api/user/token/refresh",
    CURRENT: "/api/user/current",
    SOCIETY: "/api/society/request/approved",
    REJECTEDSOCIETY: "/api/society/request/rejected",
    STUDENTS: "/api/user/student",
    ADMIN: "/api/user/admin",
    PENDINGSOCIETYREQUEST: "/api/society/request/pending",
    PROFILE: "/api/user/profile",
    REPORT: "/api/report-to-admin",
    PENDINGEVENTREQUEST: "/api/event/request/pending",
    REJECTEDEVENT: "/api/admin-panel/rejected-event",
    PENDINGDESCRIPTIONREQUEST: "/api/description/request/pending",
    BASE: "/api/users",
  },
  SOCIETY: {
    POPULAR_SOCIETIES: "/api/popular-societies",
    RECOMMENDED_SOCIETIES: "/api/recommended-societies",
    RECOMMENDATION_EXPLANATION: (id: number) =>
      `/api/society-recommendation/${id}/explanation/`,
    RECOMMENDATION_FEEDBACK: (id: number) =>
      `/api/society-recommendation/${id}/feedback/`,
    RECOMMENDATION_FEEDBACK_LIST: "/api/society-recommendation/feedback/",
    RECOMMENDATION_FEEDBACK_ANALYTICS: "/api/recommendation-feedback/analytics/",
    MANAGE_DETAILS: (id: number) => `/api/manage-society-details/${id}`,
  },
  EVENTS: {
    ALL: "/api/events",
    PENDINGEVENTREQUEST: "api/society/event/pending",
    UPDATEENEVENTREQUEST: "api/society/event/request",
    APPROVEDEVENTLIST: "api/society/event/approved",
    REJECTEDEVENTLIST: "api/society/event/rejected",
  },
};

// Enhanced Society interface
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
}

// Recommendation Explanation
export interface RecommendationExplanation {
  type: "popular" | "category" | "tags" | "content" | "semantic" | "general";
  message: string;
}

export interface SocietyRecommendation {
  society: Society;
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

// ---------------------------------------------------------------------------
// 3) NEWS/COMMENTS API TYPES & ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * Data structure for a single news comment.
 * Adjust to match your `NewsCommentSerializer` in the backend exactly.
 */
export interface NewsCommentData {
  id: number;
  content: string;
  created_at: string;
  parent_comment: number | null;
  user_data?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  replies?: NewsCommentData[];
  likes_count: number;
  liked_by_user: boolean;
  dislikes_count: number;
  disliked_by_user: boolean;
}

export interface CommentPayload {
  content: string;
  parent_comment?: number | null;
}

export interface NewsPostDetail {
  id: number;
  title: string;
  content: string;
  published_at: string | null;
  status: string;
  view_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  // etc.
}

// ---------------------------------------------------------------------------
// 4) SOCIETY RECOMMENDATION API CALLS
// ---------------------------------------------------------------------------
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

export const getRecommendedSocieties = async (limit: number = 5) => {
  try {
    const response = await apiClient.get(
      `${apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=${limit}`
    );
    return response.data as SocietyRecommendation[];
  } catch (error: any) {
    console.error(
      "Error fetching recommended societies:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getRecommendationExplanation = async (societyId: number) => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_EXPLANATION(societyId)
    );
    return response.data as RecommendationExplanation;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation explanation:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const submitRecommendationFeedback = async (
  societyId: number,
  feedback: RecommendationFeedback
) => {
  try {
    const response = await apiClient.post(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId),
      feedback
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error submitting recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateRecommendationFeedback = async (
  societyId: number,
  feedback: Partial<RecommendationFeedback>
) => {
  try {
    const response = await apiClient.put(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId),
      feedback
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error updating recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getRecommendationFeedback = async (societyId: number) => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId)
    );
    return response.data as RecommendationFeedback;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getAllRecommendationFeedback = async () => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
    );
    return response.data as RecommendationFeedback[];
  } catch (error: any) {
    console.error(
      "Error fetching all recommendation feedback:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getRecommendationFeedbackAnalytics = async () => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_ANALYTICS
    );
    return response.data as FeedbackAnalytics;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation feedback analytics:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 5) EVENTS API CALLS
// ---------------------------------------------------------------------------
export const getAllEvents = async () => {
  try {
    const response = await apiClient.get(apiPaths.EVENTS.ALL);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching events:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 6) NEWS / COMMENTS API CALLS
// ---------------------------------------------------------------------------

/**
 * Fetch detail of a single news post by ID.
 * According to your backend, this also increments view count automatically.
 */
export async function getNewsPostDetail(newsId: number): Promise<NewsPostDetail> {
  const response = await apiClient.get<NewsPostDetail>(`/api/news/${newsId}/`);
  return response.data;
}

/**
 * Fetch top-level (and nested) comments for a specific news post.
 */
export async function getNewsComments(newsId: number): Promise<NewsCommentData[]> {
  const response = await apiClient.get<NewsCommentData[]>(`/api/news/${newsId}/comments/`);
  return response.data;
}

/**
 * Create a new comment on a specific news post (top-level or reply).
 */
export async function createNewsComment(
  newsId: number,
  payload: CommentPayload
): Promise<NewsCommentData> {
  const response = await apiClient.post<NewsCommentData>(
    `/api/news/${newsId}/comments/`,
    payload
  );
  return response.data;
}

/**
 * Update an existing comment by its ID (only author can do this).
 */
export async function updateNewsComment(
  commentId: number,
  payload: Partial<CommentPayload>
): Promise<NewsCommentData> {
  const response = await apiClient.put<NewsCommentData>(
    `/api/news/comments/${commentId}/`,
    payload
  );
  return response.data;
}

/**
 * Delete an existing comment by ID (author or officer).
 */
export async function deleteNewsComment(commentId: number): Promise<void> {
  await apiClient.delete(`/api/news/comments/${commentId}/`);
}

/**
 * Toggle like/unlike on a specific news comment.
 */
export async function toggleLikeOnNewsComment(
  commentId: number
): Promise<NewsCommentData> {
  const response = await apiClient.post<NewsCommentData>(
    `/api/news/comments/${commentId}/like/`
  );
  return response.data;
}

/**
 * Toggle dislike/undislike on a specific news comment.
 */
export async function toggleDislikeOnNewsComment(
  commentId: number
): Promise<NewsCommentData> {
  const response = await apiClient.post<NewsCommentData>(
    `/api/news/comments/${commentId}/dislike/`
  );
  return response.data;
}