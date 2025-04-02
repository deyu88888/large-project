import { GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";

export interface Society {
  id: number;
  name: string;
  description: string;
  president: {
    first_name: string;
    last_name: string;
  };
  society_members: string[] | string;
  category: string;
  membershipRequirements: string;
  upcomingProjectsOrPlans: string;
  [key: string]: any;
}

export interface SocietyData {
  id: number;
  name: string;
  description: string;
  president: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    [key: string]: any;
  };
  vicePresident?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    [key: string]: any;
  } | null;
  eventManager?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    [key: string]: any;
  } | null;
  societyMembers: number[] | string[];
  category: string;
  membershipRequirements?: string;
  upcomingProjectsOrPlans?: string;
  tags?: string[];
  icon?: string;
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  status?: "Approved" | "Pending" | "Rejected" | string;
  showreelImages?: {
    photo: string;
    caption: string;
  }[];
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    x?: string;
    whatsApp?: string;
    other?: string;
    [key: string]: string;
  };
  timetable?: any[];
  leader?: any;
  roles?: Record<string, any>;
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
  society: SocietyData;
  onStatusChange: (id: number, status: "Approved" | "Rejected") => void;
  onView: (society: SocietyData) => void;
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