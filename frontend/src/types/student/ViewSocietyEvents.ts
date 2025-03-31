import React from "react";
import { tokens } from "../../theme/theme";
import { EventData } from "../../types/student/event";

// Style Props for theme handling
export interface StyleProps {
  colours: ReturnType<typeof tokens>;
}

// Society data interface
export interface Society {
  id: number;
  name: string;
}

// Component state interface
export interface ViewSocietyEventsState {
  events: EventData[];
  loading: boolean;
  societyName: string;
  error: string | null;
}

// Component prop interfaces
export interface PageHeaderProps {
  title: string;
  onBack: () => void;
  styleProps: StyleProps;
}

export interface LoadingStateProps {
  styleProps: StyleProps;
}

export interface ErrorStateProps {
  error: string;
  styleProps: StyleProps;
}

export interface EmptyStateProps {
  styleProps: StyleProps;
}

export interface EventStatusBadgeProps {
  status: string;
  styleProps: StyleProps;
}

export interface EventTimeProps {
  date: string;
  startTime?: string;
  duration?: string;
  styleProps: StyleProps;
}

export interface EventLocationProps {
  location: string;
  styleProps: StyleProps;
}

export interface RsvpButtonProps {
  eventId: number;
  isRsvped: boolean;
  onRsvp: (eventId: number, isAttending: boolean) => Promise<void>;
  styleProps: StyleProps;
}

export interface EventCardProps {
  event: EventData;
  onRsvp: (eventId: number, isAttending: boolean) => Promise<void>;
  isUpcoming: (dateStr: string) => boolean;
  styleProps: StyleProps;
}

export interface EventListProps {
  events: EventData[];
  onRsvp: (eventId: number, isAttending: boolean) => Promise<void>;
  isUpcoming: (dateStr: string) => boolean;
  styleProps: StyleProps;
}