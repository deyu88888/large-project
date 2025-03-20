import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Divider, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";  // Ensure apiClient is set up correctly for your API calls

const Replies: React.FC = () => {
  const [replies, setReplies] = useState<any[]>([]); // Store replies
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const navigate = useNavigate();

  // Fetch replies from the API when the component mounts
  useEffect(() => {
    const fetchReplies = async () => {
      try {
        const response = await apiClient.get("/api/report-replies");
        setReplies(response.data); // Assuming the response contains an array of replies
      } catch (error) {
        setError("Failed to load replies.");
        console.error("Error fetching replies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();
  }, []);

 // Navigate to a detailed view of the reply (viewing a single reply)
const handleReplyClick = (replyId: string) => {
    navigate(`/student/replies/${replyId}`); // Navigate to a detailed view for a specific reply
  };
  
  // Fix the function declaration to match the implementation
const handleReplyButtonClick = (replyId: number) => {
    // Navigate to the page where student can add their reply
    navigate(`/student/replies/${replyId}/reply`);
  };
  

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Admin Replies
      </Typography>

      <List>
        {replies.length > 0 ? (
          replies.map((reply: any) => (
            <Box key={reply.id}>
              <ListItem button onClick={() => handleReplyClick(reply.id)}>
                <ListItemText
                  primary={`Reply from ${reply.from_user}`}  // Now displays username
                  secondary={`Subject: ${reply.subject || "No subject"}`}  // Display subject or fallback to "No subject"
                />
                <Button
  variant="contained"
  color="primary"
  onClick={() => handleReplyButtonClick(reply.id)} // Ensure using reply.id, NOT reportId
>
  Reply
</Button>
              </ListItem>
              <Divider />
            </Box>
          ))
        ) : (
          <Typography variant="body1">No replies available.</Typography>
        )}
      </List>
    </Box>
  );
};

export default Replies;