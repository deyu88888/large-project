export interface Report {
  id: number;
  from_student: string | null;
  from_student_username?: string;
  email?: string | null;
  report_type: string;
  subject: string;
  details: string;
  created_at: string;
  requested_at?: string;
  latest_reply?: {
    replied_by: string;
    content: string;
    created_at: string;
  };
}

export interface ReportFormData {
  report_type: string;
  subject: string;
  details: string;
}

export type SelectChangeEvent = {
  target: {
    name: string;
    value: unknown;
  };
};

export interface Reply {
  id: number;
  report_id: number;
  report_subject: string;
  content: string;
  created_at: string;
  replied_by_username: string;
  is_admin_reply: boolean;
  child_replies: Reply[];
  user_type: 'admin' | 'student' | 'moderator';
  is_new: boolean;
};

export interface ReportThread {
  id: number;
  report_type: string;
  subject: string;
  details: string;
  requested_at: string;
  from_student_username: string;
  top_level_replies: Reply[];
};

export interface FlattenedMessage {
  id: number;
  subject: string;
  content: string;
  sender: string;
  timestamp: string;
  is_admin: boolean;
  is_original: boolean;
  level: number;
};