import React from "react";
export interface SocietyDetailRequest {
    id: number;
    society: number;
    name: string;
    description: string;
    category: string;
    social_media_links: Record<string, string>;
    tags: string[];
    icon: string | null;
    membership_requirements: string | null;
    upcoming_projects_or_plans: string | null;
    intent: string;
    approved: boolean;
    created_at: string;
    vice_president?: number | null;
    event_manager?: number | null;
    president?: number | null;
    approved_by?: number | null;
    status: "Pending" | "Approved" | "Rejected";
    preview_requested?: boolean;
    from_: any;
}
declare const PendingSocietyDetailRequests: React.FC;
export default PendingSocietyDetailRequests;
