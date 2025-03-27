import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CommentSection } from '../../components/CommentSection';
import { apiClient } from '../../api';

// Mock the API module
vi.mock('../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the CommentItem component
vi.mock('../../components/CommentItem', () => ({
  CommentItem: ({ comment, onReply }) => (
    <div data-testid={`comment-${comment.id}`}>
      <div>{comment.content}</div>
      <div>by {comment.user_data.username}</div>
      <button 
        onClick={() => onReply(comment.id, 'Test reply')}
        data-testid={`reply-button-${comment.id}`}
      >
        Reply
      </button>
    </div>
  ),
}));

const theme = createTheme({
  palette: {
    mode: 'light',
  }
});

describe('CommentSection Component', () => {
  const mockEventId = 123;
  
  const mockComments = [
    {
      id: 1,
      content: 'This is a test comment',
      create_at: '2023-01-01T12:00:00Z',
      user_data: {
        id: 101,
        username: 'testuser1',
      },
      parent_comment: null,
      replies: [],
      likes: 5,
      dislikes: 1,
      liked_by_user: false,
      disliked_by_user: false,
    },
    {
      id: 2,
      content: 'Another test comment',
      create_at: '2023-01-02T12:00:00Z',
      user_data: {
        id: 102,
        username: 'testuser2',
      },
      parent_comment: null,
      replies: [
        {
          id: 3,
          content: 'A reply to the second comment',
          create_at: '2023-01-03T12:00:00Z',
          user_data: {
            id: 103,
            username: 'testuser3',
          },
          parent_comment: 2,
          replies: [],
          likes: 3,
          dislikes: 0,
          liked_by_user: true,
          disliked_by_user: false,
        }
      ],
      likes: 10,
      dislikes: 2,
      liked_by_user: true,
      disliked_by_user: false,
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for API calls
    apiClient.get.mockResolvedValue({
      data: mockComments
    });
    
    apiClient.post.mockImplementation((url, data) => {
      return Promise.resolve({
        data: {
          id: 4,
          content: data.content,
          create_at: '2023-01-04T12:00:00Z',
          user_data: {
            id: 104,
            username: 'current_user',
          },
          parent_comment: data.parent_comment || null,
          replies: [],
          likes: 0,
          dislikes: 0,
          liked_by_user: false,
          disliked_by_user: false,
        }
      });
    });
  });

  it('renders loading state initially', async () => {
    const originalGet = apiClient.get;
    apiClient.get.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ data: mockComments }), 100);
    }));
    
    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
  });

  it('fetches and displays comments correctly', async () => {
    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByTestId('comment-1')).toBeInTheDocument();
    expect(screen.getByTestId('comment-2')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Another test comment')).toBeInTheDocument();
    
    expect(apiClient.get).toHaveBeenCalledWith(`/api/comments/?event_id=${mockEventId}`);
  });

  it('displays message when no comments are available', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: []
    });

    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('There is no comment now')).toBeInTheDocument();
  });

  it('handles adding a new comment', async () => {
    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Post the Comment');
    
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'A new comment' } });
    });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/comments/?event_id=${mockEventId}`,
      expect.objectContaining({
        event: mockEventId,
        content: 'A new comment'
      })
    );
    
    // Verify textarea is cleared after submission
    expect(textarea).toHaveValue('');
  });

  it('prevents submitting empty comments', async () => {
    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Post the Comment');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('handles replying to an existing comment', async () => {
    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    const replyButton = screen.getByTestId('reply-button-1');
    
    await act(async () => {
      fireEvent.click(replyButton);
    });
    
    expect(apiClient.post).toHaveBeenCalledWith(
      `/api/comments/?event_id=${mockEventId}`,
      expect.objectContaining({
        event: mockEventId,
        content: 'Test reply',
        parent_comment: 1
      })
    );
  });

  it('handles API error when fetching comments', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch comments'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching comments:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('handles API error when posting a comment', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Failed to create comment'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Post the Comment');
    
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'A new comment' } });
    });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error creating comment:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('handles API error when replying to a comment', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Failed to reply to comment'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider theme={theme}>
        <CommentSection eventId={mockEventId} />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    
    const replyButton = screen.getByTestId('reply-button-1');
    
    await act(async () => {
      fireEvent.click(replyButton);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error replying to comment:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });
});