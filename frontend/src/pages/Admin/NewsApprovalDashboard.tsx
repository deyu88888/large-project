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
  Avatar,
  Grid,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  LocalOffer as TagIcon,
  PushPin as PushPinIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../../theme/theme';
import { alpha } from '@mui/material/styles';
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";

interface NewsContent {
  id: number;
  title: string;
  content: string;
  status: string;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  image_url: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  society_data?: {
    id: number;
    name: string;
  };
  author_data: {
    id: number;
    username: string;
    full_name: string;
  };
  created_at: string;
  comment_count: number;
  view_count: number;
}

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
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{
      pb: 2,
      borderBottom: `1px solid ${alpha(colors.grey[500], 0.3)}`,
    }}>
      <Box display="flex" alignItems="center">
        <IconButton 
          onClick={onBack} 
          sx={{ 
            mr: 2,
            backgroundColor: alpha(colors.grey[500], 0.1),
            '&:hover': {
              backgroundColor: alpha(colors.grey[500], 0.2),
            },
          }}
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">News Publication Approval</Typography>
      </Box>
      
      
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


const FeaturedImage: React.FC<{
  imageUrl: string | null;
}> = ({ imageUrl }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  if (!imageUrl) return null;
  
  return (
    <Box mb={3}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>Featured Image:</Typography>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '300px',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: `0 4px 20px ${alpha(colors.primary[900], 0.3)}`,
        }}
      >
        <img
          src={imageUrl}
          alt="Featured"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
    </Box>
  );
};

const TagsDisplay: React.FC<{
  tags: string[];
}> = ({ tags }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  if (!tags || tags.length === 0) return null;
  
  return (
    <Box mb={3}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center">
        <TagIcon sx={{ mr: 1, fontSize: 20 }} />
        Tags:
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            sx={{
              backgroundColor: alpha(colors.blueAccent[700], 0.2),
              color: colors.grey[100],
              borderRadius: '6px',
              fontWeight: 'medium',
              border: `1px solid ${alpha(colors.blueAccent[500], 0.3)}`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const AttachmentDisplay: React.FC<{
  attachmentName: string | null;
  attachmentUrl: string | null;
}> = ({ attachmentName, attachmentUrl }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  if (!attachmentName || !attachmentUrl) return null;
  
  return (
    <Box mb={3}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center">
        <AttachFileIcon sx={{ mr: 1, fontSize: 20 }} />
        Attachment:
      </Typography>
      <Button
        variant="outlined"
        startIcon={<AttachFileIcon />}
        onClick={() => window.open(attachmentUrl, '_blank')}
        sx={{
          color: colors.blueAccent[400],
          borderColor: colors.blueAccent[400],
          '&:hover': {
            backgroundColor: alpha(colors.blueAccent[400], 0.1),
            borderColor: colors.blueAccent[300],
          },
        }}
      >
        View PDF: {attachmentName}
      </Button>
    </Box>
  );
};

const MetadataDisplay: React.FC<{
  newsContent: NewsContent;
}> = ({ newsContent }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box
      mb={3}
      sx={{
        backgroundColor: alpha(colors.primary[500], 0.3),
        borderRadius: '8px',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PushPinIcon sx={{ 
              color: newsContent.is_pinned ? colors.greenAccent[500] : colors.grey[500],
              fontSize: 20 
            }} />
            <Typography>
              {newsContent.is_pinned ? 'Pinned Post' : 'Not Pinned'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <StarIcon sx={{ 
              color: newsContent.is_featured ? colors.blueAccent[500] : colors.grey[500],
              fontSize: 20 
            }} />
            <Typography>
              {newsContent.is_featured ? 'Featured Post' : 'Not Featured'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <TimeIcon sx={{ color: colors.grey[500], fontSize: 20 }} />
            <Typography variant="body2" color={colors.grey[300]}>
              Created: {formatDateTime(newsContent.created_at)}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="flex-start" gap={1}>
            <PersonIcon sx={{ color: colors.grey[500], fontSize: 20, mt: 0.5 }} />
            <Box>
              <Typography variant="body2">
                Author: {newsContent.author_data?.full_name || 'Unknown'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
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
        mb: 3,
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
        sx={{
          fontWeight: 'bold',
          px: 3,
          py: 1,
          borderRadius: '8px',
        }}
      >
        Approve Publication
      </Button>
      <Button
        variant="contained"
        color="error"
        startIcon={<RejectIcon />}
        onClick={onReject}
        sx={{
          fontWeight: 'bold',
          px: 3,
          py: 1,
          borderRadius: '8px',
        }}
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
    ? alpha(colors.greenAccent[700], 0.2)
    : alpha(colors.redAccent[700], 0.2);
  
  const borderColor = status === 'Approved'
    ? alpha(colors.greenAccent[500], 0.5)
    : alpha(colors.redAccent[500], 0.5);
  
  const textColor = status === 'Approved'
    ? colors.greenAccent[400]
    : colors.redAccent[400];
  
  return (
    <Box 
      mt={3} 
      p={3} 
      sx={{
        backgroundColor,
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" color={textColor}>
        This request has been {status.toLowerCase()}.
      </Typography>
      {notes && (
        <Box mt={2} sx={{ backgroundColor: alpha(colors.primary[800], 0.3), p: 2, borderRadius: '4px' }}>
          <Typography variant="subtitle2" fontWeight="bold" color={colors.grey[100]}>
            Admin notes:
          </Typography>
          <Typography variant="body2" color={colors.grey[300]} mt={1}>
            {notes}
          </Typography>
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
        mb: 3,
        backgroundColor: colors.primary[400],
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: isExpanded ? 'none' : 'translateY(-5px)',
          boxShadow: isExpanded ? 'none' : '0 12px 24px -10px rgba(0,0,0,0.3)',
        },
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        borderRadius: '10px',
        overflow: 'visible',
      }}
    >
      <CardContent 
        sx={{ 
          cursor: 'pointer',
          p: 3,
          '&:hover': {
            backgroundColor: isExpanded ? 'transparent' : alpha(colors.primary[500], 0.4),
          },
          transition: 'background-color 0.2s ease',
        }}
        onClick={onToggleExpand}
      >
        <RequestHeader request={request} isExpanded={isExpanded} />
      </CardContent>
      
      <Collapse in={isExpanded}>
        <Divider sx={{ opacity: 0.3 }} />
        <CardContent sx={{ p: 3 }}>
          {isLoadingContent ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : newsContent ? (
            <Box>
              {/* New metadata section showing pinned/featured status */}
              <MetadataDisplay newsContent={newsContent} />
              
              {/* Display featured image if available */}
              <FeaturedImage imageUrl={newsContent.image_url} />
              
              {/* Display content preview */}
              <ContentPreview content={newsContent.content} />
              
              {/* Display tags if available */}
              <TagsDisplay tags={newsContent.tags} />
              
              {/* Display attachment if available */}
              <AttachmentDisplay 
                attachmentName={newsContent.attachment_name} 
                attachmentUrl={newsContent.attachment_url} 
              />
              
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
          borderRadius: '10px',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {action === 'approve' ? 'Approve' : 'Reject'} Publication Request
      </DialogTitle>
      <DialogContent>
        <DialogContentText 
          sx={{ 
            color: colors.grey[200],
            mb: 2,
            backgroundColor: alpha(colors.primary[500], 0.3),
            p: 2,
            borderRadius: '8px',
          }}
        >
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
                borderRadius: '8px',
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
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: colors.grey[300],
            '&:hover': {
              backgroundColor: alpha(colors.grey[700], 0.3),
            },
            borderRadius: '8px',
            fontWeight: 'medium',
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onProcess}
          variant="contained"
          color={action === 'approve' ? 'success' : 'error'}
          disabled={processing}
          startIcon={processing ? <CircularProgress size={20} /> : null}
          sx={{
            fontWeight: 'bold',
            borderRadius: '8px',
            px: 3,
          }}
        >
          {action === 'approve' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const NewsApprovalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

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

  const fetchPublicationRequests = async () => {
    try {
      const data = await fetchAllRequests();
      return data;
    } catch (error) {
      console.error('Error fetching publication requests:', error);
      return [];
    }
  };
  
  
  const { 
    isConnected, 
    refresh,
    error: wsError 
  } = useWebSocketChannel(
    'dashboard_stats', 
    fetchPublicationRequests
  );
  
  
  useEffect(() => {
    if (wsError) {
      console.error(`WebSocket error: ${wsError}`);
    }
  }, [wsError]);
  
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
      
      if (refresh) {
        const data = await refresh();
        if (data) {
          setRequests(data);
        }
      } else {
        const data = await fetchAllRequests();
        setRequests(data);
      }
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