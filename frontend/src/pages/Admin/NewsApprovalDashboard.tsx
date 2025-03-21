import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../../theme/theme';

interface PublicationRequest {
  id: number;
  news_post: number;
  news_post_title: string;
  society_name: string;
  requested_by: number;
  requester_name: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  author_data: {
    id: number;
    username: string;
    full_name: string;
  };
}

interface NewsContent {
  id: number;
  title: string;
  content: string;
  status: string;
  society_data?: {
    id: number;
    name: string;
  };
}

const NewsApprovalDashboard: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [requests, setRequests] = useState<PublicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [newsContents, setNewsContents] = useState<Record<number, NewsContent>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});
  
  // Approval/rejection dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PublicationRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
      console.log("Fetched requests:", response.data);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching publication requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setExpandedRequestId(null); // Collapse all when changing tabs
  };

  const toggleRequestExpansion = async (request: PublicationRequest) => {
    // If already expanded, collapse it
    if (expandedRequestId === request.id) {
      setExpandedRequestId(null);
      return;
    }

    // Otherwise, expand it and load its content
    setExpandedRequestId(request.id);
    
    // If we already have the content, don't fetch it again
    if (newsContents[request.news_post]) return;
    
    // Mark as loading
    setLoadingContents(prev => ({ ...prev, [request.news_post]: true }));
    
    try {
      const response = await apiClient.get(`/api/news/${request.news_post}/`);
      setNewsContents(prev => ({ 
        ...prev, 
        [request.news_post]: response.data 
      }));
    } catch (error) {
      console.error('Error fetching news content:', error);
    } finally {
      setLoadingContents(prev => ({ ...prev, [request.news_post]: false }));
    }
  };

  const handleOpenDialog = (request: PublicationRequest, action: 'approve' | 'reject') => {
    setCurrentRequest(request);
    setDialogAction(action);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogAction(null);
    setCurrentRequest(null);
  };

  const handleProcessRequest = async () => {
    if (!currentRequest || !dialogAction) return;
    
    setProcessingAction(true);
    
    try {
      // 1. Create the new status
      const newStatus = dialogAction === 'approve' ? 'Approved' : 'Rejected';
      
      // 2. Update local state FIRST (optimistic update)
      const updatedRequest = { ...currentRequest, status: newStatus };
      
      // Update requests array with the new status
      setRequests(prev => 
        prev.map(req => req.id === currentRequest.id ? updatedRequest : req)
      );
      
      // 3. Switch to the appropriate tab (do this before closing dialog for smoother transition)
      setTabValue(dialogAction === 'approve' ? 1 : 2);
      
      // 4. Close dialog
      setDialogOpen(false);
      setCurrentRequest(null);
      
      // 5. Update the expanded state to show the processed request
      setExpandedRequestId(updatedRequest.id);
      
      // 6. Now send the API request (after UI is already updated)
      await apiClient.put(`/api/news/publication-request/${currentRequest.id}/`, {
        status: newStatus,
        admin_notes: adminNotes
      });
      
      // 7. Refresh data from the server (just to be sure everything is in sync)
      const updatedRequestsResponse = await apiClient.get('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
      
      // Update our local data with fresh server data
      setRequests(updatedRequestsResponse.data);
      
      // 8. Also update the news content with the latest status
      if (newsContents[currentRequest.news_post]) {
        const newsResponse = await apiClient.get(`/api/news/${currentRequest.news_post}/`);
        setNewsContents(prev => ({
          ...prev,
          [currentRequest.news_post]: newsResponse.data
        }));
      }
    } catch (error) {
      console.error('Error processing request:', error);
      
      // If the API call fails, revert the optimistic update
      fetchRequests();
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (tabValue === 0) return request.status === 'Pending';
    if (tabValue === 1) return request.status === 'Approved';
    if (tabValue === 2) return request.status === 'Rejected';
    return true;
  });

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">News Publication Approval</Typography>
      </Box>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            color: colors.grey[300],
            '&.Mui-selected': {
              color: colors.blueAccent[400],
              fontWeight: 'bold',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: colors.blueAccent[400],
          },
        }}
      >
        <Tab label={`Pending (${requests.filter(r => r.status === 'Pending').length})`} />
        <Tab label={`Approved (${requests.filter(r => r.status === 'Approved').length})`} />
        <Tab label={`Rejected (${requests.filter(r => r.status === 'Rejected').length})`} />
      </Tabs>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : filteredRequests.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          backgroundColor: colors.primary[400],
        }}>
          <Typography variant="h6">No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} publication requests</Typography>
        </Paper>
      ) : (
        <Box>
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              sx={{ 
                mb: 2,
                backgroundColor: colors.primary[400],
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: colors.primary[500],
                  }
                }}
                onClick={() => toggleRequestExpansion(request)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" gutterBottom>
                        {request.news_post_title || 'Untitled News Post'}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{
                          transform: expandedRequestId === request.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]} gutterBottom>
                      Society: {request.society_name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" sx={{ color: colors.grey[300] }} />
                      <Typography variant="body2" color={colors.grey[300]}>
                        Requested by: {request.requester_name}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <TimeIcon fontSize="small" sx={{ color: colors.grey[300] }} />
                      <Typography variant="body2" color={colors.grey[300]}>
                        {new Date(request.requested_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={request.status} 
                    color={
                      request.status === 'Pending' ? 'warning' :
                      request.status === 'Approved' ? 'success' : 'error'
                    }
                    sx={{
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </CardContent>
              
              <Collapse in={expandedRequestId === request.id}>
                <Divider />
                <CardContent>
                  {loadingContents[request.news_post] ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : newsContents[request.news_post] ? (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" mb={2}>Content Preview:</Typography>
                      <Box sx={{ 
                        p: 2, 
                        border: `1px solid ${colors.grey[700]}`,
                        borderRadius: 1,
                        maxHeight: '300px',
                        overflow: 'auto',
                        backgroundColor: colors.primary[500],
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: newsContents[request.news_post].content }} />
                      </Box>
                      
                      {request.status === 'Pending' && (
                        <Box display="flex" gap={2} mt={3}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleOpenDialog(request, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleOpenDialog(request, 'reject')}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                      
                      {request.status !== 'Pending' && (
                        <Box 
                          mt={3} 
                          p={2} 
                          bgcolor={
                            request.status === 'Approved' ? colors.greenAccent[900] : colors.redAccent[900]
                          } 
                          borderRadius={1}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            This request has been {request.status.toLowerCase()}.
                          </Typography>
                          {request.admin_notes && (
                            <Box mt={1}>
                              <Typography variant="subtitle2" fontWeight="bold">Admin notes:</Typography>
                              <Typography variant="body2">{request.admin_notes}</Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography>Error loading content.</Typography>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Approval/Rejection Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
          }
        }}
      >
        <DialogTitle>
          {dialogAction === 'approve' ? 'Approve' : 'Reject'} Publication Request
        </DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            {dialogAction === 'approve' 
              ? 'This will publish the news post for all society members to view.'
              : 'This will mark the post as "Rejected" and return it to the author for further editing. The author will be able to see your feedback and resubmit after making changes.'}
          </DialogContentText>
          
          <TextField
            label="Admin Notes (optional)"
            multiline
            rows={4}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            fullWidth
            placeholder={dialogAction === 'approve' 
              ? 'Any comments about the approved content...' 
              : 'Reason for rejection or suggestions for improvement...'}
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: colors.grey[500],
                },
                '&:hover fieldset': {
                  borderColor: colors.grey[400],
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.blueAccent[400],
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.grey[300],
              },
              '& .MuiInputBase-input': {
                color: colors.grey[100],
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: colors.grey[300] }}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessRequest}
            variant="contained"
            color={dialogAction === 'approve' ? 'success' : 'error'}
            disabled={processingAction}
            startIcon={processingAction ? <CircularProgress size={20} /> : null}
          >
            {dialogAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewsApprovalDashboard;