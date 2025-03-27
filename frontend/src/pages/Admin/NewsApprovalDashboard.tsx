import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Card,
  CardContent,
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

interface DialogState {
  open: boolean;
  action: 'approve' | 'reject' | null;
  notes: string;
  processing: boolean;
  currentRequest: PublicationRequest | null;
}

interface RequestsState {
  items: PublicationRequest[];
  loading: boolean;
  tabValue: number;
  expandedRequestId: number | null;
}

interface ContentsState {
  items: Record<number, NewsContent>;
  loading: Record<number, boolean>;
}


const fetchAllRequests = async (): Promise<PublicationRequest[]> => {
  const response = await apiClient.get('/api/news/publication-request/', {
    params: { all_statuses: 'true' }
  });
  return response.data;
};

const fetchNewsContent = async (newsPostId: number): Promise<NewsContent> => {
  const response = await apiClient.get(`/api/news/${newsPostId}/detail/`);
  return response.data;
};

const updateRequestStatus = async (
  requestId: number, 
  status: string, 
  notes: string
): Promise<void> => {
  await apiClient.put(`/api/admin/news/publication-request/${requestId}/`, {
    status,
    admin_notes: notes
  });
};


const getStatusColor = (status: string): 'warning' | 'success' | 'error' => {
  if (status === 'Pending') return 'warning';
  if (status === 'Approved') return 'success';
  return 'error';
};

const filterRequestsByTab = (requests: PublicationRequest[], tabValue: number): PublicationRequest[] => {
  if (tabValue === 0) return requests.filter(request => request.status === 'Pending');
  if (tabValue === 1) return requests.filter(request => request.status === 'Approved');
  if (tabValue === 2) return requests.filter(request => request.status === 'Rejected');
  return requests;
};

const countRequestsByStatus = (requests: PublicationRequest[], status: string): number => {
  return requests.filter(r => r.status === status).length;
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};


const PageHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  
  return (
    <Box display="flex" alignItems="center" mb={3}>
      <IconButton onClick={onBack} sx={{ mr: 1 }}>
        <BackIcon />
      </IconButton>
      <Typography variant="h4">News Publication Approval</Typography>
    </Box>
  );
};

const StatusTabs: React.FC<{
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}> = ({ value, onChange, pendingCount, approvedCount, rejectedCount }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Tabs 
      value={value} 
      onChange={onChange} 
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
      <Tab label={`Pending (${pendingCount})`} />
      <Tab label={`Approved (${approvedCount})`} />
      <Tab label={`Rejected (${rejectedCount})`} />
    </Tabs>
  );
};

const LoadingIndicator: React.FC = () => {
  return (
    <Box display="flex" justifyContent="center" p={4}>
      <CircularProgress />
    </Box>
  );
};

const EmptyState: React.FC<{ tabValue: number }> = ({ tabValue }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const getStatusText = (tabValue: number): string => {
    if (tabValue === 0) return 'pending';
    if (tabValue === 1) return 'approved';
    return 'rejected';
  };
  
  return (
    <Paper sx={{ 
      p: 4, 
      textAlign: 'center',
      backgroundColor: colors.primary[400],
    }}>
      <Typography variant="h6">No {getStatusText(tabValue)} publication requests</Typography>
    </Paper>
  );
};

const RequestHeader: React.FC<{
  request: PublicationRequest;
  isExpanded: boolean;
}> = ({ request, isExpanded }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" gutterBottom>
            {request.news_post_title || 'Untitled News Post'}
          </Typography>
          <IconButton
            size="small"
            sx={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
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
            {formatDateTime(request.requested_at)}
          </Typography>
        </Box>
      </Box>
      <Chip 
        label={request.status} 
        color={getStatusColor(request.status)}
        sx={{
          fontWeight: 'bold'
        }}
      />
    </Box>
  );
};

const ContentPreview: React.FC<{
  content: string;
}> = ({ content }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <>
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>Content Preview:</Typography>
      <Box sx={{ 
        p: 2, 
        border: `1px solid ${colors.grey[700]}`,
        borderRadius: 1,
        maxHeight: '300px',
        overflow: 'auto',
        backgroundColor: colors.primary[500],
      }}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </Box>
    </>
  );
};

const ActionButtons: React.FC<{
  onApprove: () => void;
  onReject: () => void;
}> = ({ onApprove, onReject }) => {
  return (
    <Box display="flex" gap={2} mt={3}>
      <Button
        variant="contained"
        color="success"
        startIcon={<ApproveIcon />}
        onClick={onApprove}
      >
        Approve
      </Button>
      <Button
        variant="contained"
        color="error"
        startIcon={<RejectIcon />}
        onClick={onReject}
      >
        Reject
      </Button>
    </Box>
  );
};

const StatusMessage: React.FC<{
  status: string;
  notes: string | null;
}> = ({ status, notes }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const backgroundColor = status === 'Approved' 
    ? colors.greenAccent[900] 
    : colors.redAccent[900];
  
  return (
    <Box 
      mt={3} 
      p={2} 
      bgcolor={backgroundColor} 
      borderRadius={1}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        This request has been {status.toLowerCase()}.
      </Typography>
      {notes && (
        <Box mt={1}>
          <Typography variant="subtitle2" fontWeight="bold">Admin notes:</Typography>
          <Typography variant="body2">{notes}</Typography>
        </Box>
      )}
    </Box>
  );
};

const RequestCard: React.FC<{
  request: PublicationRequest;
  isExpanded: boolean;
  newsContent: NewsContent | undefined;
  isLoadingContent: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({
  request,
  isExpanded,
  newsContent,
  isLoadingContent,
  onToggleExpand,
  onApprove,
  onReject
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Card 
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
        onClick={onToggleExpand}
      >
        <RequestHeader request={request} isExpanded={isExpanded} />
      </CardContent>
      
      <Collapse in={isExpanded}>
        <Divider />
        <CardContent>
          {isLoadingContent ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={30} />
            </Box>
          ) : newsContent ? (
            <Box>
              <ContentPreview content={newsContent.content} />
              
              {request.status === 'Pending' && (
                <ActionButtons 
                  onApprove={onApprove} 
                  onReject={onReject} 
                />
              )}
              
              {request.status !== 'Pending' && (
                <StatusMessage 
                  status={request.status} 
                  notes={request.admin_notes} 
                />
              )}
            </Box>
          ) : (
            <Typography>Error loading content.</Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

const ActionDialog: React.FC<{
  dialogState: DialogState;
  onClose: () => void;
  onProcess: () => void;
  onNotesChange: (notes: string) => void;
}> = ({ dialogState, onClose, onProcess, onNotesChange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const { open, action, notes, processing } = dialogState;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.primary[400],
        }
      }}
    >
      <DialogTitle>
        {action === 'approve' ? 'Approve' : 'Reject'} Publication Request
      </DialogTitle>
      <DialogContent>
        <DialogContentText gutterBottom>
          {action === 'approve' 
            ? 'This will publish the news post for all society members to view.'
            : 'This will mark the post as "Rejected" and return it to the author for further editing. The author will be able to see your feedback and resubmit after making changes.'}
        </DialogContentText>
        
        <TextField
          label="Admin Notes (optional)"
          multiline
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          fullWidth
          placeholder={action === 'approve' 
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
        <Button onClick={onClose} sx={{ color: colors.grey[300] }}>
          Cancel
        </Button>
        <Button 
          onClick={onProcess}
          variant="contained"
          color={action === 'approve' ? 'success' : 'error'}
          disabled={processing}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          {action === 'approve' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const NewsApprovalDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [requestsState, setRequestsState] = useState<RequestsState>({
    items: [],
    loading: true,
    tabValue: 0,
    expandedRequestId: null
  });

  
  const [contentsState, setContentsState] = useState<ContentsState>({
    items: {},
    loading: {}
  });

  
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    action: null,
    notes: '',
    processing: false,
    currentRequest: null
  });

  
  useEffect(() => {
    loadAllRequests();
  }, []);

  
  const setRequests = (items: PublicationRequest[]): void => {
    setRequestsState(prev => ({ ...prev, items }));
  };

  const setRequestsLoading = (loading: boolean): void => {
    setRequestsState(prev => ({ ...prev, loading }));
  };

  const setTabValue = (tabValue: number): void => {
    setRequestsState(prev => ({ ...prev, tabValue }));
  };

  const setExpandedRequestId = (expandedRequestId: number | null): void => {
    setRequestsState(prev => ({ ...prev, expandedRequestId }));
  };

  const setNewsContent = (newsPostId: number, content: NewsContent): void => {
    setContentsState(prev => ({
      ...prev,
      items: { ...prev.items, [newsPostId]: content }
    }));
  };

  const setContentLoading = (newsPostId: number, loading: boolean): void => {
    setContentsState(prev => ({
      ...prev,
      loading: { ...prev.loading, [newsPostId]: loading }
    }));
  };

  
  const loadAllRequests = async (): Promise<void> => {
    setRequestsLoading(true);
    
    try {
      const data = await fetchAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching publication requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadNewsContent = async (newsPostId: number): Promise<void> => {
    
    if (contentsState.items[newsPostId]) return;
    
    setContentLoading(newsPostId, true);
    
    try {
      const content = await fetchNewsContent(newsPostId);
      setNewsContent(newsPostId, content);
    } catch (error) {
      console.error('Error fetching news content:', error);
    } finally {
      setContentLoading(newsPostId, false);
    }
  };

  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
    setExpandedRequestId(null); 
  };

  const handleToggleRequestExpansion = (request: PublicationRequest): void => {
    
    if (requestsState.expandedRequestId === request.id) {
      setExpandedRequestId(null);
      return;
    }

    
    setExpandedRequestId(request.id);
    loadNewsContent(request.news_post);
  };

  const handleOpenDialog = (request: PublicationRequest, action: 'approve' | 'reject'): void => {
    setDialogState({
      open: true,
      action,
      notes: '',
      processing: false,
      currentRequest: request
    });
  };

  const handleCloseDialog = (): void => {
    setDialogState({
      open: false,
      action: null,
      notes: '',
      processing: false,
      currentRequest: null
    });
  };

  const handleNotesChange = (notes: string): void => {
    setDialogState(prev => ({ ...prev, notes }));
  };

  const optimisticallyUpdateRequest = (request: PublicationRequest, newStatus: string): PublicationRequest => {
    const updatedRequest = { ...request, status: newStatus };
  
    setRequests(
      requestsState.items.map(req => 
        req.id === request.id ? updatedRequest : req
      )
    );

    return updatedRequest;
  };
  

  const handleProcessRequest = async (): Promise<void> => {
    const { currentRequest, action, notes } = dialogState;
    if (!currentRequest || !action) return;
    
    setDialogState(prev => ({ ...prev, processing: true }));
    
    try {
      
      const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
      
      
      const updatedRequest = optimisticallyUpdateRequest(currentRequest, newStatus);
      
      
      setTabValue(action === 'approve' ? 1 : 2);
      
      
      handleCloseDialog();
      
      
      setExpandedRequestId(updatedRequest.id);
      
      
      await updateRequestStatus(currentRequest.id, newStatus, notes);
      
      
      await refreshAllData(currentRequest.news_post);
    } catch (error) {
      console.error('Error processing request:', error);
      
      
      loadAllRequests();
    } finally {
      setDialogState(prev => ({ ...prev, processing: false }));
    }
  };

  const refreshAllData = async (newsPostId: number): Promise<void> => {
    
    const updatedRequests = await fetchAllRequests();
    setRequests(updatedRequests);
    
    
    if (contentsState.items[newsPostId]) {
      const updatedContent = await fetchNewsContent(newsPostId);
      setNewsContent(newsPostId, updatedContent);
    }
  };

  
  const filteredRequests = filterRequestsByTab(requestsState.items, requestsState.tabValue);

  
  return (
    <Box p={3}>
      <PageHeader onBack={() => navigate(-1)} />
      
      <StatusTabs 
        value={requestsState.tabValue} 
        onChange={handleTabChange} 
        pendingCount={countRequestsByStatus(requestsState.items, 'Pending')}
        approvedCount={countRequestsByStatus(requestsState.items, 'Approved')}
        rejectedCount={countRequestsByStatus(requestsState.items, 'Rejected')}
      />
      
      {requestsState.loading ? (
        <LoadingIndicator />
      ) : filteredRequests.length === 0 ? (
        <EmptyState tabValue={requestsState.tabValue} />
      ) : (
        <Box>
          {filteredRequests.map((request) => (
            <RequestCard 
              key={request.id}
              request={request}
              isExpanded={requestsState.expandedRequestId === request.id}
              newsContent={contentsState.items[request.news_post]}
              isLoadingContent={!!contentsState.loading[request.news_post]}
              onToggleExpand={() => handleToggleRequestExpansion(request)}
              onApprove={() => handleOpenDialog(request, 'approve')}
              onReject={() => handleOpenDialog(request, 'reject')}
            />
          ))}
        </Box>
      )}
      
      <ActionDialog 
        dialogState={dialogState}
        onClose={handleCloseDialog}
        onProcess={handleProcessRequest}
        onNotesChange={handleNotesChange}
      />
    </Box>
  );
};

export default NewsApprovalDashboard;