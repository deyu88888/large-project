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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
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

const NewsApprovalDashboard: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [requests, setRequests] = useState<PublicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<PublicationRequest | null>(null);
  const [newsContent, setNewsContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // Approval/rejection dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/news/publication-request/');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching publication requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewRequest = async (request: PublicationRequest) => {
    setSelectedRequest(request);
    setLoadingContent(true);
    
    try {
      const response = await apiClient.get(`/api/news/${request.news_post}/`);
      setNewsContent(response.data);
    } catch (error) {
      console.error('Error fetching news content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleOpenDialog = (action: 'approve' | 'reject') => {
    setDialogAction(action);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogAction(null);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest || !dialogAction) return;
    
    setProcessingAction(true);
    
    try {
      await apiClient.put(`/api/news/publication-request/${selectedRequest.id}/`, {
        status: dialogAction === 'approve' ? 'Approved' : 'Rejected',
        admin_notes: adminNotes
      });
      
      // Update the local state
      setRequests(requests.map(req => 
        req.id === selectedRequest.id
          ? { ...req, status: dialogAction === 'approve' ? 'Approved' : 'Rejected' }
          : req
      ));
      
      // Close dialog and reset
      setDialogOpen(false);
      setSelectedRequest(null);
      setNewsContent(null);
      
      // Refresh the requests
      fetchRequests();
      
    } catch (error) {
      console.error('Error processing request:', error);
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
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={`Pending (${requests.filter(r => r.status === 'Pending').length})`} />
        <Tab label={`Approved (${requests.filter(r => r.status === 'Approved').length})`} />
        <Tab label={`Rejected (${requests.filter(r => r.status === 'Rejected').length})`} />
      </Tabs>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedRequest ? 5 : 12}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : filteredRequests.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6">No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} publication requests</Typography>
            </Paper>
          ) : (
            <Box>
              {filteredRequests.map((request) => (
                <Card 
                  key={request.id} 
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    border: selectedRequest?.id === request.id ? `2px solid ${colors.blueAccent[500]}` : 'none' 
                  }}
                  onClick={() => handleViewRequest(request)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {request.news_post_title || 'Untitled News Post'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Society: {request.society_name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" />
                          <Typography variant="body2">
                            Requested by: {request.requester_name}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <TimeIcon fontSize="small" />
                          <Typography variant="body2">
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
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      startIcon={<ViewIcon />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRequest(request);
                      }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </Grid>
        
        {selectedRequest && (
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              {loadingContent ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : newsContent ? (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {newsContent.title}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip label={`Society: ${newsContent.society_data?.name}`} />
                    <Chip label={`Status: ${newsContent.status}`} />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight="bold">Content Preview:</Typography>
                    <Box sx={{ 
                      mt: 1, 
                      p: 2, 
                      border: `1px solid ${colors.grey[300]}`,
                      borderRadius: 1,
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: newsContent.content }} />
                    </Box>
                  </Box>
                  
                  {selectedRequest.status === 'Pending' && (
                    <Box display="flex" gap={2} mt={3}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleOpenDialog('approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleOpenDialog('reject')}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                  
                  {selectedRequest.status !== 'Pending' && (
                    <Box mt={3} p={2} bgcolor={colors.primary[400]} borderRadius={1}>
                      <Typography variant="subtitle1">
                        This request has been {selectedRequest.status.toLowerCase()}.
                      </Typography>
                      {selectedRequest.admin_notes && (
                        <Box mt={1}>
                          <Typography variant="subtitle2">Admin notes:</Typography>
                          <Typography variant="body2">{selectedRequest.admin_notes}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography>Select a publication request to view details</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
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
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
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