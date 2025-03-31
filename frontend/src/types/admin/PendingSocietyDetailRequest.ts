import { ExtraModule } from "../event/event";

export interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

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
    [key: string]: any;
    title: string;
    main_description: string;
    date: string;
    start_time: string;
    duration: string;
    location: string;
    max_capacity: number;
    cover_image_url?: string;
    cover_image_file?: File | null;
    extra_modules: ExtraModule[];
    participant_modules: ExtraModule[];
    is_participant: boolean;
    is_member: boolean;
    event_id: number;
    hosted_by: number;
    current_attendees: any[];
  }