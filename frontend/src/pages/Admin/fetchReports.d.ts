import { ReportReply } from '../../types';
interface Report {
    id: string;
}
interface ReportDetails {
    id: string;
}
interface ReportThread {
    id: string;
}
interface ReportReplyRequest {
    report: string | number;
    parent_reply?: number | null;
    content: string;
}
declare const fetchReports: () => Promise<Report[]>;
declare const fetchReportDetails: (reportId: string) => Promise<ReportDetails>;
declare const fetchReportThread: (reportId: string) => Promise<ReportThread>;
declare const submitReply: (data: ReportReplyRequest) => Promise<ReportReply>;
declare const fetchMyReports: () => Promise<Report[]>;
declare const fetchMyReportsWithReplies: () => Promise<Report[]>;
declare const fetchReportsWithReplies: () => Promise<Report[]>;
declare const fetchReportReplies: () => Promise<ReportReply[]>;
export { fetchReports, fetchReportDetails, fetchReportThread, submitReply, fetchMyReports, fetchMyReportsWithReplies, fetchReportsWithReplies, fetchReportReplies };
export type { Report, ReportDetails, ReportThread, ReportReplyRequest };
