import React from "react";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme/theme";
import { Society } from "./society";
import { TransformedEvent } from "./event";
import { Notification } from "./notification";
import { AwardAssignment } from "./award";
import { User } from "../user/user";

export interface StudentDashboardProps {}

export interface StyleProps {
  colours: ReturnType<typeof tokens>;
}

export interface Student {
  id?: number;
  is_president?: boolean;
  is_vice_president?: boolean;
  is_event_manager?: boolean;
  president_of?: number;
  president_of_society_name?: string;
  vice_president_of_society?: number;
  vice_president_of_society_name?: string;
  event_manager_of_society?: number;
}

export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "error" | "warning" | "info" | "success";
}

export interface DashboardData {
  societies: Society[];
  events: TransformedEvent[];
  notifications: Notification[];
  awards: AwardAssignment[];
  student: Student | null;
}

export interface HeaderProps {
  student: Student | null;
  navigate: ReturnType<typeof useNavigate>;
  styleProps: StyleProps;
}

export interface StatCardsProps {
  societies: Society[];
  events: TransformedEvent[];
  notifications: Notification[];
  awards: AwardAssignment[];
  styleProps: StyleProps;
  getMyEventsCount: () => number;
}

export interface SocietyTabProps {
  societies: Society[];
  handleLeaveSociety: (societyId: number) => Promise<void>;
  styleProps: StyleProps;
}

export interface EventTabProps {
  events: TransformedEvent[];
  societies: Society[];
  userId?: number;
  handleRSVP: (eventId: number, isAttending: boolean) => Promise<void>;
  styleProps: StyleProps;
}

export interface NotificationTabProps {
  notifications: Notification[];
  markNotificationAsRead: (id: number) => Promise<void>;
  styleProps: StyleProps;
}

export interface AwardTabProps {
  awards: AwardAssignment[];
  styleProps: StyleProps;
}

export interface StartSocietySectionProps {
  navigate: ReturnType<typeof useNavigate>;
  student: Student | null;
  styleProps: StyleProps;
}

export interface CalendarSectionProps {
  showCalendar: boolean;
  toggleCalendar: () => void;
  student: Student | null;
  navigate: ReturnType<typeof useNavigate>;
  societies: Society[];
  events: TransformedEvent[];
  styleProps: StyleProps;
}

export interface EventDateProps {
  date: string;
  startTime?: string;
}

export interface EventLocationProps {
  location?: string;
}

export interface EventHostProps {
  hostName: string;
}

export interface EventCardProps {
  event: TransformedEvent;
  hostName: string;
  onRSVP: () => void;
  styleProps: StyleProps;
  userAttending?: boolean;
  eventStarted?: boolean;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  styleProps: StyleProps;
}

export interface EventManagerButtonProps {
  student: Student | null;
  navigate: ReturnType<typeof useNavigate>;
  styleProps: StyleProps;
}

export interface TabsContainerProps {
  activeTab: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabColors: string[];
  children: React.ReactNode;
}