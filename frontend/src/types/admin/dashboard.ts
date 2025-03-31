import { ColorTokens } from "../../theme/theme";

export interface User {
  user: User | null;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  major?: string;
  email: string;
  role: "student" | "admin";
  is_super_admin: boolean;
  is_superuser: boolean;
  is_president?: boolean;
  is_vice_president?: boolean;
  is_event_manager?: boolean;
  president_of?: number;
  vice_president_of_society?: number;
  event_manager_of_society?: number;
  isStaff: boolean;
  following: number[];
  followers: number[];
  following_count?: number;
  followers_count?: number;
  fullName: string;
  isStudent(): boolean;
  isAdmin(): boolean;
  is_active: boolean;
  is_following?: boolean;
  icon?: string;
}

export interface UserStats {
  totalUsers: number;
  [key: string]: any;
}

export interface Event {
  id: number | string;
  title?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  status?: string;
  hosted_by?: number;
  main_description?: string;
  description?: string;
  location?: string;
  duration?: string;
  max_capacity?: number;
  current_attendees?: number[];
  [key: string]: any;
}

export interface Notification {
  id: number | string;
  header?: string;
  body?: string;
  is_read?: boolean;
  [key: string]: any;
}

export interface Publication {
  id: number | string;
  news_post_title?: string;
  society_name?: string;
  requester_name?: string;
  status?: string;
  [key: string]: any;
}

export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
}

export interface NotificationCardProps {
  message: string;
  isRead: boolean;
}

export interface PublicationSectionProps {
  publications: Publication[];
  colors: ColorTokens | any;
  onNavigate: (path: string) => void;
}

export interface NotificationsSectionProps {
  notifications: Notification[];
  colors: ColorTokens | any;
}

export interface StatsSectionProps {
  userStats: UserStats;
  eventsCount: number;
  notificationsCount: number;
  publicationsCount: number;
  colors: ColorTokens | any;
}

export interface DashboardContentProps {
  loading: boolean;
  userStats: UserStats | null;
  events: Event[];
  notifications: Notification[];
  pendingPublications: Publication[];
  user: User | any;
  colors: ColorTokens | any;
  onNavigate: (path: string) => void;
}

export interface LoadingStateProps {
  color: string;
}