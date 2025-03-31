import { ChangeEvent, FormEvent } from "react";
import { Event } from "../../types";

export interface FormErrors {
  title?: string;
  main_description?: string;
  date?: string;
  start_time?: string;
  duration?: string;
  location?: string;
  hosted_by?: string;
  [key: string]: string | undefined;
}

export interface Notification {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export interface EventFormState {
  event: Event | null;
  formData: Event | null;
  loading: boolean;
  saving: boolean;
  errors: FormErrors;
}

export interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  InputLabelProps?: {
    shrink: boolean;
  };
  placeholder?: string;
  fullWidth?: boolean;
}

export interface ActionButtonsProps {
  onReset: () => void;
  saving: boolean;
}

export interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

export interface LoadingSpinnerProps {
  color?: "primary" | "secondary";
}

export interface BackButtonProps {
  onClick: () => void;
}

export interface EventFormProps {
  formData: Event;
  errors: FormErrors;
  saving: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
}