/******************************************************************************
 * src/api.ts
 *
 * This file merges your existing code (axios instance, constants, society
 * recommendation, events, etc.) with new News/Comments APIs in one place.
 ******************************************************************************/
export declare const apiClient: import("axios").AxiosInstance;
export declare const apiPaths: {
    USER: {
        LOGIN: string;
        REGISTER: string;
        REQUEST_OTP: string;
        VERIFY_OTP: string;
        REFRESH: string;
        CURRENT: string;
        USERSTATS: string;
        SOCIETY: string;
        REJECTEDSOCIETY: string;
        STUDENTS: string;
        ADMIN: string;
        PENDINGSOCIETYREQUEST: string;
        PROFILE: string;
        REPORT: string;
        PENDINGEVENTREQUEST: string;
        REJECTEDEVENT: string;
        PENDINGDESCRIPTIONREQUEST: string;
        BASE: string;
        ADMINVIEW: (adminId: number) => string;
        ADMINSTUDENTVIEW: (studentId: number) => string;
        ADMINSOCIETYVIEW: (societyId: number) => string;
        ADMINEVENTVIEW: (eventId: number) => string;
        DELETE: (targetType: string, targetId: number) => string;
        UNDO_DELETE: (logId: number) => string;
        ACTIVITYLOG: string;
        DELETEACTIVITYLOG: (logId: number) => string;
    };
    SOCIETY: {
        All: string;
        POPULAR_SOCIETIES: string;
        RECOMMENDED_SOCIETIES: string;
        RECOMMENDATION_EXPLANATION: (id: number) => string;
        RECOMMENDATION_FEEDBACK: (id: number) => string;
        RECOMMENDATION_FEEDBACK_LIST: string;
        RECOMMENDATION_FEEDBACK_ANALYTICS: string;
        MANAGE_DETAILS: (id: number) => string;
        DETAIL_REQUEST: string;
    };
    EVENTS: {
        ALL: string;
        PENDINGEVENTREQUEST: string;
        UPDATEENEVENTREQUEST: string;
        APPROVEDEVENTLIST: string;
        REJECTEDEVENTLIST: string;
    };
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
}
export declare const getPopularSocieties: () => Promise<any>;
export declare const getRecommendedSocieties: (limit?: number) => Promise<SocietyRecommendation[]>;
export declare const getRecommendationExplanation: (societyId: number) => Promise<RecommendationExplanation>;
export declare const submitRecommendationFeedback: (societyId: number, feedback: RecommendationFeedback) => Promise<any>;
export declare const updateRecommendationFeedback: (societyId: number, feedback: Partial<RecommendationFeedback>) => Promise<any>;
export declare const getRecommendationFeedback: (societyId: number) => Promise<RecommendationFeedback>;
export declare const getAllRecommendationFeedback: () => Promise<RecommendationFeedback[]>;
export declare const getRecommendationFeedbackAnalytics: () => Promise<FeedbackAnalytics>;
export declare const getAllEvents: () => Promise<any>;
export declare const getUpcomingEvents: () => Promise<any>;
/**
 * Fetch detail of a single news post by ID.
 * According to your backend, this also increments view count automatically.
 */
export declare function getNewsPostDetail(newsId: number): Promise<NewsPostDetail>;
/**
 * Fetch top-level (and nested) comments for a specific news post.
 */
export declare function getNewsComments(newsId: number): Promise<NewsCommentData[]>;
/**
 * Create a new comment on a specific news post (top-level or reply).
 */
export declare function createNewsComment(newsId: number, payload: CommentPayload): Promise<NewsCommentData>;
/**
 * Update an existing comment by its ID (only author can do this).
 */
export declare function updateNewsComment(commentId: number, payload: Partial<CommentPayload>): Promise<NewsCommentData>;
/**
 * Delete an existing comment by ID (author or officer).
 */
export declare function deleteNewsComment(commentId: number): Promise<void>;
/**
 * Toggle like/unlike on a specific news comment.
 */
export declare function toggleLikeOnNewsComment(commentId: number): Promise<NewsCommentData>;
/**
 * Toggle dislike/undislike on a specific news comment.
 */
export declare function toggleDislikeOnNewsComment(commentId: number): Promise<NewsCommentData>;
