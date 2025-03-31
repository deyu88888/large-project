import { GridColDef } from "@mui/x-data-grid";
import { Report } from '../president/report';

export interface DataGridContainerProps {
  filteredReports: Report[];
  columns: GridColDef[];
  loading: boolean;
  colors: any;
}

export interface ActionButtonProps {
  reportId: string;
  isPublic: boolean;
  email: string;
  subject: string;
  onReply: (id: string) => void;
}

export interface EmailCellProps {
  email: string | null;
}

export interface ReporterCellProps {
  reporter: string | null;
}

export interface DateCellProps {
  date: string;
}