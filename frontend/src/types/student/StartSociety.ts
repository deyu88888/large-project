import React from "react";
import { tokens } from "../../theme/theme";

export interface StyleProps {
  isLight: boolean;
  colours: ReturnType<typeof tokens>;
}

export interface FormData {
  societyName: string;
  description: string;
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