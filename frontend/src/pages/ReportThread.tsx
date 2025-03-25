import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import { tokens } from "../theme/theme";
import { 
    Box, Typography, Button, TextField, Paper, Avatar, 
    Divider, CircularProgress, Card, CardHeader, CardContent,
    IconButton, List, ListItem, MenuItem, Select, FormControl, InputLabel,
    FormHelperText, Alert
  } from "@mui/material";
  import { useTheme } from "@mui/material/styles";
  import ReplyIcon from '@mui/icons-material/Reply';
  import EmailIcon from '@mui/icons-material/Email';
  import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

interface FlattenedMessage {
  id: number;
  subject: string;
  content: string;
  sender: string;
  timestamp: string;
  is_admin: boolean;
  is_original: boolean;
  level: number;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPresident, setIsPresident] = useState(false);
  const [replying, setReplying] = useState(false);
  const [emailThread, setEmailThread] = useState<FlattenedMessage[]>([]);

  useEffect(() => {
    const fetchReportThread = async () => {
      try {
        const response = await apiClient.get(`/api/report-thread/${reportId}`);
        setReport(response.data);
        
        // Check if user is admin or president - this should be replaced with your actual auth logic
        const userResponse = await apiClient.get("/api/user/current");
        setIsAdmin(userResponse.data.is_admin);
        setIsPresident(userResponse.data.is_president);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch report thread");
        setLoading(false);
      }
    };

    fetchReportThread();
  }, [reportId]);

  useEffect(() => {
    if (report) {
      setEmailThread(flattenMessages());
    }
  }, [report]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/reports/report-replies", {
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
      setReplying(false);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to submit reply");
      }
    }
  };

  const getFilteredReplyOptions = () => {
    // If admin, they can reply to anything
    if (isAdmin) {
      return emailThread;
    }
    
    // If president, they can only reply to admin messages (not to original report or student messages)
    if (isPresident) {
      return emailThread.filter(email => email.is_admin);
    }
    
    // Students can only reply to admin messages (not to original report or student messages)
    return emailThread.filter(email => email.is_admin);
  };

  const flattenMessages = () => {
    if (!report) return [];
    
    // Start with the original report as the first email
    const originalEmail = {
      id: report.id,
      subject: report.subject,
      content: report.details,
      sender: report.from_student_username,
      timestamp: report.requested_at,
      is_admin: false,
      is_original: true,
      level: 0
    };
    
    // Get all replies and flatten them into a single array
    const getAllReplies = (replies: Reply[], level = 0): FlattenedMessage[] => {
      let result: FlattenedMessage[] = [];
      
      replies.forEach(reply => {
        result.push({
          id: reply.id,
          subject: `RE: ${report?.subject}`,
          content: reply.content,
          sender: reply.replied_by_username,
          timestamp: reply.created_at,
          is_admin: reply.is_admin_reply,
          is_original: false,
          level
        });
        
        if (reply.child_replies && reply.child_replies.length > 0) {
          result = [...result, ...getAllReplies(reply.child_replies, level + 1)];
        }
      });
      
      return result;
    };
    
    // Combine original email with all replies, sorted by timestamp
    const allMessages = [originalEmail, ...getAllReplies(report.top_level_replies)];
    return allMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  // Check if there are valid messages to reply to
  const hasValidReplyOptions = () => {
    const options = getFilteredReplyOptions();
    // For non-admins, filter out the original report
    if (!isAdmin) {
      return options.filter(msg => !msg.is_original).length > 0;
    }
    return options.length > 0;
  };

  if (loading) return <CircularProgress />;
  if (error && !replying) return <Typography color="error">{error}</Typography>;
  if (!report) return <Typography>Report not found</Typography>;

  return (
    <Box
      minHeight="100vh"
      p={4}
    >
      {/* Header with back button */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d" }}
        >
          {report.subject}
        </Typography>
      </Box>
      
      {/* Email thread */}
      <Box 
        sx={{ 
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
          borderRadius: 2,
          boxShadow: 3,
          mb: 4,
          overflow: "hidden"
        }}
      >
        <Box sx={{ 
          p: 2, 
          backgroundColor: theme.palette.mode === "dark" ? colors.blueAccent[700] : colors.blueAccent[100],
          borderBottom: `1px solid ${theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[300]}`
        }}>
          <Typography variant="h6">
            Report: {report.id} - {report.report_type}
          </Typography>
        </Box>
        
        <List sx={{ p: 0 }}>
          {emailThread.map((email, index) => (
            <ListItem
              key={email.id}
              sx={{
                display: "block",
                p: 0,
                borderBottom: index < emailThread.length - 1 
                  ? `1px solid ${theme.palette.mode === "dark" ? colors.primary[500] : colors.grey[300]}`
                  : "none"
              }}
            >
              <Box sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Avatar 
                    sx={{ 
                      bgcolor: email.is_admin 
                        ? colors.redAccent[500] 
                        : colors.greenAccent[500],
                      mr: 2
                    }}
                  >
                    {email.sender[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {email.sender} {email.is_admin ? "(Admin)" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(email.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                
                {email.is_original && (
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Report Type: {report.report_type}
                  </Typography>
                )}
                
                <Typography variant="body1" sx={{ 
                  whiteSpace: "pre-wrap",
                  pl: email.level > 0 ? 2 : 0,
                  borderLeft: email.level > 0 
                    ? `3px solid ${theme.palette.mode === "dark" ? colors.grey[500] : colors.grey[300]}` 
                    : "none"
                }}>
                  {email.content}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
      
      {/* Reply Form */}
      {replying ? (
        <Card
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[400] : "#ffffff",
            boxShadow: 3,
            mb: 4
          }}
        >
          <CardHeader 
            title="Compose Reply"
            action={
              <IconButton onClick={() => {
                setReplying(false);
                setSelectedReplyId(null);
                setError(null);
              }}>
                <ArrowBackIcon />
              </IconButton>
            }
          />
          <CardContent>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleReplySubmit}>
              {/* Message selector */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="reply-to-select-label">Replying to</InputLabel>
                <Select
                  labelId="reply-to-select-label"
                  value={selectedReplyId === null && isAdmin ? report.id : selectedReplyId}
                  onChange={(e) => {
                    const value = e.target.value;
                    // If the original report is selected and we're an admin, set selectedReplyId to null
                    // Otherwise, use the value directly
                    setSelectedReplyId(value === report.id ? null : value as number);
                  }}
                  label="Replying to"
                  required
                >
                  {/* Only admins can reply directly to the report */}
                  {isAdmin && (
                    <MenuItem value={report.id}>
                      Original Report (Direct Reply)
                    </MenuItem>
                  )}
                  
                  {/* Filter options based on user role */}
                  {getFilteredReplyOptions()
                    .filter(email => !email.is_original) // Filter out the original message since we handled it separately above
                    .map(email => (
                      <MenuItem key={email.id} value={email.id}>
                        {email.sender}'s message from {new Date(email.timestamp).toLocaleString()}
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>
                  {isAdmin 
                    ? "As an admin, you can reply directly to the report or to any message" 
                    : "You can only reply to admin messages"}
                </FormHelperText>
              </FormControl>

              <TextField
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                fullWidth
                multiline
                rows={5}
                required
                placeholder="Type your reply here..."
                sx={{
                  backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
                  borderRadius: "4px",
                }}
              />

              <Button
                type="submit"
                variant="contained"
                sx={{
                  mt: 3,
                  backgroundColor: colors.blueAccent[500],
                  color: "#ffffff",
                  "&:hover": { backgroundColor: colors.blueAccent[600] },
                }}
              >
                Send Reply
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {!hasValidReplyOptions() && !isAdmin && (
            <Alert severity="info" sx={{ mb: 3 }}>
              You cannot reply yet because there are no admin messages to respond to.
            </Alert>
          )}
          
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={() => {
              // For non-admins, select the first admin reply if available
              if (!isAdmin && hasValidReplyOptions()) {
                const adminReplies = emailThread.filter(msg => msg.is_admin && !msg.is_original);
                if (adminReplies.length > 0) {
                  setSelectedReplyId(adminReplies[0].id);
                }
              } else if (isAdmin) {
                // Admins default to replying to the original report
                setSelectedReplyId(null);
              }
              setReplying(true);
              setError(null);
            }}
            disabled={!isAdmin && !hasValidReplyOptions()}
            sx={{
              backgroundColor: colors.blueAccent[500],
              color: "#ffffff",
              "&:hover": { backgroundColor: colors.blueAccent[600] },
              "&.Mui-disabled": {
                backgroundColor: colors.grey[500],
                color: colors.grey[100],
              }
            }}
          >
            Compose Reply
          </Button>
        </>
      )}
    </Box>
  );
};

export default ReportThread;