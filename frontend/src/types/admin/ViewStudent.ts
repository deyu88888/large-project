import { ChangeEvent, FormEvent } from "react";
import { Student } from "../../types";

export interface StudentFormState {
  student: Student | null;
  formData: Student | null;
  loading: boolean;
  saving: boolean;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

export interface TextFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  fullWidth?: boolean;
}

export interface SwitchFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface SocietiesFieldProps {
  value: number[];
  onChange: (societies: number[]) => void;
}

export interface PresidentFieldProps {
  value: any;
  onChange: (presidentOf: number[]) => void;
}

export interface FormButtonsProps {
  saving: boolean;
}

export interface LoadingSpinnerProps {
  color?: "primary" | "secondary";
}

export interface BackButtonProps {
  onClick: () => void;
}

export interface StudentFormProps {
  formData: Student;
  saving: boolean;
  onTextChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSocietiesChange: (societies: number[]) => void;
  onPresidentOfChange: (presidentOf: number[]) => void;
  onActiveChange: (active: boolean) => void;
  onIsPresidentChange: (isPresident: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}