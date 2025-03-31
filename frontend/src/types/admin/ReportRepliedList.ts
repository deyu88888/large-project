import { GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";

export interface ReportWithReplies {
  id: number | string;
  from_student_username: string;
  report_type: string;
  subject: string;
  latest_reply: string;
  reply_count: number;
  latest_reply_date: string;
  [key: string]: any; 
}

export interface ReportState {
  items: ReportWithReplies[];
  loading: boolean;
  error: string | null;
}

export interface DataGridContainerProps {
  reports: ReportWithReplies[];
  columns: GridColDef[];
  loading: boolean;
  colors: ReturnType<typeof tokens>;
}

export interface ErrorAlertProps {
  message: string;
}

export interface ActionButtonProps {
  reportId: string | number;
  onClick: (id: string | number) => void;
}