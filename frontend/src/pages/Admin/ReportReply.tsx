// TODO: to refactor
// TODO: refactor once the presidents' dashboard is functional, and can make a request
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";

const ReportReply: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

// Update the fetchReport function in ReportReply.tsx
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/reports/to-admin/${reportId}/`);
      setReport(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to fetch report details. The report might not exist or you don't have permission to view it.");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReport();
  }, [reportId]); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/reports/replies/", {
        report: reportId,
        content: replyContent,
      });
      alert("Reply submitted successfully!");
      navigate("/admin/reports");
    } catch (err) {
      setError("Failed to submit reply");
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      }}
    >
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
          Reported by: {report.from_student_username} on {new Date(report.requested_at).toLocaleString()}
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
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
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
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
    </Box>
  );
};

export default ReportReply;