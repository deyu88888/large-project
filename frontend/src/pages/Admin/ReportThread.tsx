// src/pages/shared/ReportThread.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField, Paper, Avatar, Divider, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme";

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

const ReportThread: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<ReportThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [selectedReplyId, setSelectedReplyId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // This should be determined by your auth system

  useEffect(() => {
    const fetchReportThread = async () => {
      try {
        const response = await apiClient.get(`/api/report-thread/${reportId}`);
        setReport(response.data);
        
        // Check if user is admin - this should be replaced with your actual auth logic
        const userResponse = await apiClient.get("/api/user/current");
        setIsAdmin(userResponse.data.is_admin);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch report thread");
        setLoading(false);
      }
    };

    fetchReportThread();
  }, [reportId]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/report-replies", {
        report: reportId,
        parent_reply: selectedReplyId,
        content: replyContent,
      });
      
      // Refresh the thread data
      const response = await apiClient.get(`/api/report-thread/${reportId}`);
      setReport(response.data);
      
      // Reset form
      setReplyContent("");
      setSelectedReplyId(null);
    } catch (err) {
      setError("Failed to submit reply");
    }
  };

  const renderReply = (reply: Reply, level: number = 0) => {
    return (
      <Box key={reply.id} sx={{ ml: level * 4, mb: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: reply.is_admin_reply
              ? theme.palette.mode === "dark"
                ? colors.blueAccent[800]
                : colors.blueAccent[100]
              : theme.palette.mode === "dark"
              ? colors.greenAccent[800]
              : colors.greenAccent[100],
          }}
        >
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar
              sx={{
                bgcolor: reply.is_admin_reply ? colors.redAccent[500] : colors.greenAccent[500],
                width: 32,
                height: 32,
                mr: 1,
              }}
            >
              {reply.replied_by_username[0].toUpperCase()}
            </Avatar>
            <Typography variant="subtitle1" fontWeight="bold">
              {reply.replied_by_username} ({reply.is_admin_reply ? "Admin" : "Student"})
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 1 }}>
            {reply.content}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            {new Date(reply.created_at).toLocaleString()}
          </Typography>
          
          {/* Only show reply button if appropriate */}
          {((isAdmin && !reply.is_admin_reply) || (!isAdmin && reply.is_admin_reply)) && (
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setSelectedReplyId(reply.id)}
            >
              Reply
            </Button>
          )}
        </Paper>
        
        {/* Render child replies */}
        {reply.child_replies && reply.child_replies.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {reply.child_replies.map(childReply => renderReply(childReply, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!report) return <Typography>Report not found</Typography>;

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
        Report Thread
      </Typography>

      {/* Original Report */}
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

      {/* Replies */}
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Replies
      </Typography>
      
      {report.top_level_replies.length > 0 ? (
        report.top_level_replies.map(reply => renderReply(reply))
      ) : (
        <Typography variant="body1" sx={{ mb: 3 }}>
          No replies yet.
        </Typography>
      )}
      
      {/* Reply Form */}
      <Divider sx={{ my: 4 }} />
      
      <Box
        component="form"
        onSubmit={handleReplySubmit}
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
          {selectedReplyId ? "Reply to Comment" : "Add New Reply"}
        </Typography>
        
        {selectedReplyId && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => setSelectedReplyId(null)}
            sx={{ mb: 2 }}
          >
            Cancel replying to specific comment
          </Button>
        )}

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

export default ReportThread;