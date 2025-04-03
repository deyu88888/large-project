import axios from "axios";
import { ACCESS_TOKEN } from "./constants";
import { REFRESH_TOKEN } from "./constants";
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch (err) {
    console.warn("Invalid token format", err);
    return false;
  }
}

const getApiUrl = (): string => {
  const protocol = window.location.protocol;
  const host = import.meta.env.VITE_API_URL || "localhost:8000";
  return `${protocol}//${host}`;
};

const apiUrl = getApiUrl();

export const apiClient = axios.create({
  baseURL: apiUrl,
  paramsSerializer: {
    indexes: null,
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const refreshResponse = await axios.post(`${apiUrl}${apiPaths.USER.REFRESH}`, {
          refresh: refreshToken
        });
        
        const { access } = refreshResponse.data;
        localStorage.setItem(ACCESS_TOKEN, access);
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // Clear tokens on refresh failure
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        
        // Redirect to login page
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const apiPaths = {
  USER: {
    LOGIN: "/api/user/login",
    REGISTER: "/api/user/register",
    REQUEST_OTP: "/api/verification/request-otp",
    VERIFY_OTP: "/api/verification/verify-otp",
    REFRESH: "/api/user/token/refresh",
    CURRENT: "/api/user/current/",
    USERSTATS: "/api/admin/user-stats/",
    SOCIETY: "/api/admin/society/request/approved",
    REJECTEDSOCIETY: "/api/admin/society/request/rejected",
    STUDENTS: "/api/admin/student",
    ADMIN: "/api/admin/admin",
    PENDINGSOCIETYREQUEST: "/api/admin/society/request/Pending",
    PROFILE: "/api/user/profile",
    REPORT: "/api/admin/report-to-admin",
    PENDINGEVENTREQUEST: "/api/event/request/pending",
    REJECTEDEVENT: "/api/admin-panel/rejected-event",
    PENDINGDESCRIPTIONREQUEST: "/api/admin/description/request/pending",
    BASE: "/api/users",

    ADMINVIEW: (adminId: number) => `/api/admin/manage-admin/${adminId}`,

    ADMINSTUDENTVIEW: (studentId: number) =>
      `/api/admin/manage-student/${studentId}`,
    ADMINSOCIETYVIEW: (societyId: number) =>
      `/api/admin/manage-society/${societyId}`,
    ADMINEVENTVIEW: (eventId: number) => `/api/admin/manage-event/${eventId}`,
    DELETE: (targetType: string, targetId: number) =>
      `/api/admin/delete/${targetType.toLowerCase()}/${targetId}`,
    UNDO_DELETE: (logId: number) => `/api/admin/undo-delete/${logId}`,
    ACTIVITYLOG: "/api/admin/activity-log",
    DELETEACTIVITYLOG: (logId: number) =>
      `/api/admin/delete-activity-log/${logId}`,
  },
  SOCIETY: {
    All: "/api/dashboard/all-societies",
    POPULAR_SOCIETIES: "/api/dashboard/popular-societies/",
    RECOMMENDED_SOCIETIES: "/api/recommendations/",
    RECOMMENDATION_FEEDBACK: (id: number) =>
      `/api/recommendations/${id}/feedback/`,
    RECOMMENDATION_EXPLANATION: (id: number) =>
      `/api/recommendations/${id}/explanation/`,
    RECOMMENDATION_FEEDBACK_LIST: "/api/recommendations/feedback/",
    RECOMMENDATION_FEEDBACK_ANALYTICS:
      "/api/recommendations/feedback/analytics/",
    MANAGE_DETAILS: (id: number) => `/api/society/manage/${id}/`,
    DETAIL_REQUEST: `/api/admin/society-detail-request/`,
  },
  EVENTS: {
    ALL: "/api/events",
    PENDINGEVENTREQUEST: "api/admin/society/event/pending",
    UPDATEENEVENTREQUEST: "api/admin/society/event/request",
    APPROVEDEVENTLIST: "api/admin/society/event/approved",
    REJECTEDEVENTLIST: "api/admin/society/event/rejected",
  },
};

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

export interface RecommendationExplanation {
  type: "popular" | "category" | "tags" | "content" | "semantic" | "general";
  message: string;
}

export interface SocietyRecommendation {
  society: Society;
  explanation: RecommendationExplanation;
}

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
}

export const getPopularSocieties = async () => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.POPULAR_SOCIETIES);
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      return Array.isArray(response.data.results) ? response.data.results : [];
    }
    return [];
  } catch (error: any) {
    console.error(
      "Error fetching popular societies:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const getRecommendedSocieties = async (limit: number = 5) => {
  try {
    const response = await apiClient.get(
      `${apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=${limit}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    if (
      error.response &&
      (error.response.status === 404 || error.response.status === 405)
    ) {
      console.log(
        "No specific recommendations available - showing default societies instead."
      );

      try {
        const fallbackResponse = await apiClient.get("/api/society/join");
        if (Array.isArray(fallbackResponse.data)) {
          return fallbackResponse.data.map((society: any) => ({
            society,
            explanation: {
              type: "popular",
              message: "Suggested society for new members",
            },
          }));
        }
      } catch (fallbackErr) {
        console.error("Fallback fetch failed:", fallbackErr);
      }
    }

    console.error(
      "Error fetching recommended societies:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const getRecommendationExplanation = async (societyId: number) => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_EXPLANATION(societyId)
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation explanation:",
      error.response?.data || error.message
    );
    return { type: "general", message: "No explanation available" };
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
    return null;
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
    return null;
  }
};

export const getRecommendationFeedback = async (societyId: number) => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
    );
    
    if (response.data && Array.isArray(response.data)) {
      const feedback = response.data.find(item => item.society_id === societyId);
      
      if (feedback) {
        console.log(`Found existing feedback for society ${societyId} in the list`);
        return feedback;
      }
    }
    
    console.log(`No existing feedback found for society ${societyId}`);
    return null;
  } catch (error: any) {
    console.log(`Could not check for feedback for society ${societyId}: ${error.message}`);
    return null;
  }
};

export const getAllRecommendationFeedback = async () => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(
      "Error fetching all recommendation feedback:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const getRecommendationFeedbackAnalytics = async () => {
  try {
    const response = await apiClient.get(
      apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_ANALYTICS
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching recommendation feedback analytics:",
      error.response?.data || error.message
    );
    return {
      total_feedback: 0,
      average_rating: 0,
      join_count: 0,
      conversion_rate: 0,
    };
  }
};

export const getAllEvents = async () => {
  try {
    const response = await apiClient.get("/api/events/all");
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      return Array.isArray(response.data.results) ? response.data.results : [];
    }
    return [];
  } catch (error: any) {
    console.error(
      "Error fetching events:",
      error.response?.data || error.message
    );
    return [];
  }
};

export const getUpcomingEvents = async () => {
  try {
    const response = await apiClient.get("/api/dashboard/events/upcoming/");
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      return Array.isArray(response.data.results) ? response.data.results : [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
};

export async function getNewsPostDetail(
  newsId: number
): Promise<NewsPostDetail | null> {
  try {
    const response = await apiClient.get<NewsPostDetail>(`/api/news/${newsId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching news post detail:", error);
    return null;
  }
}

export async function getNewsComments(
  newsId: number
): Promise<NewsCommentData[]> {
  try {
    const response = await apiClient.get<NewsCommentData[]>(
      `/api/news/${newsId}/comments/`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching news comments:", error);
    return [];
  }
}

export async function createNewsComment(
  newsId: number,
  payload: CommentPayload
): Promise<NewsCommentData | null> {
  try {
    const response = await apiClient.post<NewsCommentData>(
      `/api/news/${newsId}/comments/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating news comment:", error);
    return null;
  }
}

export async function updateNewsComment(
  commentId: number,
  payload: Partial<CommentPayload>
): Promise<NewsCommentData | null> {
  try {
    const response = await apiClient.put<NewsCommentData>(
      `/api/news/comments/${commentId}/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error updating news comment:", error);
    return null;
  }
}

export async function deleteNewsComment(commentId: number): Promise<boolean> {
  try {
    await apiClient.delete(`/api/news/comments/${commentId}/`);
    return true;
  } catch (error) {
    console.error("Error deleting news comment:", error);
    return false;
  }
}

export async function toggleLikeOnNewsComment(
  commentId: number
): Promise<NewsCommentData | null> {
  try {
    const response = await apiClient.post<NewsCommentData>(
      `/api/news/comments/${commentId}/like/`
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling like on news comment:", error);
    return null;
  }
}

export async function toggleDislikeOnNewsComment(
  commentId: number
): Promise<NewsCommentData | null> {
  try {
    const response = await apiClient.post<NewsCommentData>(
      `/api/news/comments/${commentId}/dislike/`
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling dislike on news comment:", error);
    return null;
  }
}