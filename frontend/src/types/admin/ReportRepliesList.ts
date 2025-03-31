import { GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { Report } from "../president/report";

export interface ReportState {
  items: Report[];
  loading: boolean;
  error: string | null;
}

export interface LatestReplyProps {
  repliedBy: string;
  content: string;
}

export interface DateCellProps {
  dateString: string;
  formatter: (dateString: string) => string;
}

export interface ActionButtonsProps {
  reportId: number | string;
  onViewThread: (id: number | string) => void;
  onReply: (id: number | string) => void;
}

export interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

export interface LoadingStateProps {
  message: string;
}

export interface DataGridContainerProps {
  reports: Report[];
  columns: GridColDef[];
  loading: boolean;
  colors: ReturnType<typeof tokens>;
  drawer: boolean;
}