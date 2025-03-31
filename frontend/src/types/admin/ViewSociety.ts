import { ChangeEvent, FormEvent } from "react";
import { Society } from '../../types';

export interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  [key: string]: string | undefined;
}

export interface Notification {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export interface SocietyFormState {
  society: Society | null;
  formData: Society | null;
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
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  inputProps?: Record<string, any>;
  variant?: "outlined" | "filled" | "standard";
  fullWidth?: boolean;
}

export interface FileUploadProps {
  onFileChange: (file: File) => void;
  currentIcon: string | File | null;
}

export interface ActionButtonsProps {
  saving: boolean;
}

export interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

export interface LoadingSpinnerProps {
  message?: string;
}

export interface BackButtonProps {
  onClick: () => void;
}

export interface SocietyFormProps {
  formData: Society;
  errors: FormErrors;
  saving: boolean;
  onTextChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onTagsChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (file: File) => void;
  onSubmit: (e: FormEvent) => void;
}