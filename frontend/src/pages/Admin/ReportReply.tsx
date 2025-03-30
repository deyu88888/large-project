import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";

interface Report {
  report_type: string;
  subject: string;
  details: string;
  from_student_username: string;
  requested_at: string;
  [key: string]: any;
}

interface ReplyState {
  content: string;
  error: string | null;
}

interface LoadingStateProps {
  children?: React.ReactNode;
}

interface ErrorStateProps {
  message: string;
}

interface ReportDetailsProps {
  report: Report;
}

interface ReplyFormProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled: boolean;
}

const fetchReportById = async (reportId: string | undefined): Promise<Report> => {
  if (!reportId) {
    throw new Error("Report ID is missing");
  }
  
  const response = await apiClient.get(`/api/reports/to-admin/${reportId}/`);
  return response.data;
};

const submitReportReply = async (reportId: string, content: string): Promise<void> => {
  await apiClient.post("/api/reports/replies/", {
    report: reportId,
    content: content,
  });
};

const LoadingState: React.FC<LoadingStateProps> = () => {
  return <CircularProgress />;
};

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{message}</Alert>;
};

const ReportDetails: React.FC<ReportDetailsProps> = ({ report }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[100],
        p: 4,
        borderRadius: "8px",
        boxShadow: 3,
        mb: 4,
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Report Type: {report.report_type}
      </Typography>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Subject: {report.subject}
      </Typography>
      <Typography variant="h6" mb={3}>
        Details: {report.details}
      </Typography>
      <Typography variant="body1" mb={2}>
        Reported by: {report.from_student_username} on {formatDate(report.requested_at)}
      </Typography>
    </Box>
  );
};

const ReplyForm: React.FC<ReplyFormProps> = ({ content, onChange, onSubmit, disabled }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[100],
        p: 4,
        borderRadius: "8px",
        boxShadow: 3,
      }}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        mb={2}
        sx={{
          color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
        }}
      >
        Your Reply
      </Typography>

      <TextField
        value={content}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        multiline
        rows={5}
        required
        disabled={disabled}
        sx={{
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : colors.grey[50],
          color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
          borderRadius: "4px",
        }}
      />

      <Button
        type="submit"
        fullWidth
        disabled={disabled}
        sx={{
          mt: 3,
          backgroundColor: colors.blueAccent[500],
          color: colors.grey[100],
          fontWeight: "bold",
          "&:hover": { backgroundColor: colors.blueAccent[600] },
        }}
      >
        Submit Reply
      </Button>
    </Box>
  );
};

const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : colors.grey[50],
        color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
      }}
    >
      {children}
    </Box>
  );
};

const PageTitle: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Typography
      variant="h2"
      fontWeight="bold"
      mb={3}
      sx={{
        color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
      }}
    >
      Reply to Report
    </Typography>
  );
};

const ReportReply: React.FC = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [replyState, setReplyState] = useState<ReplyState>({
    content: "",
    error: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchReportData = useCallback(async () => {
    try {
      return await fetchReportById(reportId);
    } catch (error) {
      console.error("Error fetching report:", error);
      const errorMessage = error instanceof Error ? error.message : 
        "Failed to fetch report details. The report might not exist or you don't have permission to view it.";
      throw new Error(errorMessage);
    }
  }, [reportId]);
  
  const { 
    data: report, 
    loading, 
    error, 
    isConnected 
  } = useWebSocketChannel<Report>(
    `report/${reportId}`, 
    fetchReportData
  );
  
  const handleReplyContentChange = (content: string) => {
    setReplyState(prev => ({ ...prev, content }));
  };
  
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportId) {
      setReplyState(prev => ({ ...prev, error: "Report ID is missing" }));
      return;
    }
    
    setIsSubmitting(true);
    setReplyState(prev => ({ ...prev, error: null }));
    
    try {
      await submitReportReply(reportId, replyState.content);
      alert("Reply submitted successfully!");
      navigate("/admin/reports");
    } catch (err) {
      setReplyState(prev => ({ ...prev, error: "Failed to submit reply. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const errorMessage = replyState.error || error;
  
  if (loading && !report) {
    return (
      <PageContainer>
        <PageTitle />
        <LoadingState />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageTitle />
      
      {errorMessage && <ErrorState message={errorMessage} />}
      
      {report && (
        <>
          <ReportDetails report={report} />
          <ReplyForm 
            content={replyState.content}
            onChange={handleReplyContentChange}
            onSubmit={handleSubmitReply}
            disabled={isSubmitting}
          />
        </>
      )}
    </PageContainer>
  );
};

export default ReportReply;