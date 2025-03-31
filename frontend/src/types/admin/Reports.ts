import { Report, ReportThread, Reply } from "../president/report";

export interface ReportDetails {
  id: string;
}

export interface ReplyRequest {
  report: string | number;
  parent_reply?: number | null;
  content: string;
}

export type { Report, ReportThread, Reply };