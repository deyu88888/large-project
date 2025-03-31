import { FormikHelpers, FormikProps } from "formik";
import React from "react";
import { Admin } from "../../types";

export interface AdminFormValues {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "error" | "success" | "info" | "warning";
}

export interface FormState {
  loading: boolean;
  isSuccess: boolean;
  createdAdmin: Admin | null;
  showPassword: boolean;
  error: string | null;
  snackbar: SnackbarState;
}

export interface PasswordFieldProps {
  name: string;
  label: string;
  value: string;
  showPassword: boolean;
  handleBlur: (e: React.FocusEvent) => void;
  handleChange: (e: React.ChangeEvent) => void;
  handleTogglePasswordVisibility: () => void;
  error: boolean;
  helperText: string | undefined;
  disabled: boolean;
}

export interface SuccessViewProps {
  createdAdmin: Admin;
  onCreateAnother: () => void;
  colors: any;
  theme: any;
}

export interface UnauthorizedViewProps {
  title: string;
  subtitle: string;
}

export interface FormViewProps {
  formState: FormState;
  onSubmit: (values: AdminFormValues, helpers: FormikHelpers<AdminFormValues>) => Promise<void>;
  onTogglePasswordVisibility: () => void;
  onErrorClose: () => void;
  onSnackbarClose: () => void;
  isNonMobile: boolean;
  colors: any;
  theme: any;
  drawer: boolean;
}

export interface FormFieldsProps {
  formikProps: FormikProps<AdminFormValues>;
  isNonMobile: boolean;
  loading: boolean;
  showPassword: boolean;
  onTogglePasswordVisibility: () => void;
}

export interface ErrorAlertProps {
  error: string;
  onClose: () => void;
}

export interface SnackbarAlertProps {
  open: boolean;
  message: string;
  severity: "error" | "success" | "info" | "warning";
  onClose: () => void;
}

export interface FormButtonsProps {
  isValid: boolean;
  dirty: boolean;
  loading: boolean;
}

export interface AdminInfoItemProps {
  label: string;
  value: string;
}

export interface FormikWrapperProps {
  onSubmit: (values: AdminFormValues, helpers: FormikHelpers<AdminFormValues>) => Promise<void>;
  isNonMobile: boolean;
  loading: boolean;
  showPassword: boolean;
  onTogglePasswordVisibility: () => void;
}

export interface FormContentProps {
  formikProps: FormikProps<AdminFormValues>;
  isNonMobile: boolean;
  loading: boolean;
  showPassword: boolean;
  onTogglePasswordVisibility: () => void;
}