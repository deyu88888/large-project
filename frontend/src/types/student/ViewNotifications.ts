import React from "react";
import { tokens } from "../../theme/theme";

// Base notification data interface
export interface Notification {
  id: number;
  header: string;
  body: string;
  is_read: boolean;
}

// Style Props for theme handling
export interface StyleProps {
  isLight: boolean;
  colours: ReturnType<typeof tokens>;
}

// Component prop interfaces
export interface PageContainerProps {
  children: React.ReactNode;
  styleProps: StyleProps;
}

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
  onMarkAsRead: () => void;
  styleProps: StyleProps;
}

export interface ReadStatusProps {
  styleProps: StyleProps;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => Promise<void>;
  styleProps: StyleProps;
}

export interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => Promise<void>;
  styleProps: StyleProps;
}