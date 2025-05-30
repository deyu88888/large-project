export type Society = {
    id: number;
    name: string;
    society_members: number[];
    // roles: {};
    president: {
      first_name: string;
      last_name: string;
    };
    description: string;
    category: string;
    social_media_links: Record<string, string>;
    timetable: string;
    membership_requirements: string;
    upcoming_projects_or_plans: string;
    tags: string[];
    icon: string | File | null;
    leader: string;
    roles: string[];
    status: string;
    approved_by: string;
  }

export type SocietyEvent = {        // avoid naming conflicts with JavaScript's built-in Event type
    id: number;
    title: string;
    description: string;
    date: string;
    startTime: string;
    duration: string;
    hostedBy: number;
    location: string;
  };

  export type Event = {
    cover_image: string;
    id: number;
    title: string;
    description?: string;
    main_description?: string;
    date: string;
    start_time: string;
    duration: string;
    hosted_by: number;
    location: string;
    status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  };

export type Student = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    role: string;
    major: string;
    societies: string[];
    president_of: number[];
    is_president: boolean;
  };

  export type News = {
    id: number;
    title: string;
    brief: string;
    content: string;
    // is_read: boolean;  // add after backend is fixed
  }
  
export type ActivityLog = {
  id: number;
  action_type: string;
  target_type: string;
  target_name: string;
  performed_by: string;
  timestamp: string;
  expiration_date?: string;
  reason?: string;
};

export type ReportReply = {
  id: number;
  report_id: number;
  report_subject: string;
  from_user: string;
  user_type: 'admin' | 'student' | 'moderator';
  content: string;
  created_at: string;
  is_new: boolean;
}

export type Admin = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  is_active: boolean;
  role: string;
  is_super_admin: boolean;
  full_name?: string;
  following?: number[];
  followers?: number[];
};

export type StatData = {
  totalSocieties: number;
  totalEvents: number;
  pendingApprovals: number;
  activeMembers: number;
}

export type Activity = {
  description: string;
}

export type Notification = {
  message: string;
}

export type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

export type Introduction = {
  title: string;
  content: string[];
}

export type RawEvent = {
  id: number;
  title: string;
  date: string;
  startTime: string;
  start_time?: string;
  duration?: string;
}

export type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export type TabPanelProps = {
  label: string;
  children: React.ReactNode;
}

export type SectionCardProps = {
  title: string;
  children: React.ReactNode;
}

export type StatCardProps ={
  title: string;
  value: number;
  color: string;
}

export type NavigationItem = {
  label: string;
  icon: React.ReactNode;
  ref: React.RefObject<HTMLElement> | null;
  scrollToSection: () => void;
}
