import { tokens } from "../../theme/theme";

// Style Props for theme handling
export interface StyleProps {
  isLight: boolean;
  colours: ReturnType<typeof tokens>;
}

// Notification data interface
export interface Notification {
  id: number;
  header: string;
  body: string;
  is_read: boolean;
  created_at?: string;
  send_time?: string;
  type?: string;
  report_id?: number;
}

// Component prop interfaces
export interface HeaderProps {
  styleProps: StyleProps;
}

export interface LoadingStateProps {
  styleProps: StyleProps;
}

export interface EmptyStateProps {
  styleProps: StyleProps;
}

export interface MarkAsReadButtonProps {
  notificationId: number;
  notificationType?: string;
  onMarkAsRead: (id: number, type?: string) => Promise<void>;
  styleProps: StyleProps;
}

export interface DeleteButtonProps {
  notificationId: number;
  notificationType?: string;
  onDelete: (id: number, type?: string) => Promise<void>;
  styleProps: StyleProps;
}

export interface ViewReplyButtonProps {
  reportId: number;
  onNavigate: (path: string) => void;
  styleProps: StyleProps;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number, type?: string) => Promise<void>;
  onDelete: (id: number, type?: string) => Promise<void>;
  onNavigate: (path: string) => void;
  styleProps: StyleProps;
}

export interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: number, type?: string) => Promise<void>;
  onDelete: (id: number, type?: string) => Promise<void>;
  onNavigate: (path: string) => void;
  styleProps: StyleProps;
}

export interface PageContainerProps {
  children: React.ReactNode;
  styleProps: StyleProps;
}