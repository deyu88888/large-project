/******************************************************************************
 * src/api.ts
 *
 * This file merges your existing code (axios instance, constants, society
 * recommendation, events, etc.) with new News/Comments APIs in one place.
 ******************************************************************************/
import axios from "axios";
import { ACCESS_TOKEN } from "./constants";
function isTokenValid(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    }
    catch (err) {
        console.warn("Invalid token format", err);
        return false;
    }
}
// ---------------------------------------------------------------------------
// 1) BASE API CONFIGURATION
// ---------------------------------------------------------------------------
const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const apiClient = axios.create({
    baseURL: apiUrl,
    paramsSerializer: {
        indexes: null,
    },
});
// Attach Authorization token for every request (only if it exists)
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    console.log("Request URL:", config.url);
    console.log("Full URL:", apiUrl + config.url);
    console.log("Authorization Token:", token);
    if (token && isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    else {
        delete config.headers.Authorization;
    }
    console.log("config:", config);
    return config;
}, (error) => Promise.reject(error));
// ---------------------------------------------------------------------------
// 2) PATHS & INTERFACES
// ---------------------------------------------------------------------------
export const apiPaths = {
    USER: {
        LOGIN: "/api/user/login", // TODO: DONT ADD BACKSLASH
        REGISTER: "/api/user/register", // TODO: DONT ADD BACKSLASH
        REQUEST_OTP: "/api/verification/request-otp",
        VERIFY_OTP: "/api/verification/verify-otp",
        REFRESH: "/api/user/token/refresh", // TODO: DONT ADD BACKSLASH
        CURRENT: "/api/user/current/", // TODO: DONT ADD BACKSLASH
        USERSTATS: "/api/admin/user-stats/", // TODO: DONT REMOVE BACKSLASH
        SOCIETY: "/api/admin/society/request/approved", // TODO: DONT ADD BACKSLASH
        REJECTEDSOCIETY: "/api/admin/society/request/rejected", // TODO: DONT ADD BACKSLASH
        STUDENTS: "/api/admin/student", // student list for admins
        ADMIN: "/api/admin/admin", // admin list for admins
        PENDINGSOCIETYREQUEST: "/api/admin/society/request/pending", // TODO: DONT ADD BACKSLASH
        PROFILE: "/api/user/profile", // TODO: DONT ADD BACKSLASH
        REPORT: "/api/admin/report-to-admin", // TODO: DONT ADD BACKSLASH
        PENDINGEVENTREQUEST: "/api/event/request/pending", // TODO: DONT ADD BACKSLASH
        REJECTEDEVENT: "/api/admin-panel/rejected-event", // TODO: DONT ADD BACKSLASH
        PENDINGDESCRIPTIONREQUEST: "/api/admin/description/request/pending",
        BASE: "/api/users",
        ADMINVIEW: (adminId) => `/api/admin/manage-admin/${adminId}`,
        ADMINSTUDENTVIEW: (studentId) => `/api/admin/manage-student/${studentId}`,
        ADMINSOCIETYVIEW: (societyId) => `/api/admin/manage-society/${societyId}`, // admin society view
        ADMINEVENTVIEW: (eventId) => `/api/admin/manage-event/${eventId}`,
        DELETE: (targetType, targetId) => `/api/admin/delete/${targetType}/${targetId}`,
        UNDO_DELETE: (logId) => `/api/undo-delete/${logId}`,
        ACTIVITYLOG: "/api/admin/activity-log",
        DELETEACTIVITYLOG: (logId) => `/api/admin/delete-activity-log/${logId}`,
    },
    SOCIETY: {
        All: "/api/dashboard/all-societies",
        POPULAR_SOCIETIES: "/api/dashboard/popular-societies/", // TODO: DONT ADD BACKSLASH
        RECOMMENDED_SOCIETIES: "/api/recommended-societies", // New endpoint for recommendations
        RECOMMENDATION_EXPLANATION: (id) => `/api/society-recommendation/${id}/explanation/`,
        RECOMMENDATION_FEEDBACK: (id) => `/api/society-recommendation/${id}/feedback/`,
        RECOMMENDATION_FEEDBACK_LIST: "/api/society-recommendation/feedback/",
        RECOMMENDATION_FEEDBACK_ANALYTICS: "/api/recommendation-feedback/analytics/",
        MANAGE_DETAILS: (id) => `/api/society/manage/${id}/`,
        DETAIL_REQUEST: `/api/admin/society-detail-request/`,
    },
    EVENTS: {
        ALL: "/api/events", // TODO: DONT ADD BACKSLASH
        PENDINGEVENTREQUEST: "api/admin/society/event/pending", // TODO: DONT ADD BACKSLASH
        UPDATEENEVENTREQUEST: "api/admin/society/event/request", // TODO: DONT ADD BACKSLASH
        APPROVEDEVENTLIST: "api/admin/society/event/approved", // TODO: DONT ADD BACKSLASH
        REJECTEDEVENTLIST: "api/admin/society/event/rejected", // TODO: DONT ADD BACKSLASH
    },
};
// ---------------------------------------------------------------------------
// 4) SOCIETY RECOMMENDATION API CALLS
// ---------------------------------------------------------------------------
export const getPopularSocieties = async () => {
    try {
        const response = await apiClient.get(apiPaths.SOCIETY.POPULAR_SOCIETIES);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching popular societies:", error.response?.data || error.message);
        throw error;
    }
};
export const getRecommendedSocieties = async (limit = 5) => {
    try {
        const response = await apiClient.get(`${apiPaths.SOCIETY.RECOMMENDED_SOCIETIES}?limit=${limit}`);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching recommended societies:", error.response?.data || error.message);
        throw error;
    }
};
export const getRecommendationExplanation = async (societyId) => {
    try {
        const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_EXPLANATION(societyId));
        return response.data;
    }
    catch (error) {
        console.error("Error fetching recommendation explanation:", error.response?.data || error.message);
        throw error;
    }
};
export const submitRecommendationFeedback = async (societyId, feedback) => {
    try {
        const response = await apiClient.post(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId), feedback);
        return response.data;
    }
    catch (error) {
        console.error("Error submitting recommendation feedback:", error.response?.data || error.message);
        throw error;
    }
};
export const updateRecommendationFeedback = async (societyId, feedback) => {
    try {
        const response = await apiClient.put(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId), feedback);
        return response.data;
    }
    catch (error) {
        console.error("Error updating recommendation feedback:", error.response?.data || error.message);
        throw error;
    }
};
export const getRecommendationFeedback = async (societyId) => {
    try {
        const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK(societyId));
        return response.data;
    }
    catch (error) {
        console.error("Error fetching recommendation feedback:", error.response?.data || error.message);
        throw error;
    }
};
export const getAllRecommendationFeedback = async () => {
    try {
        const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_LIST);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching all recommendation feedback:", error.response?.data || error.message);
        throw error;
    }
};
export const getRecommendationFeedbackAnalytics = async () => {
    try {
        const response = await apiClient.get(apiPaths.SOCIETY.RECOMMENDATION_FEEDBACK_ANALYTICS);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching recommendation feedback analytics:", error.response?.data || error.message);
        throw error;
    }
};
// ---------------------------------------------------------------------------
// 5) EVENTS API CALLS
// ---------------------------------------------------------------------------
export const getAllEvents = async () => {
    try {
        const response = await apiClient.get("/api/events/all");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching events:", error.response?.data || error.message);
        throw error;
    }
};
export const getUpcomingEvents = async () => {
    try {
        const response = await apiClient.get("/api/dashboard/events/upcoming/");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching upcoming events:", error);
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
export async function getNewsPostDetail(newsId) {
    const response = await apiClient.get(`/api/news/${newsId}/`);
    return response.data;
}
/**
 * Fetch top-level (and nested) comments for a specific news post.
 */
export async function getNewsComments(newsId) {
    const response = await apiClient.get(`/api/news/${newsId}/comments/`);
    return response.data;
}
/**
 * Create a new comment on a specific news post (top-level or reply).
 */
export async function createNewsComment(newsId, payload) {
    const response = await apiClient.post(`/api/news/${newsId}/comments/`, payload);
    return response.data;
}
/**
 * Update an existing comment by its ID (only author can do this).
 */
export async function updateNewsComment(commentId, payload) {
    const response = await apiClient.put(`/api/news/comments/${commentId}/`, payload);
    return response.data;
}
/**
 * Delete an existing comment by ID (author or officer).
 */
export async function deleteNewsComment(commentId) {
    await apiClient.delete(`/api/news/comments/${commentId}/`);
}
/**
 * Toggle like/unlike on a specific news comment.
 */
export async function toggleLikeOnNewsComment(commentId) {
    const response = await apiClient.post(`/api/news/comments/${commentId}/like/`);
    return response.data;
}
/**
 * Toggle dislike/undislike on a specific news comment.
 */
export async function toggleDislikeOnNewsComment(commentId) {
    const response = await apiClient.post(`/api/news/comments/${commentId}/dislike/`);
    return response.data;
}
