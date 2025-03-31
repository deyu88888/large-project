export interface Report {
    report_type: string;
    subject: string;
    details: string;
    from_student_username: string;
    requested_at: string;
    [key: string]: any;
  }
  
  export interface ReportState {
    data: Report | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface ReplyState {
    content: string;
    error: string | null;
  }
  
  export interface LoadingStateProps {
    children?: React.ReactNode;
  }
  
  export interface ErrorStateProps {
    message: string;
  }
  
  export interface ReportDetailsProps {
    report: Report;
  }
  
  export interface ReplyFormProps {
    content: string;
    onChange: (content: string) => void;
    onSubmit: (e: React.FormEvent) => void;
  }
  
  export interface PageContainerProps {
    children: React.ReactNode;
  }