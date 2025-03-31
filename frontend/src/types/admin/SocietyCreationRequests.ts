import { GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";

export interface Society {
  id: number;
  name: string;
  description: string;
  president: string;
  society_members: string[] | string;
  category: string;
  membershipRequirements: string;
  upcomingProjectsOrPlans: string;
  [key: string]: any;
}

export interface ProcessedSociety extends Omit<Society, 'society_members'> {
  society_members: string;
}

export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export interface ActionButtonsProps {
  societyId: number;
  onStatusChange: (id: number, status: "Approved" | "Rejected") => void;
}

export interface NotificationProps {
  notification: NotificationState;
  onClose: () => void;
}

export interface TruncatedCellProps {
  value: string;
}

export interface EmptyStateProps {
  colors: ReturnType<typeof tokens>;
}

export interface DataGridContainerProps {
  societies: ProcessedSociety[];
  columns: GridColDef[];
  colors: ReturnType<typeof tokens>;
  loading: boolean;
  drawer: boolean;
}