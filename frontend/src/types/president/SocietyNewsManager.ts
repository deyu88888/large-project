export interface NewsPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: "Draft" | "PendingApproval" | "Rejected" | "Published" | "Archived";
  admin_notes?: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  view_count: number;
  image_url: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  author_data: {
    id: number;
    username: string;
    full_name: string;
  };
  comment_count: number;
}

export interface SocietyNewsManagerProps {
  onBack?: () => void;
}