import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";
import {
  Report,
  ReportState,
  ReplyState,
  LoadingStateProps,
  ErrorStateProps,
  ReportDetailsProps,
  ReplyFormProps,
  PageContainerProps
} from "../../types/admin/ReportReply";

const fetchReportById = async (reportId: string): Promise<Report> => {
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
  return <Typography color="error">{message}</Typography>;
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
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
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

const ReplyForm: React.FC<ReplyFormProps> = ({ content, onChange, onSubmit }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
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
          color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
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
        sx={{
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
          color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
          borderRadius: "4px",
        }}
      />

      <Button
        type="submit"
        fullWidth
        sx={{
          mt: 3,
          backgroundColor: colors.blueAccent[500],
          color: "#ffffff",
          fontWeight: "bold",
          "&:hover": { backgroundColor: colors.blueAccent[600] },
        }}
      >
        Submit Reply
      </Button>
    </Box>
  );
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
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
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      }}
    >
      Reply to Report
    </Typography>
  );
};

const ReportReply: React.FC = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  
  const [reportState, setReportState] = useState<ReportState>({
    data: null,
    loading: true,
    error: null
  });
  
  const [replyState, setReplyState] = useState<ReplyState>({
    content: "",
    error: null
  });

  const loadReportData = async () => {
    if (!reportId) {
      setReportState({
        data: null,
        loading: false,
        error: "Report ID is missing"
      });
      return;
    }
    
    try {
      setReportState(prev => ({ ...prev, loading: true }));
      const reportData = await fetchReportById(reportId);
      setReportState({
        data: reportData,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportState({
        data: null,
        loading: false,
        error: "Failed to fetch report details. The report might not exist or you don't have permission to view it."
      });
    }
  };

  const handleReplyContentChange = (content: string) => {
    setReplyState(prev => ({ ...prev, content }));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportId) {
      setReplyState(prev => ({ ...prev, error: "Report ID is missing" }));
      return;
    }
    
    try {
      await submitReportReply(reportId, replyState.content);
      alert("Reply submitted successfully!");
      navigate("/admin/reports");
    } catch (err) {
      setReplyState(prev => ({ ...prev, error: "Failed to submit reply" }));
    }
  };

  useEffect(() => {
    loadReportData();
  }, [reportId]);

  if (reportState.loading) {
    return <LoadingState />;
  }

  if (reportState.error) {
    return <ErrorState message={reportState.error} />;
  }

  if (replyState.error) {
    return <ErrorState message={replyState.error} />;
  }

  return (
    <PageContainer>
      <PageTitle />
      
      {reportState.data && (
        <>
          <ReportDetails report={reportState.data} />
          <ReplyForm 
            content={replyState.content}
            onChange={handleReplyContentChange}
            onSubmit={handleSubmitReply}
          />
        </>
      )}
    </PageContainer>
  );
};

export default ReportReply;