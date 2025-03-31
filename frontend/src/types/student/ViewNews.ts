import React from "react";
import { tokens } from "../../theme/theme";
import { News } from "../../types";

// Style Props for theme handling
export interface StyleProps {
  isLight: boolean;
  colours: ReturnType<typeof tokens>;
}

// Extended News item interface
export interface NewsItem extends News {
  is_read?: boolean;
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

export interface NewsItemProps {
  item: NewsItem;
  onMarkAsRead: (id: number) => Promise<void>;
  styleProps: StyleProps;
}

export interface NewsListProps {
  news: NewsItem[];
  onMarkAsRead: (id: number) => Promise<void>;
  styleProps: StyleProps;
}