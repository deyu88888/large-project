import { GridColDef } from "@mui/x-data-grid";
import React from "react";

export interface AdminUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role: string;
  is_super_admin: boolean;
  [key: string]: any;
}

export interface DeleteDialogProps {
  open: boolean;
  admin: AdminUser | null;
  reason: string;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export interface HeaderProps {
  colors: any;
  theme: any;
}

export interface DataGridContainerProps {
  filteredAdmins: AdminUser[];
  columns: GridColDef[];
  colors: any;
  drawer: boolean;
}

export interface ActionButtonsProps {
  adminId: string;
  admin: AdminUser;
  isSuperAdmin: boolean;
  onView: (id: string) => void;
  onDelete: (admin: AdminUser) => void;
}