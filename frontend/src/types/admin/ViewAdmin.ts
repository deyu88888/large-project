import { ChangeEvent, FormEvent } from "react";

export interface AdminFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_super_admin: boolean;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

export interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  fullWidth?: boolean;
}

export interface SwitchFieldProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export interface FormSubmitButtonProps {
  saving: boolean;
  canEdit: boolean;
}

export interface SnackbarAlertProps {
  state: SnackbarState;
  onClose: () => void;
}

export interface LoadingSpinnerProps {
  color?: "primary" | "secondary";
}

export interface InfoAlertProps {
  message: string;
}

export interface BackButtonProps {
  onClick: () => void;
}

export interface AdminDetailFormProps {
  formData: AdminFormData;
  canEdit: boolean;
  saving: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSwitchChange: (
    name: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}