import React from "react";
import { tokens } from "../../theme/theme";
import { Member, ShowreelImage, SocialMediaLinks } from "./society";

export interface Society {
  id: number;
  name: string;
  description: string;
  society_members: number[];
  approved_by: number;
  status: string;
  category: string;
  social_media_links: SocialMediaLinks;
  showreel_images: ShowreelImage[];
  membership_requirements: string | null;
  upcoming_projects_or_plans: string | null;
  icon: string;
  tags: string[];
  vice_president: Member;
  event_manager: Member;
  president: Member;
}

export interface StyleProps {
  isLight: boolean;
  colours: ReturnType<typeof tokens>;
}

export interface FormData {
  societyName: string;
  description: string;
  category: string;
}

export interface FormState {
  error: string;
  success: string;
}

export interface HeaderProps {
  styleProps: StyleProps;
}

export interface FormContainerProps {
  children: React.ReactNode;
  styleProps: StyleProps;
  onSubmit: (e: React.FormEvent) => void;
}

export interface MessageProps {
  error?: string;
  success?: string;
  styleProps: StyleProps;
}

export interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  styleProps: StyleProps;
}

export interface SubmitButtonProps {
  styleProps: StyleProps;
}

export interface PageContainerProps {
  children: React.ReactNode;
  styleProps: StyleProps;
}