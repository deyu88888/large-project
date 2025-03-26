import React from "react";
interface Reply {
    id: number;
    content: string;
    created_at: string;
    replied_by_username: string;
    is_admin_reply: boolean;
    child_replies: Reply[];
}
interface ReportThread {
    id: number;
    report_type: string;
    subject: string;
    details: string;
    requested_at: string;
    from_student_username: string;
    top_level_replies: Reply[];
}
declare const ReportThread: React.FC;
export default ReportThread;
