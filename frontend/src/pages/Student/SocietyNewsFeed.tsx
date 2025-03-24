import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme, Box, Typography, Paper, Button, CircularProgress, Chip, 
  Avatar, Divider, Card, CardContent, CardActions, IconButton } from '@mui/material';
import { tokens } from '../../theme/theme';
import {
  getNewsPostDetail,
  getNewsComments,
  createNewsComment,
  updateNewsComment,
  deleteNewsComment,
  toggleLikeOnComment,
  apiClient,
} from "../../api";

import NewsComment from "../../components/NewsComment";
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  StarOutline as StarOutlineIcon,
  PushPin as PushPinIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions
interface Society {
  id: number;
  name: string;
  icon: string | null;
}

interface Author {
  id: number;
  username: string;
  full_name: string;
}

interface NewsPost {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  attachment_name: string | null;
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

interface SocietyNewsFeedProps {
  societyId?: number;
}

// Utility functions
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

// Component for society avatar with fallback
const SocietyAvatar: React.FC<{ society: Society; size?: number }> = ({ society, size = 40 }) => {
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

// Component for post tags
const PostTags: React.FC<{ tags: string[]; isFeatured: boolean; maxVisible?: number }> = ({ 
  tags, 
  isFeatured, 
  maxVisible = 3 
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
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

// Component for post stats (views and comments)
const PostStats: React.FC<{ viewCount: number; commentCount: number; size?: "small" | "medium" }> = ({ 
  viewCount, 
  commentCount,
  size = "medium"
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
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

// Component for bookmark button
const BookmarkButton: React.FC<{ postId: number; bookmarked: number[]; onToggleBookmark: (id: number) => void; size?: "small" | "medium" }> = ({
  postId,
  bookmarked,
  onToggleBookmark,
  size = "medium"
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
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

// Main component
const SocietyNewsFeed: React.FC<SocietyNewsFeedProps> = ({ societyId }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  
  // Track hidden post IDs
  const [hiddenPosts, setHiddenPosts] = useState<number[]>(() => {
    const saved = localStorage.getItem('hiddenNewsPosts');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch news data
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = societyId 
        ? `/api/society/${societyId}/news/` 
        : '/api/my-news-feed/';
      
      const response = await apiClient.get(endpoint);
      setNewsPosts(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  // Load data on mount and when societyId changes
  useEffect(() => {
    fetchNews();
    
    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('newsBookmarks');
    if (savedBookmarks) {
      setBookmarked(JSON.parse(savedBookmarks));
    }
  }, [societyId, fetchNews]);

  // Handlers
  const handlePostClick = useCallback((post: NewsPost) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToFeed = useCallback(() => {
    setSelectedPost(null);
  }, []);
  
  // Hide post handler
  const handleHidePost = useCallback((postId: number) => {
    setHiddenPosts(prev => {
      const updated = [...prev, postId];
      localStorage.setItem('hiddenNewsPosts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleBookmark = useCallback((postId: number) => {
    setBookmarked(prev => {
      const updatedBookmarks = prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId];
      
      // Save to localStorage
      localStorage.setItem('newsBookmarks', JSON.stringify(updatedBookmarks));
      return updatedBookmarks;
    });
  }, []);

  // Memoized sorted posts
  const sortedPosts = useMemo(() => {
    return [...newsPosts].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [newsPosts]);
  
  // Filter out hidden posts
  const visiblePosts = useMemo(() => {
    return sortedPosts.filter(post => !hiddenPosts.includes(post.id));
  }, [sortedPosts, hiddenPosts]);

  // Detailed post view component
  const DetailedPostView = useCallback(() => {
    if (!selectedPost) return null;

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
              onClick={handleBackToFeed} 
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
            {selectedPost.image_url && (
              <Box 
                sx={{ 
                  height: '300px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.primary[600],
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: `linear-gradient(to top, ${colors.primary[400]}, transparent)`,
                  }
                }}
              >
                <img 
                  src={selectedPost.image_url} 
                  alt={selectedPost.title} 
                  style={{ 
                    width: '100%', 
                    objectFit: 'cover',
                    maxHeight: '100%',
                    transition: 'transform 0.3s ease-in-out',
                  }} 
                />
              </Box>
            )}
            
            <Box p={3}>
              {/* Society / Author Info */}
              <Box display="flex" alignItems="center" mb={2}>
                <SocietyAvatar society={selectedPost.society_data} />
                <Box>
                  <Typography variant="h6">{selectedPost.society_data.name}</Typography>
                  <Typography variant="caption" color={colors.grey[300]}>
                    Posted by {selectedPost.author_data.full_name} on{" "}
                    {formatDateTime(selectedPost.published_at)}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h4" fontWeight="bold" mb={2}>
                {selectedPost.is_pinned && (
                  <PushPinIcon
                    sx={{
                      mr: 1,
                      verticalAlign: 'middle',
                      color: colors.greenAccent[500],
                    }}
                  />
                )}
                {selectedPost.title}
              </Typography>

              {/* Featured & Tags */}
              <Box mb={3}>
                <PostTags 
                  tags={selectedPost.tags} 
                  isFeatured={selectedPost.is_featured}
                  maxVisible={10}
                />
              </Box>

              <Box
                mb={3}
                sx={{
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
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />

              {selectedPost.attachment_name && (
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
                  startIcon={<BookmarkIcon />}
                >
                  Download {selectedPost.attachment_name}
                </Button>
              )}

              <Divider sx={{ mb: 3 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <PostStats 
                  viewCount={selectedPost.view_count} 
                  commentCount={selectedPost.comment_count}
                />
                
                <Box display="flex" alignItems="center">
                  <BookmarkButton 
                    postId={selectedPost.id}
                    bookmarked={bookmarked}
                    onToggleBookmark={toggleBookmark}
                  />
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      onClick={() => {
                        handleHidePost(selectedPost.id);
                        handleBackToFeed();
                      }}
                      sx={{
                        ml: 1,
                        color: colors.grey[300],
                        '&:hover': {
                          color: colors.grey[100],
                          backgroundColor: colors.primary[300],
                        }
                      }}
                    >
                      <VisibilityOffIcon />
                    </IconButton>
                  </motion.div>
                </Box>
              </Box>
            </Box>

            {/* Comments Section */}
            <Box sx={{ p: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2 }}>
                Discussion
              </Typography>

              <Box mt={2}>
                <NewsComment newsId={selectedPost.id} />
              </Box>
            </Box>
          </Paper>
        </Box>
      </motion.div>
    );
  }, [selectedPost, handleBackToFeed, colors, bookmarked, toggleBookmark, handleHidePost]);

  // News Feed List Card Component
  const NewsCard: React.FC<{ post: NewsPost }> = useCallback(({ post }) => {
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
            <Box display="flex" alignItems="center" mb={2}>
              <SocietyAvatar society={post.society_data} size={32} />
              <Box>
                <Typography variant="subtitle1">{post.society_data.name}</Typography>
                <Typography variant="caption" color={colors.grey[300]}>
                  {formatDateTime(post.published_at)}
                </Typography>
              </Box>
            </Box>
            
            <Box
              sx={{
                cursor: 'pointer',
                '&:hover h5': { color: colors.blueAccent[300] },
              }}
              onClick={() => handlePostClick(post)}
            >
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {post.is_pinned && (
                  <PushPinIcon
                    sx={{
                      mr: 1,
                      verticalAlign: 'middle',
                      color: colors.greenAccent[500],
                      fontSize: '0.9em',
                    }}
                  />
                )}
                {post.title}
              </Typography>

              {post.image_url && (
                <Box
                  sx={{
                    height: '200px',
                    overflow: 'hidden',
                    borderRadius: 1,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.primary[600],
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '30px',
                      background: `linear-gradient(to top, ${colors.primary[400]}, transparent)`,
                    }
                  }}
                >
                  <img
                    src={post.image_url}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </Box>
              )}

              <Box
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  mb: 2,
                  color: colors.grey[200],
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{
                  __html: post.content.replace(/<img[^>]*>/g, '[Image]'),
                }}
              />
            </Box>

            <PostTags tags={post.tags} isFeatured={post.is_featured} />
          </CardContent>

          <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
            <Box display="flex" alignItems="center">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHidePost(post.id);
                }}
                aria-label="Hide post"
                sx={{ 
                  color: colors.grey[300],
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: colors.grey[100],
                    backgroundColor: colors.primary[300],
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardActions>
        </Card>
      </motion.div>
    );
  }, [colors, handlePostClick, handleHidePost]);

  const NewsFeed = useCallback(() => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight="200px">
          <CircularProgress sx={{ color: colors.blueAccent[400] }} />
        </Box>
      );
    }

    if (visiblePosts.length === 0) {
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
              onClick={() => {
                setHiddenPosts([]);
                localStorage.removeItem('hiddenNewsPosts');
              }}
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
    }

    return (
      <AnimatePresence>
        <Box>
          {visiblePosts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </Box>
      </AnimatePresence>
    );
  }, [loading, newsPosts, visiblePosts, hiddenPosts, societyId, colors, NewsCard]);

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        {selectedPost ? <DetailedPostView /> : <NewsFeed />}
      </AnimatePresence>

      {/* Menu is no longer needed as we've replaced it with direct hide functionality */}
    </Box>
  );
};

export default SocietyNewsFeed;