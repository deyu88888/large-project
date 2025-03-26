export interface PublicationRequest {
    id: number;
    news_post: number;
    news_post_title: string;
    society_name: string;
    requested_by: number;
    requester_name: string;
    status: string;
    requested_at: string;
    reviewed_at: string | null;
    admin_notes: string | null;
    author_data: {
        id: number;
        username: string;
        full_name: string;
    };
}
export interface NewsContent {
    id: number;
    title: string;
    content: string;
    status: string;
    society_data?: {
        id: number;
        name: string;
    };
}
