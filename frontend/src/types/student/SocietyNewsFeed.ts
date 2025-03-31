import { tokens } from '../../theme/theme';

export interface Society {
  id: number;
  name: string;
  icon: string | null;
}

export interface Author {
  id: number;
  username: string;
  full_name: string;
}

export interface NewsPost {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  society_data: Society;
  author_data: Author;
  created_at: string;
  published_at: string;
  is_pinned: boolean;
  is_featured: boolean;
  tags: string[];
  view_count: number;
  comment_count: number;
}

export interface SocietyNewsFeedProps {
  societyId?: number;
}

export interface StyleProps {
  colors: ReturnType<typeof tokens>;
}

export interface SocietyAvatarProps {
  society: Society;
  size?: number;
}

export interface PostTagsProps {
  tags: string[];
  isFeatured: boolean;
  maxVisible?: number;
  styleProps: StyleProps;
}

export interface PostStatsProps {
  viewCount: number;
  commentCount: number;
  size?: "small" | "medium";
  styleProps: StyleProps;
}

export interface BookmarkButtonProps {
  postId: number;
  bookmarked: number[];
  onToggleBookmark: (id: number) => void;
  size?: "small" | "medium";
  styleProps: StyleProps;
}

export interface DetailedPostViewProps {
  post: NewsPost;
  onBack: () => void;
  onHide: (postId: number) => void;
  bookmarked: number[];
  toggleBookmark: (postId: number) => void;
  styleProps: StyleProps;
}

export interface NewsCardProps {
  post: NewsPost;
  onPostClick: (post: NewsPost) => void;
  onHidePost: (postId: number) => void;
  styleProps: StyleProps;
}

export interface NewsFeedProps {
  loading: boolean;
  newsPosts: NewsPost[];
  visiblePosts: NewsPost[];
  hiddenPosts: number[];
  societyId?: number;
  onPostClick: (post: NewsPost) => void;
  onHidePost: (postId: number) => void;
  resetHidden: () => void;
  styleProps: StyleProps;
}

export interface PostImageProps {
  imageUrl: string;
  title: string;
  height: string;
  styleProps: StyleProps;
  card?: boolean;
}

export interface SocietyInfoProps {
  post: NewsPost;
  size?: "small" | "medium";
  styleProps: StyleProps;
}

export interface PostTitleProps {
  title: string;
  isPinned: boolean;
  onClick?: () => void;
  styleProps: StyleProps;
}

export interface PostContentProps {
  content: string;
  truncated?: boolean;
  styleProps: StyleProps;
}

export interface HidePostButtonProps {
  postId: number;
  onHidePost: (id: number) => void;
  small?: boolean;
  styleProps: StyleProps;
}

export interface AttachmentButtonProps {
  fileName: string;
  fileUrl: string;
  icon: React.ReactNode;
  styleProps: StyleProps;
}

export interface LoadingIndicatorProps {
  styleProps: StyleProps;
}

export interface EmptyFeedProps {
  newsPosts: NewsPost[];
  hiddenPosts: number[];
  societyId?: number;
  onResetHidden: () => void;
  styleProps: StyleProps;
}