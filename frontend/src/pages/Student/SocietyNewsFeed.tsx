import React, { useState, useEffect } from 'react';
import { useTheme, Box, Typography, Paper, Button, CircularProgress, Chip, Avatar, Divider, Card, CardContent, CardActions, IconButton, Menu, MenuItem } from '@mui/material';
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

import NewsComment from "../../components/NewsComment"; // <--- Import your new NewsComment component
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  StarOutline as StarOutlineIcon,
  PushPin as PushPinIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

/**
 * Interface for a single news post
 */
interface NewsPost {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  attachment_name: string | null;
  society_data: {
    id: number;
    name: string;
    icon: string | null;
  };
  author_data: {
    id: number;
    username: string;
    full_name: string;
  };
  created_at: string;
  published_at: string;  // The field we'll format for precise timestamps
  is_pinned: boolean;
  is_featured: boolean;
  tags: string[];
  view_count: number;
  comment_count: number;
}

/**
 * Props for the SocietyNewsFeed component
 */
interface SocietyNewsFeedProps {
  societyId?: number; // If provided, only fetch news for this specific society
}

const SocietyNewsFeed: React.FC<SocietyNewsFeedProps> = ({ societyId }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [loading, setLoading] = useState<boolean>(true);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);

  useEffect(() => {
    fetchNews();
    const savedBookmarks = localStorage.getItem('newsBookmarks');
    if (savedBookmarks) {
      setBookmarked(JSON.parse(savedBookmarks));
    }
  }, [societyId]);

  /**
   * Fetch news from the API (published news for a given society or from all).
   */
  const fetchNews = async () => {
    setLoading(true);
    try {
      let response;
      if (societyId) {
        response = await apiClient.get(`/api/society/${societyId}/news/`);
      } else {
        response = await apiClient.get('/api/my-news-feed/');
      }
      setNewsPosts(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date-time for published_at.
   */
  const formatDateTime = (dateString: string) => {
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

  /**
   * Show the detailed post view when a news card is clicked.
   */
  const handlePostClick = (post: NewsPost) => {
    setSelectedPost(post);
  };

  /**
   * Return to feed from detail view.
   */
  const handleBackToFeed = () => {
    setSelectedPost(null);
  };

  /**
   * Toggle the "More" menu.
   */
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * Bookmark logic
   */
  const toggleBookmark = (postId: number) => {
    const updatedBookmarks = bookmarked.includes(postId)
      ? bookmarked.filter(id => id !== postId)
      : [...bookmarked, postId];

    setBookmarked(updatedBookmarks);
    localStorage.setItem('newsBookmarks', JSON.stringify(updatedBookmarks));
  };

  /**
   * Renders the detailed post view
   */
  const renderDetailedPost = () => {
    if (!selectedPost) return null;

    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBackToFeed} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">News Post</Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{ backgroundColor: colors.primary[400], overflow: 'hidden' }}
        >
          {selectedPost.image_url && (
            <Box 
              sx={{ 
                height: '300px', 
                overflow: 'hidden', 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.primary[600]
              }}
            >
              <img 
                src={selectedPost.image_url} 
                alt={selectedPost.title} 
                style={{ 
                  width: '100%', 
                  objectFit: 'cover',
                  maxHeight: '100%'
                }} 
              />
            </Box>
          )}
          
          <Box p={3}>
            {/* Society / Author Info */}
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                src={selectedPost.society_data.icon || undefined}
                sx={{ width: 40, height: 40, mr: 2 }}
              >
                {selectedPost.society_data.name.charAt(0)}
              </Avatar>
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
              {selectedPost.is_featured && (
                <Chip
                  icon={<StarOutlineIcon />}
                  label="Featured"
                  size="small"
                  sx={{ backgroundColor: colors.blueAccent[700], mr: 1, mb: 1 }}
                />
              )}
              {selectedPost.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{ mr: 1, mb: 1, backgroundColor: colors.grey[700] }}
                />
              ))}
            </Box>

            <Box
              mb={3}
              sx={{
                fontSize: '1rem',
                lineHeight: 1.6,
                '& img': { maxWidth: '100%' },
                '& a': { color: colors.blueAccent[300] },
              }}
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
            />

            {selectedPost.attachment_name && (
              <Button
                variant="outlined"
                sx={{ mt: 2, mb: 3 }}
                startIcon={<BookmarkIcon />}
              >
                Download {selectedPost.attachment_name}
              </Button>
            )}

            <Divider sx={{ mb: 3 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                <Box display="flex" alignItems="center" mr={3}>
                  <VisibilityIcon sx={{ fontSize: 18, mr: 1, color: colors.grey[300] }} />
                  <Typography variant="body2" color={colors.grey[300]}>
                    {selectedPost.view_count} views
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <CommentIcon sx={{ fontSize: 18, mr: 1, color: colors.grey[300] }} />
                  <Typography variant="body2" color={colors.grey[300]}>
                    {selectedPost.comment_count} comments
                  </Typography>
                </Box>
              </Box>
              
              <IconButton
                onClick={() => toggleBookmark(selectedPost.id)}
                sx={{
                  color: bookmarked.includes(selectedPost.id)
                    ? colors.greenAccent[500]
                    : colors.grey[300],
                }}
              >
                {bookmarked.includes(selectedPost.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Add the NewsComment component here to allow users to read/write comments */}
          <Box sx={{ p: 3 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Discussion
            </Typography>

            {/* This is where you integrate the new NewsComment component */}
            <Box mt={2}>
              <NewsComment newsId={selectedPost.id} />
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  /**
   * Renders the news feed (list of posts).
   */
  const renderNewsFeed = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (newsPosts.length === 0) {
      return (
        <Box textAlign="center" p={4}>
          <Typography variant="h6" color={colors.grey[300]}>
            {societyId
              ? "This society hasn't posted any news yet."
              : "No news posts from your societies yet."}
          </Typography>
        </Box>
      );
    }

    // Sort pinned first, then newest
    const sortedPosts = [...newsPosts].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return (
      <Box>
        {sortedPosts.map((post) => (
          <Card
            key={post.id}
            sx={{
              mb: 3,
              backgroundColor: colors.primary[400],
              borderLeft: post.is_pinned ? `4px solid ${colors.greenAccent[500]}` : 'none',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  src={post.society_data.icon || undefined}
                  sx={{ width: 32, height: 32, mr: 1.5 }}
                >
                  {post.society_data.name.charAt(0)}
                </Avatar>
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
                    }}
                  >
                    <img
                      src={post.image_url}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
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
                  }}
                  dangerouslySetInnerHTML={{
                    __html: post.content.replace(/<img[^>]*>/g, '[Image]'),
                  }}
                />
              </Box>

              <Box display="flex" flexWrap="wrap" mb={1}>
                {post.is_featured && (
                  <Chip
                    icon={<StarOutlineIcon />}
                    label="Featured"
                    size="small"
                    sx={{ backgroundColor: colors.blueAccent[700], mr: 1, mb: 1 }}
                  />
                )}

                {post.tags.slice(0, 3).map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ mr: 1, mb: 1, backgroundColor: colors.grey[700] }}
                  />
                ))}

                {post.tags.length > 3 && (
                  <Typography variant="caption" sx={{ color: colors.grey[300] }}>
                    +{post.tags.length - 3} more
                  </Typography>
                )}
              </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Box display="flex" alignItems="center">
                <Box display="flex" alignItems="center" mr={2}>
                  <VisibilityIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }} />
                  <Typography variant="caption" color={colors.grey[300]}>
                    {post.view_count}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center">
                  <CommentIcon sx={{ fontSize: 16, mr: 0.5, color: colors.grey[300] }} />
                  <Typography variant="caption" color={colors.grey[300]}>
                    {post.comment_count}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <IconButton
                  size="small"
                  onClick={() => toggleBookmark(post.id)}
                  sx={{
                    color: bookmarked.includes(post.id)
                      ? colors.greenAccent[500]
                      : colors.grey[300],
                  }}
                >
                  {bookmarked.includes(post.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>

                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ color: colors.grey[300] }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </CardActions>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {selectedPost ? renderDetailedPost() : renderNewsFeed()}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} />
          Hide
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SocietyNewsFeed;