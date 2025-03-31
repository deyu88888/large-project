import React from 'react';

export interface NewsContent {
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

export interface PublicationRequest {
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

export interface DialogState {
  open: boolean;
  action: 'approve' | 'reject' | null;
  notes: string;
  processing: boolean;
  currentRequest: PublicationRequest | null;
}

export interface RequestsState {
  items: PublicationRequest[];
  loading: boolean;
  tabValue: number;
  expandedRequestId: number | null;
}

export interface ContentsState {
  items: Record<number, NewsContent>;
  loading: Record<number, boolean>;
}

export interface PageHeaderProps {
  onBack: () => void;
}

export interface StatusTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface EmptyStateProps {
  tabValue: number;
}

export interface RequestHeaderProps {
  request: PublicationRequest;
  isExpanded: boolean;
}

export interface FeaturedImageProps {
  imageUrl: string | null;
}

export interface TagsDisplayProps {
  tags: string[];
}

export interface AttachmentDisplayProps {
  attachmentName: string | null;
  attachmentUrl: string | null;
}

export interface MetadataDisplayProps {
  newsContent: NewsContent;
}

export interface ContentPreviewProps {
  content: string;
}

export interface ActionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
}

export interface StatusMessageProps {
  status: string;
  notes: string | null;
}

export interface RequestCardProps {
  request: PublicationRequest;
  isExpanded: boolean;
  newsContent: NewsContent | undefined;
  isLoadingContent: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export interface ActionDialogProps {
  dialogState: DialogState;
  onClose: () => void;
  onProcess: () => void;
  onNotesChange: (notes: string) => void;
}