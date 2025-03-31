import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme, Box, Typography, Paper, Button, CircularProgress, Chip, 
  Avatar, Divider, Card, CardContent, CardActions, IconButton } from '@mui/material';
import { tokens } from '../../theme/theme';
import { apiClient } from "../../api";

import NewsComment from "../../components/NewsComment";
import {
  Comment as CommentIcon,
  StarOutline as StarOutlineIcon,
  PushPin as PushPinIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AttachFile as AttachFileIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NewsPost,
  SocietyNewsFeedProps,
  StyleProps,
  SocietyAvatarProps,
  PostTagsProps,
  PostStatsProps,
  BookmarkButtonProps,
  DetailedPostViewProps,
  NewsCardProps,
  NewsFeedProps,
  PostImageProps,
  SocietyInfoProps,
  PostTitleProps,
  PostContentProps,
  HidePostButtonProps,
  AttachmentButtonProps,
  LoadingIndicatorProps,
  EmptyFeedProps
} from '../../types/student/SocietyNewsFeed';


const formatDateTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};


const SocietyAvatar: React.FC<SocietyAvatarProps> = ({ society, size = 40 }) => {
  return (
    <Avatar
      src={society.icon || undefined}
      sx={{ width: size, height: size, mr: 2 }}
      alt={society.name}
    >
      {society.name.charAt(0)}
    </Avatar>
  );
};


const PostTags: React.FC<PostTagsProps> = ({ 
  tags, 
  isFeatured, 
  maxVisible = 3,
  styleProps
}) => {
  const { colors } = styleProps;
  
  return (
    <Box display="flex" flexWrap="wrap" mb={1}>
      {isFeatured && (
        <Chip
          icon={<StarOutlineIcon />}
          label="Featured"
          size="small"
          sx={{ backgroundColor: colors.blueAccent[700], mr: 1, mb: 1 }}
        />
      )}

      {tags.slice(0, maxVisible).map(tag => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          sx={{ 
            mr: 1, 
            mb: 1, 
            backgroundColor: colors.grey[700],
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.grey[600],
            }
          }}
        />
      ))}

      {tags.length > maxVisible && (
        <Typography variant="caption" sx={{ color: colors.grey[300] }}>
          +{tags.length - maxVisible} more
        </Typography>
      )}
    </Box>
  );
};


const PostStats: React.FC<PostStatsProps> = ({ 
  viewCount, 
  commentCount,
  size = "medium",
  styleProps
}) => {
  const { colors } = styleProps;
  
  const fontSize = size === "small" ? 16 : 18;
  const marginRight = size === "small" ? 0.5 : 1;
  const marginBetween = size === "small" ? 2 : 3;
  const textVariant = size === "small" ? "caption" : "body2";
  
  return (
    <Box display="flex" alignItems="center">
      <Box display="flex" alignItems="center" mr={marginBetween}>
        <VisibilityIcon sx={{ fontSize, mr: marginRight, color: colors.grey[300] }} />
        <Typography variant={textVariant} color={colors.grey[300]}>
          {viewCount} {size === "medium" && "views"}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center">
        <CommentIcon sx={{ fontSize, mr: marginRight, color: colors.grey[300] }} />
        <Typography variant={textVariant} color={colors.grey[300]}>
          {commentCount} {size === "medium" && "comments"}
        </Typography>
      </Box>
    </Box>
  );
};


const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  postId,
  bookmarked,
  onToggleBookmark,
  size = "medium",
  styleProps
}) => {
  const { colors } = styleProps;
  const isBookmarked = bookmarked.includes(postId);
  
  return (
    <IconButton
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        onToggleBookmark(postId);
      }}
      sx={{
        color: isBookmarked ? colors.greenAccent[500] : colors.grey[300],
        transition: 'all 0.2s ease',
        '&:hover': {
          color: isBookmarked ? colors.greenAccent[400] : colors.grey[200],
          transform: 'scale(1.1)',
        },
      }}
    >
      {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
    </IconButton>
  );
};


const PostImage: React.FC<PostImageProps> = ({ imageUrl, title, height, styleProps, card = false }) => {
  const { colors } = styleProps;
  
  return (
    <Box 
      sx={{ 
        height: height, 
        overflow: 'hidden', 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary[600],
        position: 'relative',
        borderRadius: card ? 1 : 0,
        mb: card ? 2 : 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: card ? '30px' : '40px',
          background: `linear-gradient(to top, ${colors.primary[400]}, transparent)`,
        }
      }}
    >
      <img 
        src={imageUrl} 
        alt={title} 
        style={{ 
          width: '100%', 
          height: card ? '100%' : 'auto',
          objectFit: 'cover',
          maxHeight: '100%',
          transition: 'transform 0.3s ease-in-out',
        }} 
      />
    </Box>
  );
};


const SocietyInfo: React.FC<SocietyInfoProps> = ({ post, size = "medium", styleProps }) => {
  const { colors } = styleProps;
  const avatarSize = size === "small" ? 32 : 40;
  
  return (
    <Box display="flex" alignItems="center" mb={2}>
      <SocietyAvatar society={post.society_data} size={avatarSize} />
      <Box>
        <Typography variant={size === "small" ? "subtitle1" : "h6"}>
          {post.society_data.name}
        </Typography>
        <Typography variant="caption" color={colors.grey[300]}>
          {size === "medium" && "Posted by " + post.author_data.full_name + " on "}
          {formatDateTime(post.published_at)}
        </Typography>
      </Box>
    </Box>
  );
};


const PostTitle: React.FC<PostTitleProps> = ({ title, isPinned, onClick, styleProps }) => {
  const { colors } = styleProps;
  
  return (
    <Typography 
      variant="h5" 
      fontWeight="bold" 
      mb={1}
      onClick={onClick}
      sx={onClick ? { 
        cursor: 'pointer',
        transition: 'color 0.2s',
        '&:hover': { color: colors.blueAccent[300] } 
      } : {}}
    >
      {isPinned && (
        <PushPinIcon
          sx={{
            mr: 1,
            verticalAlign: 'middle',
            color: colors.greenAccent[500],
            fontSize: onClick ? '0.9em' : '1em',
          }}
        />
      )}
      {title}
    </Typography>
  );
};


const PostContent: React.FC<PostContentProps> = ({ content, truncated = false, styleProps }) => {
  const { colors } = styleProps;
  
  const processedContent = truncated 
    ? content.replace(/<img[^>]*>/g, '[Image]')
    : content;
  
  return (
    <Box
      sx={truncated ? {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        mb: 2,
        color: colors.grey[200],
        lineHeight: 1.6,
      } : {
        mb: 3,
        fontSize: '1rem',
        lineHeight: 1.6,
        '& img': { 
          maxWidth: '100%',
          borderRadius: '4px',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
        },
        '& a': { 
          color: colors.blueAccent[300],
          textDecoration: 'none',
          borderBottom: `1px solid ${colors.blueAccent[500]}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            color: colors.blueAccent[200],
            borderBottomColor: colors.blueAccent[300],
          }
        },
        '& p': {
          marginBottom: '1em',
        },
        '& blockquote': {
          borderLeft: `4px solid ${colors.blueAccent[500]}`,
          padding: '0.5em 1em',
          backgroundColor: colors.primary[500],
          borderRadius: '0 4px 4px 0',
        }
      }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};


const HidePostButton: React.FC<HidePostButtonProps> = ({ postId, onHidePost, small = false, styleProps }) => {
  const { colors } = styleProps;
  
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <IconButton
        size={small ? "small" : "medium"}
        onClick={(e) => {
          e.stopPropagation();
          onHidePost(postId);
        }}
        sx={{
          ml: small ? 0 : 1,
          color: colors.grey[300],
          transition: 'all 0.2s ease',
          '&:hover': {
            color: colors.grey[100],
            backgroundColor: colors.primary[300],
            transform: 'scale(1.1)',
          }
        }}
      >
        <VisibilityOffIcon fontSize={small ? "small" : "medium"} />
      </IconButton>
    </motion.div>
  );
};


const AttachmentButton: React.FC<AttachmentButtonProps> = ({ fileName, fileUrl, icon, styleProps }) => {
  const { colors } = styleProps;
  
  return (
    <Button
      variant="outlined"
      sx={{ 
        mt: 2, 
        mb: 3,
        borderColor: colors.blueAccent[400],
        color: colors.blueAccent[300],
        '&:hover': {
          borderColor: colors.blueAccent[300],
          backgroundColor: colors.primary[500],
        }
      }}
      startIcon={icon}
      onClick={() => window.open(fileUrl, '_blank')}
    >
      View PDF: {fileName}
    </Button>
  );
};


const DetailedPostView: React.FC<DetailedPostViewProps> = ({ 
  post, 
  onBack,
  onHide,
  bookmarked,
  toggleBookmark,
  styleProps
}) => {
  const { colors } = styleProps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton 
            onClick={onBack} 
            sx={{ 
              mr: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: colors.primary[300],
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">News Post</Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{ 
            backgroundColor: colors.primary[400], 
            overflow: 'hidden',
            borderRadius: '8px',
            boxShadow: `0 6px 20px rgba(0, 0, 0, 0.15)`,
          }}
        >
          {post.image_url && (
            <PostImage 
              imageUrl={post.image_url} 
              title={post.title} 
              height="300px" 
              styleProps={styleProps}
            />
          )}
          
          <Box p={3}>
            <SocietyInfo post={post} styleProps={styleProps} />

            <PostTitle 
              title={post.title} 
              isPinned={post.is_pinned} 
              styleProps={styleProps} 
            />

            <Box mb={3}>
              <PostTags 
                tags={post.tags} 
                isFeatured={post.is_featured}
                maxVisible={10}
                styleProps={styleProps}
              />
            </Box>

            <PostContent content={post.content} styleProps={styleProps} />

            {post.attachment_name && post.attachment_url && (
              <AttachmentButton 
                fileName={post.attachment_name} 
                fileUrl={post.attachment_url}
                icon={<AttachFileIcon />}
                styleProps={styleProps} 
              />
            )}

            <Divider sx={{ mb: 3 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <PostStats 
                viewCount={post.view_count} 
                commentCount={post.comment_count}
                styleProps={styleProps}
              />
              
              <Box display="flex" alignItems="center">
                <BookmarkButton 
                  postId={post.id}
                  bookmarked={bookmarked}
                  onToggleBookmark={toggleBookmark}
                  styleProps={styleProps}
                />
                <HidePostButton 
                  postId={post.id} 
                  onHidePost={(id) => {
                    onHide(id);
                    onBack();
                  }}
                  styleProps={styleProps}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Discussion
            </Typography>

            <Box mt={2}>
              <NewsComment newsId={post.id} />
            </Box>
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );
};


const NewsCard: React.FC<NewsCardProps> = ({ post, onPostClick, onHidePost, styleProps }) => {
  const { colors } = styleProps;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          mb: 3,
          backgroundColor: colors.primary[400],
          borderLeft: post.is_pinned ? `4px solid ${colors.greenAccent[500]}` : 'none',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: post.is_pinned 
            ? `0 6px 15px rgba(0, 0, 0, 0.15), 0 0 0 1px ${colors.greenAccent[800]}`
            : `0 4px 12px rgba(0, 0, 0, 0.1)`,
          '&:hover': {
            boxShadow: post.is_pinned
              ? `0 10px 25px rgba(0, 0, 0, 0.2), 0 0 0 2px ${colors.greenAccent[700]}`
              : `0 8px 20px rgba(0, 0, 0, 0.15)`,
          },
        }}
      >
        <CardContent>
          <SocietyInfo post={post} size="small" styleProps={styleProps} />
          
          <Box
            sx={{
              cursor: 'pointer',
              '&:hover h5': { color: colors.blueAccent[300] },
            }}
            onClick={() => onPostClick(post)}
          >
            <PostTitle 
              title={post.title} 
              isPinned={post.is_pinned} 
              styleProps={styleProps}
              onClick={() => onPostClick(post)}
            />

            {post.image_url && (
              <PostImage 
                imageUrl={post.image_url} 
                title={post.title} 
                height="200px" 
                styleProps={styleProps}
                card={true}
              />
            )}

            <PostContent 
              content={post.content} 
              truncated={true} 
              styleProps={styleProps} 
            />
          </Box>

          <PostTags 
            tags={post.tags} 
            isFeatured={post.is_featured} 
            styleProps={styleProps}
          />
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Box display="flex" alignItems="center">
            <HidePostButton 
              postId={post.id} 
              onHidePost={onHidePost} 
              small={true}
              styleProps={styleProps}
            />
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};


const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ styleProps }) => {
  const { colors } = styleProps;
  
  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight="200px">
      <CircularProgress sx={{ color: colors.blueAccent[400] }} />
    </Box>
  );
};


const EmptyFeed: React.FC<EmptyFeedProps> = ({ 
  newsPosts, 
  hiddenPosts, 
  societyId, 
  onResetHidden, 
  styleProps 
}) => {
  const { colors } = styleProps;
  
  return (
    <Box 
      textAlign="center" 
      p={4} 
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Typography variant="h6" color={colors.grey[300]}>
        {newsPosts.length === 0 
          ? (societyId
            ? "This society hasn't posted any news yet."
            : "No news posts from your societies yet.")
          : "All posts are currently hidden. Refresh the page to reset."}
      </Typography>
      {newsPosts.length > 0 && hiddenPosts.length > 0 && (
        <Button 
          variant="outlined" 
          onClick={onResetHidden}
          sx={{ 
            mt: 2,
            borderColor: colors.blueAccent[400],
            color: colors.blueAccent[300],
            '&:hover': {
              borderColor: colors.blueAccent[300],
              backgroundColor: colors.primary[500],
            }
          }}
        >
          Show All Posts
        </Button>
      )}
    </Box>
  );
};


const NewsFeed: React.FC<NewsFeedProps> = ({ 
  loading, 
  newsPosts, 
  visiblePosts, 
  hiddenPosts, 
  societyId, 
  onPostClick, 
  onHidePost, 
  resetHidden,
  styleProps 
}) => {
  if (loading) {
    return <LoadingIndicator styleProps={styleProps} />;
  }

  if (visiblePosts.length === 0) {
    return (
      <EmptyFeed 
        newsPosts={newsPosts} 
        hiddenPosts={hiddenPosts} 
        societyId={societyId} 
        onResetHidden={resetHidden}
        styleProps={styleProps}
      />
    );
  }

  return (
    <AnimatePresence>
      <Box>
        {visiblePosts.map((post) => (
          <NewsCard 
            key={post.id} 
            post={post} 
            onPostClick={onPostClick} 
            onHidePost={onHidePost}
            styleProps={styleProps}
          />
        ))}
      </Box>
    </AnimatePresence>
  );
};


const useBookmarks = () => {
  const [bookmarkedId, setBookmarkedId] = useState<number | null>(() => {
    const savedBookmark = localStorage.getItem('newsBookmark');
    return savedBookmark ? JSON.parse(savedBookmark) : null;
  });

  const toggleBookmark = useCallback((postId: number) => {
    setBookmarkedId(prev => {
      const newValue = prev === postId ? null : postId;
      localStorage.setItem('newsBookmark', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const bookmarked = bookmarkedId !== null ? [bookmarkedId] : [];

  return { bookmarked, toggleBookmark };
};

const useHiddenPosts = () => {
  const [hiddenPosts, setHiddenPosts] = useState<number[]>(() => {
    const saved = localStorage.getItem('hiddenNewsPosts');
    return saved ? JSON.parse(saved) : [];
  });

  const handleHidePost = useCallback((postId: number) => {
    setHiddenPosts(prev => {
      const updated = [...prev, postId];
      localStorage.setItem('hiddenNewsPosts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetHidden = useCallback(() => {
    setHiddenPosts([]);
    localStorage.removeItem('hiddenNewsPosts');
  }, []);

  return { hiddenPosts, handleHidePost, resetHidden };
};

const useNewsPosts = (societyId?: number, bookmarkedPosts: number[] = []) => {
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = societyId
        ? `/api/society/${societyId}/news/`
        : '/api/news/feed/';
      const response = await apiClient.get(endpoint);
      setNewsPosts(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const sortedPosts = useMemo(() => {
    return [...newsPosts].sort((a, b) => {
      const aIsBookmarked = bookmarkedPosts.includes(a.id);
      const bIsBookmarked = bookmarkedPosts.includes(b.id);
      
      if (aIsBookmarked && !bIsBookmarked) return -1;
      if (!aIsBookmarked && bIsBookmarked) return 1;
      
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [newsPosts, bookmarkedPosts]);

  return { newsPosts, loading, sortedPosts };
};


const SocietyNewsFeed: React.FC<SocietyNewsFeedProps> = ({ societyId }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const styleProps = { colors };
  const { bookmarked, toggleBookmark } = useBookmarks();
  const { newsPosts, loading, sortedPosts } = useNewsPosts(societyId, bookmarked);
  const { hiddenPosts, handleHidePost, resetHidden } = useHiddenPosts();
  
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);

  const visiblePosts = useMemo(() => {
    return sortedPosts.filter(post => !hiddenPosts.includes(post.id));
  }, [sortedPosts, hiddenPosts]);

  const handlePostClick = useCallback((post: NewsPost) => {
    setSelectedPost(post);
  }, []);

  const handleBackToFeed = useCallback(() => {
    setSelectedPost(null);
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        {selectedPost ? (
          <DetailedPostView 
            post={selectedPost} 
            onBack={handleBackToFeed}
            onHide={handleHidePost}
            bookmarked={bookmarked}
            toggleBookmark={toggleBookmark}
            styleProps={styleProps}
          />
        ) : (
          <NewsFeed 
            loading={loading}
            newsPosts={newsPosts}
            visiblePosts={visiblePosts}
            hiddenPosts={hiddenPosts}
            societyId={societyId}
            onPostClick={handlePostClick}
            onHidePost={handleHidePost}
            resetHidden={resetHidden}
            styleProps={styleProps}
          />
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SocietyNewsFeed;